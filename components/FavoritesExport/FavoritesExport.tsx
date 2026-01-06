'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { spotifyClient } from '@/lib/spotify/client';
import { NavidromeApiClient } from '@/lib/navidrome/client';
import { SpotifySavedTrack } from '@/types/spotify';
import { TrackMatch } from '@/types/matching';
import { FavoritesExportResult } from '@/types/favorites';
import { ProgressTracker, ProgressState } from '@/components/ProgressTracker';
import { FavoritesTrackList } from './FavoritesTrackList';
import { FavoritesResults } from './FavoritesResults';
import { createBatchMatcher, BatchMatcherOptions } from '@/lib/matching/batch-matcher';
import { getMatchStatistics } from '@/lib/matching/orchestrator';
import { createFavoritesExporter, DefaultFavoritesExporter } from '@/lib/export/favorites-exporter';

export function FavoritesExport() {
  const { spotify, navidrome } = useAuth();
  const [savedTracks, setSavedTracks] = useState<SpotifySavedTrack[]>([]);
  const [matches, setMatches] = useState<TrackMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressState, setProgressState] = useState<ProgressState | null>(null);
  const [exportResult, setExportResult] = useState<FavoritesExportResult | null>(null);
  const [isMatching, setIsMatching] = useState(false);
  const [skipUnmatched, setSkipUnmatched] = useState(false);

  useEffect(() => {
    async function fetchSavedTracks() {
      if (!spotify.isAuthenticated || !spotify.token) {
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        spotifyClient.setToken(spotify.token);
        const tracks = await spotifyClient.getAllSavedTracks();
        setSavedTracks(tracks);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch saved tracks');
      } finally {
        setLoading(false);
      }
    }

    fetchSavedTracks();
  }, [spotify.isAuthenticated, spotify.token]);

  const createInitialProgressState = useCallback((total: number, phase: ProgressState['phase'] = 'matching'): ProgressState => ({
    phase,
    progress: { current: 0, total, percent: 0 },
    statistics: { matched: 0, unmatched: 0, exported: 0, failed: 0 },
  }), []);

  const updateProgress = useCallback((
    state: ProgressState,
    updates: Partial<ProgressState>
  ): ProgressState => ({
    ...state,
    ...updates,
    progress: { ...state.progress, ...(updates.progress || {}) },
    statistics: { ...state.statistics, ...(updates.statistics || {}) },
  }), []);

  const handleMatchTracks = async () => {
    if (!spotify.isAuthenticated || !spotify.token || !navidrome.credentials) {
      setError('Please connect both Spotify and Navidrome to match tracks.');
      return;
    }

    if (savedTracks.length === 0) {
      return;
    }

    setIsMatching(true);
    setError(null);
    setMatches([]);
    setExportResult(null);

    try {
      spotifyClient.setToken(spotify.token);
      const navidromeClient = new NavidromeApiClient(
        navidrome.credentials.url,
        navidrome.credentials.username,
        navidrome.credentials.password,
        navidrome.token ?? undefined,
        navidrome.clientId ?? undefined
      );

      const batchMatcher = createBatchMatcher(spotifyClient, navidromeClient);

      const matcherOptions: BatchMatcherOptions = {
        enableISRC: true,
        enableFuzzy: true,
        enableStrict: true,
        fuzzyThreshold: 0.8,
      };

      let progress = createInitialProgressState(savedTracks.length);
      setProgressState(progress);

      const { matches: trackMatches } = await batchMatcher.matchTracks(
        savedTracks.map(t => t.track),
        matcherOptions,
        async (batchProgress) => {
          progress = updateProgress(progress, {
            phase: 'matching',
            currentTrack: batchProgress.currentTrack ? {
              name: batchProgress.currentTrack.name,
              artist: batchProgress.currentTrack.artists?.map(a => a.name).join(', ') || 'Unknown',
              index: batchProgress.current - 1,
              total: batchProgress.total,
            } : undefined,
            progress: {
              current: batchProgress.current,
              total: batchProgress.total,
              percent: batchProgress.percent,
            },
          });
          setProgressState({ ...progress });
        }
      );

      const statistics = getMatchStatistics(trackMatches);

      progress = updateProgress(progress, {
        phase: 'idle',
        progress: { current: savedTracks.length, total: savedTracks.length, percent: 100 },
        statistics: {
          matched: statistics.matched,
          unmatched: statistics.unmatched + statistics.ambiguous,
          exported: 0,
          failed: 0,
        },
      });
      setProgressState(progress);

      setMatches(trackMatches);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Matching failed';
      setError(errorMessage);
      setProgressState({
        phase: 'error',
        progress: { current: 0, total: 0, percent: 0 },
        statistics: { matched: 0, unmatched: 0, exported: 0, failed: 0 },
        error: errorMessage,
      });
    } finally {
      setIsMatching(false);
    }
  };

  const handleExport = async () => {
    if (!spotify.isAuthenticated || !spotify.token || !navidrome.credentials) {
      setError('Please connect both Spotify and Navidrome to export.');
      return;
    }

    if (matches.length === 0) {
      return;
    }

    setLoading(true);
    setError(null);
    setExportResult(null);

    try {
      spotifyClient.setToken(spotify.token);
      const navidromeClient = new NavidromeApiClient(
        navidrome.credentials.url,
        navidrome.credentials.username,
        navidrome.credentials.password,
        navidrome.token ?? undefined,
        navidrome.clientId ?? undefined
      );

      const favoritesExporter: DefaultFavoritesExporter = createFavoritesExporter(navidromeClient) as DefaultFavoritesExporter;

      const matchedCount = matches.filter(m => m.status === 'matched').length;
      let progress = createInitialProgressState(matchedCount, 'exporting');
      setProgressState(progress);

      const result = await favoritesExporter.exportFavorites(matches, {
        skipUnmatched,
        onProgress: async (exportProgress) => {
          progress = updateProgress(progress, {
            phase: exportProgress.status === 'completed' ? 'completed' : 'exporting',
            currentTrack: exportProgress.currentTrack ? {
              name: exportProgress.currentTrack,
              artist: '',
              index: exportProgress.current - 1,
              total: exportProgress.total,
            } : undefined,
            progress: {
              current: exportProgress.current,
              total: exportProgress.total,
              percent: exportProgress.percent,
            },
            statistics: {
              matched: matchedCount,
              unmatched: matches.length - matchedCount,
              exported: exportProgress.current,
              failed: 0,
            },
          });
          setProgressState({ ...progress });
        },
      });

      const statistics = getMatchStatistics(matches);

      setProgressState({
        phase: 'completed',
        progress: { current: matchedCount, total: matchedCount, percent: 100 },
        statistics: {
          matched: statistics.matched,
          unmatched: statistics.unmatched + statistics.ambiguous,
          exported: result.statistics.starred,
          failed: result.statistics.failed,
        },
      });

      setExportResult(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Export failed';
      setError(errorMessage);
      setProgressState({
        phase: 'error',
        progress: { current: 0, total: 0, percent: 0 },
        statistics: { matched: 0, unmatched: 0, exported: 0, failed: 0 },
        error: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelExport = () => {
    setProgressState(null);
    setExportResult(null);
  };

  const handleCompleteExport = () => {
    setLoading(false);
  };

  const handleExportAgain = () => {
    setProgressState(null);
    setExportResult(null);
    handleExport();
  };

  const handleBackToTracks = () => {
    setProgressState(null);
    setExportResult(null);
  };

  const handleMatchAgain = () => {
    setMatches([]);
    setExportResult(null);
    setProgressState(null);
  };

  const statistics = matches.length > 0 ? getMatchStatistics(matches) : null;
  const matchedCount = statistics?.matched ?? 0;
  const unmatchedCount = (statistics?.unmatched ?? 0) + (statistics?.ambiguous ?? 0);

  if (!spotify.isAuthenticated) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-gray-500">Please connect your Spotify account to view saved tracks.</p>
      </div>
    );
  }

  if (progressState) {
    return (
      <div className="py-8">
        <div className="mb-6">
          <button
            onClick={progressState.phase === 'completed' ? handleBackToTracks : handleCancelExport}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {progressState.phase === 'completed' ? 'Back to Tracks' : 'Cancel'}
          </button>
        </div>
        <ProgressTracker
          state={progressState}
          onCancel={progressState.phase === 'exporting' ? handleCancelExport : undefined}
          onComplete={handleCompleteExport}
        />
        {exportResult && progressState.phase === 'completed' && (
          <div className="mt-6">
            <FavoritesResults
              result={exportResult}
              totalTracks={savedTracks.length}
              onExportAgain={handleExportAgain}
              onBackToTracks={handleBackToTracks}
              onMatchAgain={handleMatchAgain}
            />
          </div>
        )}
      </div>
    );
  }

  if (loading && savedTracks.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500"></div>
      </div>
    );
  }

  if (error && savedTracks.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  if (savedTracks.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-gray-500">No saved tracks found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Liked Songs</h1>
          <p className="text-sm text-gray-500 mt-1">
            {savedTracks.length.toLocaleString()} tracks saved in your Spotify library
          </p>
        </div>
        {!matches.length && navidrome.isConnected && (
          <button
            onClick={handleMatchTracks}
            disabled={isMatching || !navidrome.isConnected}
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isMatching ? 'Matching...' : 'Match Tracks'}
          </button>
        )}
        {!matches.length && !navidrome.isConnected && (
          <p className="text-sm text-yellow-600 dark:text-yellow-400">
            Connect Navidrome to match and export tracks
          </p>
        )}
      </div>

      {matches.length > 0 && statistics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <div className="text-2xl font-bold text-gray-900">
              {savedTracks.length}
            </div>
            <div className="text-xs text-gray-500">Total Tracks</div>
          </div>
          <div className="rounded-lg bg-green-50 p-3 text-center">
            <div className="text-2xl font-bold text-green-700">
              {statistics.matched}
            </div>
            <div className="text-xs text-green-600">Matched</div>
          </div>
          <div className="rounded-lg bg-yellow-50 p-3 text-center">
            <div className="text-2xl font-bold text-yellow-700">
              {statistics.ambiguous}
            </div>
            <div className="text-xs text-yellow-600">Ambiguous</div>
          </div>
          <div className="rounded-lg bg-red-50 p-3 text-center">
            <div className="text-2xl font-bold text-red-700">
              {statistics.unmatched}
            </div>
            <div className="text-xs text-red-600">Unmatched</div>
          </div>
        </div>
      )}

      {matches.length > 0 && (
        <div className="rounded-lg border border-gray-200 p-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={skipUnmatched}
              onChange={(e) => setSkipUnmatched(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Skip unmatched tracks
            </span>
            <span className="text-sm text-gray-500">
              ({matchedCount} will star, {skipUnmatched ? unmatchedCount : 0} will skip)
            </span>
          </label>
        </div>
      )}

      {matches.length > 0 && (
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={handleMatchAgain}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Match Again
          </button>
          <button
            onClick={handleExport}
            disabled={matchedCount === 0 || loading}
            className="rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Star {matchedCount} Tracks
          </button>
        </div>
      )}

      <FavoritesTrackList
        tracks={savedTracks}
        matches={matches}
        isLoading={isMatching}
      />
    </div>
  );
}

export default FavoritesExport;

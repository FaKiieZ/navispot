import { useState, useCallback } from 'react';
import { SpotifyTrack } from '@/types/spotify';
import { NavidromeApiClient } from '@/lib/navidrome/client';
import {
  IncrementalUpdateOrchestrator,
  UpdateResult,
  CachedTrackMatch,
} from '@/lib/export/incremental-update-orchestrator';
import { ExportProgress } from '@/types/export';

interface UseIncrementalUpdateOptions {
  navidromeClient: NavidromeApiClient;
}

interface UseIncrementalUpdateReturn {
  isUpdating: boolean;
  progress: ExportProgress | null;
  result: UpdateResult | null;
  error: string | null;
  startUpdate: (
    navidromePlaylistId: string,
    spotifyTracks: SpotifyTrack[],
    playlistName: string,
    cachedMatches?: Record<string, CachedTrackMatch>
  ) => Promise<void>;
  cancelUpdate: () => void;
  reset: () => void;
}

/**
 * Hook for managing incremental playlist updates
 * Handles orchestrating the update process and tracking progress
 */
export function useIncrementalUpdate({
  navidromeClient,
}: UseIncrementalUpdateOptions): UseIncrementalUpdateReturn {
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [result, setResult] = useState<UpdateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useState<AbortController | null>(null)[1];

  const startUpdate = useCallback(
    async (
      navidromePlaylistId: string,
      spotifyTracks: SpotifyTrack[],
      playlistName: string,
      cachedMatches?: Record<string, CachedTrackMatch>
    ) => {
      setIsUpdating(true);
      setError(null);
      setProgress(null);
      setResult(null);

      try {
        const abortController = new AbortController();
        const orchestrator = new IncrementalUpdateOrchestrator(
          navidromeClient
        );

        const updateResult = await orchestrator.updatePlaylist(
          navidromePlaylistId,
          spotifyTracks,
          playlistName,
          cachedMatches,
          {
            signal: abortController.signal,
            onProgress: (p: ExportProgress) => {
              setProgress(p);
            },
          }
        );

        setResult(updateResult);

        if (!updateResult.success) {
          setError('Update failed');
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error during update';
        setError(errorMessage);
      } finally {
        setIsUpdating(false);
      }
    },
    [navidromeClient]
  );

  const cancelUpdate = useCallback(() => {
    setIsUpdating(false);
    setProgress(null);
    setError('Update cancelled by user');
  }, []);

  const reset = useCallback(() => {
    setIsUpdating(false);
    setProgress(null);
    setResult(null);
    setError(null);
  }, []);

  return {
    isUpdating,
    progress,
    result,
    error,
    startUpdate,
    cancelUpdate,
    reset,
  };
}

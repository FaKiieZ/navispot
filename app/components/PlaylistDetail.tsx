'use client';

import { useState } from 'react';
import { SpotifyPlaylistTrack } from '@/types/spotify';
import { TrackMatch } from '@/types/matching';
import { TrackList } from './TrackList';
import { MatchStatistics } from './MatchStatistics';

export interface PlaylistDetailProps {
  playlistId: string;
  playlistName: string;
  tracks: SpotifyPlaylistTrack[];
  matches: TrackMatch[];
  statistics: {
    total: number;
    matched: number;
    ambiguous: number;
    unmatched: number;
    byStrategy: Record<string, number>;
  };
  onBack?: () => void;
  onExport?: () => void;
}

export function PlaylistDetail({
  playlistId,
  playlistName,
  tracks,
  matches,
  statistics,
  onBack,
  onExport,
}: PlaylistDetailProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { total, matched, ambiguous } = statistics;
  const matchRate = total > 0 ? Math.round(((matched + ambiguous) / total) * 100) : 0;

  return (
    <div className="space-y-6" data-playlist-id={playlistId}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              aria-label="Go back"
            >
              <svg
                className="w-5 h-5 text-zinc-600 dark:text-zinc-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {playlistName}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              {tracks.length} tracks
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onExport && (
            <button
              onClick={onExport}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Export Playlist
            </button>
          )}
        </div>
      </div>

      <MatchStatistics statistics={statistics} />

      <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
        >
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            Track List
          </span>
          <svg
            className={`w-5 h-5 text-zinc-500 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
        {isExpanded && (
          <div className="bg-white dark:bg-black">
            <TrackList tracks={tracks} matches={matches} />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
        <span>
          Processing time: {statistics.total > 0 ? 'Complete' : 'Not processed'} · {matchRate}% match rate
        </span>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-500 hover:text-blue-600 transition-colors"
        >
          {isExpanded ? 'Hide tracks' : 'Show tracks'}
        </button>
      </div>
    </div>
  );
}

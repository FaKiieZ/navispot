import React from 'react';

interface ExportProgressPanelProps {
  playlistName: string;
  phase: 'matching' | 'exporting' | 'completed';
  progress: {
    current: number;
    total: number;
    percent: number;
  };
  currentTrack?: {
    name: string;
    artist: string;
    index?: number;
    total?: number;
  };
  statistics: {
    matched: number;
    unmatched: number;
    exported: number;
    failed: number;
  };
  onCancel: () => void;
}

export function ExportProgressPanel({
  playlistName,
  phase,
  progress,
  currentTrack,
  statistics,
  onCancel,
}: ExportProgressPanelProps) {
  return (
    <div className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Exporting: {playlistName}
        </h3>
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            phase === 'matching'
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
              : phase === 'exporting'
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
          }`}
        >
          {phase === 'matching'
            ? 'Matching'
            : phase === 'exporting'
              ? 'Exporting'
              : 'Complete'}
        </span>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1">
          <span>Processing...</span>
          <span className="font-medium">{progress.percent}%</span>
        </div>
        <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              phase === 'completed' ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      </div>

      {currentTrack && (
        <div className="flex items-center gap-2 p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg mb-3">
          <svg
            className="w-4 h-4 text-zinc-400 animate-pulse"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z"
            />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
              {currentTrack.name}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
              {currentTrack.artist}
            </p>
          </div>
          {currentTrack.index !== undefined && currentTrack.total !== undefined && (
            <div className="text-xs text-zinc-400">
              {currentTrack.index + 1}/{currentTrack.total}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 text-xs">
        <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          {statistics.matched} matched
        </span>
        <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          {statistics.unmatched} unmatched
        </span>
        <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
            />
          </svg>
          {statistics.exported} exported
        </span>
      </div>
    </div>
  );
}

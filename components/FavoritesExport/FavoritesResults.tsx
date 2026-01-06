'use client';

import { useState } from 'react';
import { FavoritesExportResult } from '@/types/favorites';

interface FavoritesResultsProps {
  result: FavoritesExportResult;
  totalTracks: number;
  onExportAgain: () => void;
  onBackToTracks: () => void;
  onMatchAgain: () => void;
}

const formatNumber = (num: number): string => num.toLocaleString();

const formatDuration = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

interface SummaryCardProps {
  label: string;
  value: number;
  subValue?: string;
  color: 'green' | 'yellow' | 'red' | 'blue' | 'gray';
  icon: React.ReactNode;
}

function SummaryCard({ label, value, subValue, color, icon }: SummaryCardProps) {
  const colorClasses = {
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400',
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400',
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400',
    gray: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-400',
  };

  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm font-medium opacity-80">{label}</span>
      </div>
      <div className="text-3xl font-bold">{formatNumber(value)}</div>
      {subValue && <div className="text-sm opacity-70 mt-1">{subValue}</div>}
    </div>
  );
}

interface ErrorItemProps {
  error: { trackName: string; artistName: string; reason: string };
  index: number;
}

function ErrorItem({ error, index }: ErrorItemProps) {
  return (
    <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center text-sm font-medium">
        {index + 1}
      </span>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
          {error.trackName}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
          {error.artistName}
        </div>
        <div className="text-sm text-red-600 dark:text-red-400 mt-1">
          {error.reason}
        </div>
      </div>
    </div>
  );
}

export function FavoritesResults({ result, totalTracks, onExportAgain, onBackToTracks, onMatchAgain }: FavoritesResultsProps) {
  const [showErrors, setShowErrors] = useState(false);

  const starRate = totalTracks > 0
    ? Math.round((result.statistics.starred / totalTracks) * 100)
    : 0;

  const successRate = result.statistics.total > 0
    ? Math.round(((result.statistics.starred + result.statistics.skipped) / result.statistics.total) * 100)
    : 0;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                Export Complete
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                {formatDuration(result.duration)} • {new Date().toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {starRate}% Starred
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <SummaryCard
              label="Total Tracks"
              value={totalTracks}
              color="gray"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              }
            />
            <SummaryCard
              label="Starred"
              value={result.statistics.starred}
              subValue={`${successRate}% success`}
              color="green"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              }
            />
            <SummaryCard
              label="Skipped"
              value={result.statistics.skipped}
              color="yellow"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              }
            />
            <SummaryCard
              label="Failed"
              value={result.statistics.failed}
              color="red"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              }
            />
            <SummaryCard
              label="Duration"
              value={Math.round(result.duration / 1000)}
              subValue="seconds"
              color="blue"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <SummaryCard
              label="Success"
              value={successRate}
              subValue="%"
              color="green"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          </div>

          {result.errors.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                  Failed Tracks ({result.errors.length})
                </h3>
                <button
                  onClick={() => setShowErrors(!showErrors)}
                  className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                  {showErrors ? 'Hide' : 'Show'} Details
                </button>
              </div>
              {showErrors && (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {result.errors.slice(0, 10).map((error, index) => (
                    <ErrorItem key={index} error={error} index={index} />
                  ))}
                  {result.errors.length > 10 && (
                    <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 py-2">
                      Showing 10 of {result.errors.length} errors
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <div className="text-sm text-zinc-500 dark:text-zinc-400">
              {result.success ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Successfully starred {result.statistics.starred} tracks in Navidrome
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Some tracks could not be starred
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onMatchAgain}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Match Again
              </button>
              <button
                onClick={onBackToTracks}
                className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                Back to Tracks
              </button>
              <button
                onClick={onExportAgain}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Star Again
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FavoritesResults;

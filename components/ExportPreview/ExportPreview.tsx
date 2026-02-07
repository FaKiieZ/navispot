'use client';

import { useExportPreview } from './useExportPreview';
import { ExportOptions, MatchStatistics } from '@/types/export';
import { NavidromePlaylist } from '@/types/navidrome';

interface ExportPreviewProps {
  playlistName: string;
  statistics: MatchStatistics;
  existingPlaylists?: NavidromePlaylist[];
  onConfirm: (options: ExportOptions) => void;
  onCancel: () => void;
}

export function ExportPreview({
  playlistName,
  statistics,
  existingPlaylists = [],
  onConfirm,
  onCancel,
}: ExportPreviewProps) {
  const {
    selectedMode,
    selectedPlaylistId,
    skipUnmatched,
    setMode,
    setSelectedPlaylistId,
    setSkipUnmatched,
    estimatedExported,
    estimatedSkipped,
    canExport,
  } = useExportPreview({ statistics, existingPlaylists });

  const handleConfirm = () => {
    if (!canExport) return;
    onConfirm({
      mode: selectedMode,
      existingPlaylistId: selectedPlaylistId,
      skipUnmatched,
    });
  };

  const matchedPercentage = statistics.total > 0
    ? Math.round((statistics.matched / statistics.total) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl bg-white dark:bg-zinc-900 shadow-2xl border border-gray-200 dark:border-zinc-800">
        <div className="border-b border-gray-200 dark:border-zinc-800 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Export Preview
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {playlistName}
          </p>
        </div>

        <div className="space-y-6 px-6 py-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg bg-gray-50 dark:bg-zinc-800 p-3 text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {statistics.total}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Total Tracks</div>
            </div>
            <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-3 text-center">
              <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                {statistics.matched}
              </div>
              <div className="text-xs text-green-600 dark:text-green-400">Matched</div>
            </div>
            <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-3 text-center">
              <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
                {statistics.ambiguous}
              </div>
              <div className="text-xs text-yellow-600 dark:text-yellow-400">Ambiguous</div>
            </div>
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-center">
              <div className="text-2xl font-bold text-red-700 dark:text-red-400">
                {statistics.unmatched}
              </div>
              <div className="text-xs text-red-600 dark:text-red-400">Unmatched</div>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Export Mode
            </label>
            <div className="space-y-2">
              <label className={`flex cursor-pointer items-center rounded-lg border p-3 transition-colors ${
                selectedMode === 'create'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500'
                  : 'border-gray-200 hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800'
              }`}>
                <input
                  type="radio"
                  name="exportMode"
                  value="create"
                  checked={selectedMode === 'create'}
                  onChange={() => setMode('create')}
                  className="h-4 w-4 text-blue-600 dark:text-blue-500 focus:ring-blue-500"
                />
                <div className="ml-3">
                  <div className="font-medium text-gray-900 dark:text-gray-100">Create New Playlist</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Create a new playlist in Navidrome
                  </div>
                </div>
              </label>

              <label className={`flex cursor-pointer items-center rounded-lg border p-3 transition-colors ${
                selectedMode === 'append'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500'
                  : 'border-gray-200 hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800'
              }`}>
                <input
                  type="radio"
                  name="exportMode"
                  value="append"
                  checked={selectedMode === 'append'}
                  onChange={() => setMode('append')}
                  className="h-4 w-4 text-blue-600 dark:text-blue-500 focus:ring-blue-500"
                />
                <div className="ml-3 flex-1">
                  <div className="font-medium text-gray-900 dark:text-gray-100">Append to Existing</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Add tracks to an existing playlist
                  </div>
                </div>
              </label>

              {selectedMode === 'append' && (
                <select
                  value={selectedPlaylistId || ''}
                  onChange={(e) => setSelectedPlaylistId(e.target.value || undefined)}
                  className="ml-7 w-full rounded-lg border border-gray-300 dark:border-zinc-700 p-2 text-sm bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="" className="dark:bg-zinc-800">Select a playlist</option>
                  {existingPlaylists.map((playlist) => (
                    <option key={playlist.id} value={playlist.id} className="dark:bg-zinc-800">
                      {playlist.name} ({playlist.songCount} tracks)
                    </option>
                  ))}
                </select>
              )}

              <label className={`flex cursor-pointer items-center rounded-lg border p-3 transition-colors ${
                selectedMode === 'sync'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500'
                  : 'border-gray-200 hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800'
              }`}>
                <input
                  type="radio"
                  name="exportMode"
                  value="sync"
                  checked={selectedMode === 'sync'}
                  onChange={() => setMode('sync')}
                  className="h-4 w-4 text-blue-600 dark:text-blue-500 focus:ring-blue-500"
                />
                <div className="ml-3 flex-1">
                  <div className="font-medium text-gray-900 dark:text-gray-100">Sync to Existing</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Add only missing tracks to an existing playlist
                  </div>
                </div>
              </label>

              {selectedMode === 'sync' && (
                <select
                  value={selectedPlaylistId || ''}
                  onChange={(e) => setSelectedPlaylistId(e.target.value || undefined)}
                  className="ml-7 w-full rounded-lg border border-gray-300 dark:border-zinc-700 p-2 text-sm bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="" className="dark:bg-zinc-800">Select a playlist</option>
                  {existingPlaylists.map((playlist) => (
                    <option key={playlist.id} value={playlist.id} className="dark:bg-zinc-800">
                      {playlist.name} ({playlist.songCount} tracks)
                    </option>
                  ))}
                </select>
              )}

              <label className={`flex cursor-pointer items-center rounded-lg border p-3 transition-colors ${
                selectedMode === 'overwrite'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500'
                  : 'border-gray-200 hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800'
              }`}>
                <input
                  type="radio"
                  name="exportMode"
                  value="overwrite"
                  checked={selectedMode === 'overwrite'}
                  onChange={() => setMode('overwrite')}
                  className="h-4 w-4 text-blue-600 dark:text-blue-500 focus:ring-blue-500"
                />
                <div className="ml-3 flex-1">
                  <div className="font-medium text-gray-900 dark:text-gray-100">Overwrite Existing</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Replace all tracks in an existing playlist
                  </div>
                </div>
              </label>

              {selectedMode === 'overwrite' && (
                <select
                  value={selectedPlaylistId || ''}
                  onChange={(e) => setSelectedPlaylistId(e.target.value || undefined)}
                  className="ml-7 w-full rounded-lg border border-gray-300 dark:border-zinc-700 p-2 text-sm bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="" className="dark:bg-zinc-800">Select a playlist</option>
                  {existingPlaylists.map((playlist) => (
                    <option key={playlist.id} value={playlist.id} className="dark:bg-zinc-800">
                      {playlist.name} ({playlist.songCount} tracks)
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-zinc-700 p-4">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={skipUnmatched}
                  onChange={(e) => setSkipUnmatched(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 dark:text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Skip unmatched tracks
                </span>
              </label>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {estimatedExported} will export, {estimatedSkipped} will skip
              </span>
            </div>
          </div>

          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                Match Rate
              </span>
              <span className="text-lg font-bold text-blue-700 dark:text-blue-400">
                {matchedPercentage}%
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-blue-200 dark:bg-blue-900/50">
              <div
                className="h-full rounded-full bg-blue-600 dark:bg-blue-500 transition-all"
                style={{ width: `${matchedPercentage}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 dark:border-zinc-800 px-6 py-4">
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-300 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canExport}
            className="rounded-lg bg-blue-600 dark:bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Export {estimatedExported} Tracks
          </button>
        </div>
      </div>
    </div>
  );
}

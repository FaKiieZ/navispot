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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Export Preview
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {playlistName}
          </p>
        </div>

        <div className="space-y-6 px-6 py-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg bg-gray-50 p-3 text-center">
              <div className="text-2xl font-bold text-gray-900">
                {statistics.total}
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

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Export Mode
            </label>
            <div className="space-y-2">
              <label className={`flex cursor-pointer items-center rounded-lg border p-3 transition-colors ${
                selectedMode === 'create'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="exportMode"
                  value="create"
                  checked={selectedMode === 'create'}
                  onChange={() => setMode('create')}
                  className="h-4 w-4 text-blue-600"
                />
                <div className="ml-3">
                  <div className="font-medium text-gray-900">Create New Playlist</div>
                  <div className="text-sm text-gray-500">
                    Create a new playlist in Navidrome
                  </div>
                </div>
              </label>

              <label className={`flex cursor-pointer items-center rounded-lg border p-3 transition-colors ${
                selectedMode === 'append'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="exportMode"
                  value="append"
                  checked={selectedMode === 'append'}
                  onChange={() => setMode('append')}
                  className="h-4 w-4 text-blue-600"
                />
                <div className="ml-3 flex-1">
                  <div className="font-medium text-gray-900">Append to Existing</div>
                  <div className="text-sm text-gray-500">
                    Add tracks to an existing playlist
                  </div>
                </div>
              </label>

              {selectedMode === 'append' && (
                <select
                  value={selectedPlaylistId || ''}
                  onChange={(e) => setSelectedPlaylistId(e.target.value || undefined)}
                  className="ml-7 w-full rounded-lg border border-gray-300 p-2 text-sm"
                >
                  <option value="">Select a playlist</option>
                  {existingPlaylists.map((playlist) => (
                    <option key={playlist.id} value={playlist.id}>
                      {playlist.name} ({playlist.songCount} tracks)
                    </option>
                  ))}
                </select>
              )}

              <label className={`flex cursor-pointer items-center rounded-lg border p-3 transition-colors ${
                selectedMode === 'sync'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="exportMode"
                  value="sync"
                  checked={selectedMode === 'sync'}
                  onChange={() => setMode('sync')}
                  className="h-4 w-4 text-blue-600"
                />
                <div className="ml-3 flex-1">
                  <div className="font-medium text-gray-900">Sync to Existing</div>
                  <div className="text-sm text-gray-500">
                    Add only missing tracks to an existing playlist
                  </div>
                </div>
              </label>

              {selectedMode === 'sync' && (
                <select
                  value={selectedPlaylistId || ''}
                  onChange={(e) => setSelectedPlaylistId(e.target.value || undefined)}
                  className="ml-7 w-full rounded-lg border border-gray-300 p-2 text-sm"
                >
                  <option value="">Select a playlist</option>
                  {existingPlaylists.map((playlist) => (
                    <option key={playlist.id} value={playlist.id}>
                      {playlist.name} ({playlist.songCount} tracks)
                    </option>
                  ))}
                </select>
              )}

              <label className={`flex cursor-pointer items-center rounded-lg border p-3 transition-colors ${
                selectedMode === 'overwrite'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="exportMode"
                  value="overwrite"
                  checked={selectedMode === 'overwrite'}
                  onChange={() => setMode('overwrite')}
                  className="h-4 w-4 text-blue-600"
                />
                <div className="ml-3 flex-1">
                  <div className="font-medium text-gray-900">Overwrite Existing</div>
                  <div className="text-sm text-gray-500">
                    Replace all tracks in an existing playlist
                  </div>
                </div>
              </label>

              {selectedMode === 'overwrite' && (
                <select
                  value={selectedPlaylistId || ''}
                  onChange={(e) => setSelectedPlaylistId(e.target.value || undefined)}
                  className="ml-7 w-full rounded-lg border border-gray-300 p-2 text-sm"
                >
                  <option value="">Select a playlist</option>
                  {existingPlaylists.map((playlist) => (
                    <option key={playlist.id} value={playlist.id}>
                      {playlist.name} ({playlist.songCount} tracks)
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={skipUnmatched}
                  onChange={(e) => setSkipUnmatched(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm font-medium text-gray-700">
                  Skip unmatched tracks
                </span>
              </label>
              <span className="text-sm text-gray-500">
                {estimatedExported} will export, {estimatedSkipped} will skip
              </span>
            </div>
          </div>

          <div className="rounded-lg bg-blue-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-700">
                Match Rate
              </span>
              <span className="text-lg font-bold text-blue-700">
                {matchedPercentage}%
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-blue-200">
              <div
                className="h-full rounded-full bg-blue-600 transition-all"
                style={{ width: `${matchedPercentage}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canExport}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Export {estimatedExported} Tracks
          </button>
        </div>
      </div>
    </div>
  );
}

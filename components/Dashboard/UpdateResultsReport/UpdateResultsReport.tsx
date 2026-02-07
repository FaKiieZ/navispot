'use client';

import { UpdateResult } from '@/lib/export/incremental-update-orchestrator';

export interface UpdateResultsReportProps {
  result: UpdateResult;
  onDone: () => void;
  onUpdateAgain: () => void;
}

export function UpdateResultsReport({
  result,
  onDone,
  onUpdateAgain,
}: UpdateResultsReportProps) {
  const durationSeconds = Math.round(result.duration / 1000);

  return (
    <div className="rounded-lg bg-white">
      <div className={`border-b px-6 py-4 ${result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
        <div className="flex items-center gap-3">
          {result.success ? (
            <>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-200">
                <span className="text-lg font-bold text-green-700">✓</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-green-900">Update Complete</h2>
                <p className="text-sm text-green-700">Playlist updated successfully</p>
              </div>
            </>
          ) : (
            <>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-200">
                <span className="text-lg font-bold text-red-700">✕</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-red-900">Update Failed</h2>
                <p className="text-sm text-red-700">There was an issue updating the playlist</p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="px-6 py-4">
        <div className="mb-6">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">Playlist: {result.playlistName}</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg bg-gray-50 p-3 text-center">
              <div className="text-xl font-bold text-gray-900">
                {result.statistics.totalSpotifyTracks}
              </div>
              <div className="text-xs text-gray-500">Spotify Tracks</div>
            </div>
            <div className="rounded-lg bg-blue-50 p-3 text-center">
              <div className="text-xl font-bold text-blue-700">
                {result.statistics.alreadyInPlaylist}
              </div>
              <div className="text-xs text-blue-600">Already Here</div>
            </div>
            <div className="rounded-lg bg-green-50 p-3 text-center">
              <div className="text-xl font-bold text-green-700">
                {result.statistics.addedToPlaylist}
              </div>
              <div className="text-xs text-green-600">Added</div>
            </div>
            <div className="rounded-lg bg-red-50 p-3 text-center">
              <div className="text-xl font-bold text-red-700">
                {result.statistics.failed}
              </div>
              <div className="text-xs text-red-600">Failed</div>
            </div>
          </div>
        </div>

        <div className="mb-6 border-t pt-4">
          <p className="text-sm text-gray-500">Duration: {durationSeconds}s</p>
        </div>

        {result.tracksAdded.length > 0 && (
          <div className="mb-6">
            <h4 className="mb-3 text-sm font-semibold text-green-700">Tracks Added ({result.tracksAdded.length})</h4>
            <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-green-200 bg-green-50 p-3">
              {result.tracksAdded.map((track, index) => (
                <div key={`${track.spotifyId}-${index}`} className="text-sm text-gray-700">
                  • {track.title}
                </div>
              ))}
            </div>
          </div>
        )}

        {result.tracksSkipped.length > 0 && (
          <div className="mb-6">
            <h4 className="mb-3 text-sm font-semibold text-blue-700">Tracks Skipped ({result.tracksSkipped.length})</h4>
            <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-blue-200 bg-blue-50 p-3">
              {result.tracksSkipped.slice(0, 10).map((trackId, index) => (
                <div key={`${trackId}-${index}`} className="text-xs text-gray-600">
                  • {trackId}
                </div>
              ))}
              {result.tracksSkipped.length > 10 && (
                <div className="text-xs font-medium text-gray-500">
                  ... and {result.tracksSkipped.length - 10} more
                </div>
              )}
            </div>
          </div>
        )}

        {result.errors.length > 0 && (
          <div className="mb-6">
            <h4 className="mb-3 text-sm font-semibold text-red-700">Errors ({result.errors.length})</h4>
            <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-red-200 bg-red-50 p-3">
              {result.errors.map((error, index) => (
                <div key={index} className="text-xs text-red-700">
                  <strong>{error.trackName}</strong> by {error.artistName}: {error.reason}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
        <button
          onClick={onDone}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Done
        </button>
        <button
          onClick={onUpdateAgain}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Update Again
        </button>
      </div>
    </div>
  );
}

'use client';

import { ExportProgress } from '@/types/export';

interface UpdateProgressTrackerProps {
  progress: ExportProgress;
  onCancel: () => void;
  onPause?: () => void;
}

export function UpdateProgressTracker({
  progress,
  onCancel,
  onPause,
}: UpdateProgressTrackerProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'preparing':
        return 'bg-blue-50';
      case 'exporting':
        return 'bg-blue-50';
      case 'completed':
        return 'bg-green-50';
      case 'failed':
        return 'bg-red-50';
      default:
        return 'bg-gray-50';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'preparing':
        return 'text-blue-700';
      case 'exporting':
        return 'text-blue-700';
      case 'completed':
        return 'text-green-700';
      case 'failed':
        return 'text-red-700';
      default:
        return 'text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'preparing':
        return 'Preparing update...';
      case 'exporting':
        return 'Adding tracks...';
      case 'completed':
        return 'Update complete';
      case 'failed':
        return 'Update failed';
      default:
        return 'Processing...';
    }
  };

  return (
    <div className={`rounded-lg p-6 ${getStatusColor(progress.status)}`}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className={`text-lg font-semibold ${getStatusTextColor(progress.status)}`}>
          {getStatusLabel(progress.status)}
        </h3>
        <span className={`text-sm font-medium ${getStatusTextColor(progress.status)}`}>
          {progress.current} / {progress.total}
        </span>
      </div>

      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm text-gray-600">Progress</div>
          <div className="text-sm font-semibold text-gray-700">{progress.percent}%</div>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-gray-200">
          <div
            className={`h-full rounded-full transition-all ${
              progress.status === 'failed'
                ? 'bg-red-500'
                : progress.status === 'completed'
                  ? 'bg-green-500'
                  : 'bg-blue-500'
            }`}
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      </div>

      {progress.currentTrack && (
        <div className="mb-4 rounded bg-white/50 p-3">
          <div className="text-xs font-semibold text-gray-500">Current Track</div>
          <div className="mt-1 truncate text-sm text-gray-700">
            {progress.currentTrack}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        {progress.status !== 'completed' && progress.status !== 'failed' && (
          <>
            {onPause && (
              <button
                onClick={onPause}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Pause
              </button>
            )}
            <button
              onClick={onCancel}
              className="flex-1 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
            >
              Cancel
            </button>
          </>
        )}
        {(progress.status === 'completed' || progress.status === 'failed') && (
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Done
          </button>
        )}
      </div>
    </div>
  );
}

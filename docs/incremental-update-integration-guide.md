# Incremental Playlist Update - Integration Guide

## Overview

The incremental playlist update feature has been fully implemented with all necessary components. This guide explains how to integrate it into the Dashboard and other parts of the application.

## Implemented Components

### Core Logic

1. **IncrementalUpdateOrchestrator** (`lib/export/incremental-update-orchestrator.ts`)
   - Main orchestrator for update operations
   - Identifies tracks to add vs. skip
   - Manages batch addition with progress tracking
   - Handles error resilience

2. **useIncrementalUpdate Hook** (`hooks/incremental-update/useIncrementalUpdate.ts`)
   - React hook for managing update state and progress
   - Integrates orchestrator into component lifecycle
   - Handles abort/cancellation

### UI Components

1. **UpdateProgressTracker** (`components/Dashboard/UpdateProgressTracker/`)
   - Real-time progress display during update
   - Shows track count, percentage, current track
   - Pause/Cancel/Done buttons with context-aware states

2. **UpdateResultsReport** (`components/Dashboard/UpdateResultsReport/`)
   - Summary of update results
   - Statistics: total, added, skipped, failed
   - Detailed lists of added and skipped tracks
   - Error reporting with track details

3. **ExportPreview (Updated)** (`components/ExportPreview/ExportPreview.tsx`)
   - Now includes "Update Existing" mode option
   - Allows selecting which playlist to update
   - Integrated with existing export modes (Create, Append, Overwrite)

### Extended Libraries

1. **NavidromeApiClient** (`lib/navidrome/client.ts`)
   - New method: `getPlaylistWithFullTracks()` for efficient duplicate checking
   - Returns playlist + track ID Set for O(1) lookups

2. **Export Types** (`types/export.ts`)
   - New: `UpdateOptions` interface
   - New: `UpdatePreviewStatistics` interface

### Export Metadata

- ExportMetadata already tracks `spotifySnapshotId`
- Can detect Spotify playlist changes for smart updates

---

## Integration Steps for Dashboard

### 1. Import Components and Hooks

```typescript
import { UpdateProgressTracker } from '@/components/Dashboard/UpdateProgressTracker';
import { UpdateResultsReport } from '@/components/Dashboard/UpdateResultsReport';
import { useIncrementalUpdate } from '@/hooks/incremental-update';
import { IncrementalUpdateOrchestrator } from '@/lib/export/incremental-update-orchestrator';
```

### 2. Add State for Update Mode

```typescript
type DashboardStage = 'table' | 'export' | 'exporting' | 'updating' | 'results';

const [stage, setStage] = useState<DashboardStage>('table');
const [updateMode, setUpdateMode] = useState(false);
```

### 3. Initialize the Hook

```typescript
const {
  isUpdating,
  progress,
  result: updateResult,
  error: updateError,
  startUpdate,
  cancelUpdate,
  reset,
} = useIncrementalUpdate({
  navidromeClient,
});
```

### 4. Handle Update Mode in Export Confirmation

In the export confirmation handler, detect if mode is 'update':

```typescript
const handleConfirmExport = async (options: ExportOptions | UpdateOptions) => {
  if (options.mode === 'update') {
    // Handle incremental update
    setStage('updating');
    setUpdateMode(true);
    
    // Get the Spotify tracks
    const spotifyTracks = await spotifyClient.getAllPlaylistTracks(playlistId);
    
    // Get cached matches
    const cachedData = loadPlaylistExportData(playlistId);
    
    // Start the update
    await startUpdate(
      options.existingPlaylistId,
      spotifyTracks,
      playlistName,
      cachedData?.tracks
    );
  } else {
    // Handle regular export (create/append/overwrite)
    handleStartExport();
  }
};
```

### 5. Render Update Components

In the Dashboard render method, add conditional rendering:

```typescript
{stage === 'updating' && progress && (
  <UpdateProgressTracker
    progress={progress}
    onCancel={() => {
      cancelUpdate();
      setStage('table');
    }}
  />
)}

{stage === 'updating' && updateResult && (
  <UpdateResultsReport
    result={updateResult}
    onDone={() => {
      reset();
      setStage('table');
      // Optionally refresh playlist list
      refreshPlaylistData();
    }}
    onUpdateAgain={() => {
      reset();
      setStage('table');
      setShowConfirmation(true);
    }}
  />
)}
```

### 6. Update ExportPreviewProps

If using the ExportPreview component, update the type to accept both modes:

```typescript
type ExportOptions = { mode: 'create' | 'append' | 'overwrite'; ... } 
                   | { mode: 'update'; existingPlaylistId: string; ... };
```

---

## Complete Integration Example

Here's a simplified example of how the update flow would be integrated:

```typescript
export function Dashboard() {
  const { spotify, navidrome } = useAuth();
  const [stage, setStage] = useState<'table' | 'updating' | 'results'>('table');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>();
  const [selectedPlaylistName, setSelectedPlaylistName] = useState<string>();

  const navidromeClient = new NavidromeApiClient(...);
  
  const {
    isUpdating,
    progress,
    result: updateResult,
    startUpdate,
    cancelUpdate,
    reset,
  } = useIncrementalUpdate({ navidromeClient });

  const handleUpdateClick = async (playlistId: string, playlistName: string) => {
    setSelectedPlaylistId(playlistId);
    setSelectedPlaylistName(playlistName);
    setStage('updating');

    // Fetch current Spotify tracks
    spotifyClient.setToken(spotify.token!);
    const playlistTracks = await spotifyClient.getAllPlaylistTracks(playlistId);
    const spotifyTracks = playlistTracks.map(pt => pt.track).filter(Boolean);

    // Get cached matches from export metadata
    const cachedData = loadPlaylistExportData(playlistId);

    // Start the update
    await startUpdate(
      playlistId,
      spotifyTracks,
      playlistName,
      cachedData?.tracks
    );
  };

  return (
    <div>
      {stage === 'table' && (
        <PlaylistTable
          onSelectForUpdate={handleUpdateClick}
        />
      )}

      {stage === 'updating' && progress && (
        <UpdateProgressTracker
          progress={progress}
          onCancel={() => {
            cancelUpdate();
            setStage('table');
          }}
        />
      )}

      {stage === 'updating' && updateResult && (
        <UpdateResultsReport
          result={updateResult}
          onDone={() => {
            reset();
            setStage('table');
          }}
          onUpdateAgain={() => {
            reset();
            handleUpdateClick(selectedPlaylistId!, selectedPlaylistName!);
          }}
        />
      )}
    </div>
  );
}
```

---

## Usage Flow

### User Perspective

1. **Select Update Mode**
   - In export preview, user selects "Update Existing" mode
   - User selects which playlist to update

2. **Preview and Confirm**
   - Show estimated tracks to be added/skipped
   - User confirms the update

3. **Update Progress**
   - Real-time progress tracking displayed
   - Current track name shown
   - Percentage complete displayed
   - User can cancel at any time

4. **View Results**
   - Summary statistics displayed
   - List of added tracks
   - List of skipped tracks (already in playlist)
   - Any errors reported
   - Options: "Done" or "Update Again"

### Technical Flow

```
1. User selects "Update" mode in ExportPreview
2. Dashboard calls useIncrementalUpdate.startUpdate()
3. IncrementalUpdateOrchestrator.updatePlaylist() executes:
   a. Fetch Navidrome playlist tracks
   b. Build Set<trackId> for O(1) lookups
   c. For each Spotify track:
      - Check if in cached matches
      - Check if cached match is in Navidrome playlist
      - Mark as "add" or "skip"
   d. Batch-add new tracks (50 per batch)
   e. Report progress after each batch
4. Results are collected and displayed
5. Export metadata is updated with changes
```

---

## API Reference

### IncrementalUpdateOrchestrator

```typescript
class IncrementalUpdateOrchestrator {
  async identifyTracksToAdd(
    spotifyTracks: SpotifyTrack[],
    navidromePlaylistId: string,
    cachedMatches?: Record<string, CachedTrackMatch>,
    signal?: AbortSignal
  ): Promise<IncrementalTrackMatch[]>

  async updatePlaylist(
    navidromePlaylistId: string,
    spotifyTracks: SpotifyTrack[],
    playlistName: string,
    cachedMatches?: Record<string, CachedTrackMatch>,
    options?: UpdateOptions
  ): Promise<UpdateResult>
}
```

### useIncrementalUpdate Hook

```typescript
interface UseIncrementalUpdateReturn {
  isUpdating: boolean;              // Operation in progress
  progress: ExportProgress | null;  // Real-time progress
  result: UpdateResult | null;      // Final results
  error: string | null;             // Error message if failed
  startUpdate: (...)=> Promise<void>;
  cancelUpdate: () => void;
  reset: () => void;
}
```

### UpdateProgressTracker Props

```typescript
interface UpdateProgressTrackerProps {
  progress: ExportProgress;
  onCancel: () => void;
  onPause?: () => void;  // Optional pause functionality
}
```

### UpdateResultsReport Props

```typescript
interface UpdateResultsReportProps {
  result: UpdateResult;
  onDone: () => void;
  onUpdateAgain: () => void;
}
```

---

## Performance Considerations

### Optimization Strategies

1. **Cached Matches**
   - Reuses matches from previous export (no re-matching)
   - Tracks: 100+ → Update: ~1-2 seconds

2. **Set for Lookups**
   - Navidrome playlist tracks converted to Set<id>
   - O(1) duplicate checking vs O(n) array search

3. **Batch Addition**
   - Batches of 50 tracks per API request
   - Reduces latency from multiple requests

4. **Early Termination**
   - Abort signals respected
   - User can cancel mid-update

### Expected Performance

- **50 tracks**: ~5-10 seconds
- **100 tracks**: ~10-15 seconds
- **500 tracks**: ~1-2 minutes
- **1000+ tracks**: ~3-5 minutes

---

## Error Handling

### Handled Error Cases

1. **Network Errors**
   - Gracefully caught and reported
   - Batch continues with remaining tracks

2. **Authentication Errors**
   - Handled by NavidromeApiClient
   - User prompted to re-authenticate

3. **Missing Tracks**
   - Skipped gracefully
   - Logged in error list

4. **Concurrent Updates**
   - Abort signal prevents race conditions
   - User can cancel partial updates

### Error Messages

All errors include:
- What failed (track name/artist)
- Why it failed (reason)
- Whether operation can continue

---

## Future Enhancements

1. **Bidirectional Sync**
   - Detect removed tracks from Spotify
   - Option to remove from Navidrome

2. **Automated Updates**
   - Schedule periodic playlist updates
   - Background sync without user interaction

3. **Batch Updates**
   - Update multiple playlists at once
   - Show aggregate progress

4. **Manual Skip/Add**
   - Let users choose specific tracks
   - Custom matching override

5. **Update History**
   - Track all updates per playlist
   - Show what changed when

---

## Testing

### Unit Tests

```typescript
// Test identifying tracks to add
test('identifyTracksToAdd correctly identifies new vs existing tracks')
test('handles empty cached matches')
test('handles missing Navidrome matches')

// Test update operation
test('updatePlaylist batches additions correctly')
test('updatePlaylist respects abort signals')
test('updatePlaylist returns accurate statistics')
```

### Integration Tests

```typescript
// Test full update workflow
test('complete update from Spotify to Navidrome')
test('update with cached matches')
test('update with no changes needed')
test('update with network errors')
```

---

## Files Modified/Created

### New Files
- `lib/export/incremental-update-orchestrator.ts`
- `hooks/incremental-update/useIncrementalUpdate.ts`
- `components/Dashboard/UpdateProgressTracker/UpdateProgressTracker.tsx`
- `components/Dashboard/UpdateResultsReport/UpdateResultsReport.tsx`

### Modified Files
- `lib/navidrome/client.ts` (added `getPlaylistWithFullTracks`)
- `types/export.ts` (added update types)
- `components/ExportPreview/ExportPreview.tsx` (added update mode)

---

## Support & Troubleshooting

### Common Issues

**Update shows no tracks to add**
- ✓ Check if all tracks are already in Navidrome
- ✓ Verify export metadata exists
- ✓ Check Spotify playlist hasn't changed

**Update is slow**
- ✓ Expected for 500+ track playlists
- ✓ Network latency affects speed
- ✓ Consider browser performance

**Update fails partway**
- ✓ Partially added tracks remain (no rollback)
- ✓ Metadata not updated on failure
- ✓ Can retry the update

---

## See Also

- [Main Feature Plan](./feature-incremental-playlist-update.md)
- [Playlist Exporter](./feature-F2-8-playlist-exporter.md)
- [Matching Orchestrator](./feature-F2-4-matching-orchestrator.md)
- [Export Cache](./track-export-cache.ts)

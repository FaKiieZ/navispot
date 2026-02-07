# Feature: Incremental Playlist Update

**Status:** Planning Phase  
**Date:** February 7, 2026  
**Related Features:** F2.8 (Playlist Exporter), F2.4 (Matching Orchestrator)  
**Branch:** `feature/incremental-update`

---

## Feature Overview

Allow users to update already-exported playlists by checking if each Spotify track is already in the Navidrome playlist. If a track exists → skip it; if it doesn't exist → add it to the playlist. This enables keeping exported playlists synchronized with Spotify playlist changes without duplication.

### Goals

1. **Non-Destructive Updates:** Only add new tracks, preserve existing ones
2. **Deduplication:** Prevent duplicate tracks in Navidrome playlists
3. **Efficient Sync:** Quickly identify which tracks need to be added
4. **Clear Feedback:** Show progress and results of update operations
5. **Reuse Existing Matches:** Leverage previously matched track data from export metadata

---

## Architecture Analysis

### Current System Components

#### Export Metadata System
- **Location:** `lib/navidrome/client.ts` - `parseExportMetadata()`, `generateExportMetadata()`
- **Structure:** Stored in playlist `comment` field as JSON
- **Data:** `spotifyPlaylistId`, `spotifySnapshotId`, `exportedAt`, `trackCount`, and track mapping details

```typescript
interface PlaylistExportData {
  spotifyPlaylistId: string;
  spotifySnapshotId: string;
  playlistName: string;
  navidromePlaylistId?: string;
  exportedAt: string;
  trackCount: number;
  tracks: Record<string, {
    spotifyTrackId: string;
    navidromeSongId?: string;
    matchedAt: string;
    // ... other metadata
  }>;
}
```

#### Navidrome API Client
- **Location:** `lib/navidrome/client.ts`
- **Key Methods:**
  - `getPlaylist(playlistId)` → returns playlist metadata + tracks
  - `createPlaylist(name, songIds)` → creates new playlist
  - `updatePlaylist()` → adds tracks to existing playlist (needs verification)
  - `getPlaylists()` → lists all playlists
  - `getPlaylistByComment(spotifyPlaylistId)` → finds exported playlist by metadata

#### Track Matching System
- **Location:** `lib/matching/orchestrator.ts`
- **Purpose:** Matches Spotify tracks to Navidrome songs using multiple strategies (ISRC → Duration → Fuzzy → Strict)
- **Output:** `TrackMatch[]` with matched `NavidromeSong` and match metadata

#### Playlist Exporter
- **Location:** `lib/export/playlist-exporter.ts`
- **Modes:** `create | append | overwrite | update` (update already supported in type)
- **Handles:** Progress tracking, error handling, partial failures

---

## Implementation Plan

### Phase 1: Core Logic & Data Layer

#### 1.1 Create Incremental Update Orchestrator
**File:** `lib/export/incremental-update-orchestrator.ts`

**Responsibilities:**
- Orchestrate the update workflow
- Manage comparison logic between Spotify and Navidrome playlists
- Handle track deduplication
- Track operation progress and statistics

**Key Operations:**

```typescript
interface IncrementalUpdateOrchestrator {
  // Main update operation
  updatePlaylist(
    spotifyPlaylistId: string,
    spotifyTracks: SpotifyTrack[],
    navidromePlaylistId: string,
    options?: UpdateOptions
  ): Promise<UpdateResult>;
  
  // Helper: Get tracks needing addition
  identifyTracksToAdd(
    spotifyTracks: SpotifyTrack[],
    existingNavidromeTracks: NavidromeSong[],
    cachedMatches?: Record<string, NavidromeSong>
  ): IncrementalTrackMatch[];
}

interface UpdateOptions {
  useCache?: boolean;  // Reuse previous match data
  reMatchUnmatched?: boolean;  // Re-match tracks without Navidrome matches
  onProgress?: ProgressCallback;
  signal?: AbortSignal;
}

interface IncrementalTrackMatch {
  spotifyTrack: SpotifyTrack;
  navidromeSong?: NavidromeSong;
  status: 'add' | 'skip' | 'reMatch';  // Status for this track
  reason: string;  // Why skip or add
  matchScore?: number;
}

interface UpdateResult {
  success: boolean;
  playlistId: string;
  playlistName: string;
  statistics: {
    totalSpotifyTracks: number;
    alreadyInPlaylist: number;
    addedToPlaylist: number;
    reMatched: number;
    failed: number;
  };
  tracksAdded: Array<{ spotifyId: string; navidromeId: string; title: string }>;
  tracksSkipped: string[];  // Spotify track IDs
  errors: ExportError[];
  duration: number;
}
```

**Algorithm:**

```
1. Fetch Navidrome playlist by ID
2. Get all tracks in Navidrome playlist → build Set<songId>
3. For each Spotify track:
   a. Check if track has cached Navidrome match from export metadata
   b. If cached match exists:
      - If songId in Navidrome playlist Set → status = 'skip'
      - Else → status = 'add'
   c. If no cached match AND reMatchUnmatched:
      - Run matching orchestrator
      - If matched → status = 'add'
      - Else → status = 'skip' (or configure behavior)
4. Collect all 'add' tracks
5. Add collected tracks to Navidrome playlist via API
6. Return detailed results with statistics
```

---

#### 1.2 Extend Export Metadata Cache
**File:** `lib/export/track-export-cache.ts` (expand existing)

**Purpose:** Persist and retrieve cached track matches to avoid re-matching

**Add Method:**

```typescript
interface TrackExportCache {
  // New: Retrieve cached matches for specific playlist
  getCachedMatchesForPlaylist(
    spotifyPlaylistId: string
  ): Promise<Record<string, NavidromeSong | null>>;
  
  // Existing: Get all cached matches
  getAllCachedMatches(): Promise<Map<string, TrackMatch>>;
}
```

**Implementation:** Read cached data from playlist export metadata comment field
- If playlist has export metadata → extract `tracks` mapping
- Convert to `Record<spotifyTrackId, navidromeSongId>`

---

#### 1.3 Extend Navidrome Client with Helper Methods
**File:** `lib/navidrome/client.ts` (expand existing)

**Add Methods:**

```typescript
interface NavidromeApiClient {
  // Get playlist with full track details needed for comparison
  getPlaylistWithFullTracks(
    playlistId: string,
    signal?: AbortSignal
  ): Promise<{
    playlist: NavidromePlaylist;
    tracks: NavidromeNativeSong[];
    trackIdSet: Set<string>;  // Performance optimization
  }>;
  
  // Batch add tracks to playlist
  addTracksToPlaylist(
    playlistId: string,
    trackIds: string[],
    onProgress?: ProgressCallback,
    signal?: AbortSignal
  ): Promise<{ success: boolean; addedCount: number }>;
  
  // Helper: Build efficient lookup for comparison
  buildTrackLookupSet(tracks: NavidromeNativeSong[]): Set<string>;
}
```

**Performance Considerations:**
- Return `Set<string>` of song IDs for O(1) lookups
- Batch add operation with progress tracking
- Handle pagination if playlist > 1000 tracks (current API limit)

---

### Phase 2: UI Components

#### 2.1 Create Update Option in Export Preview
**File:** `components/ExportPreview/ExportPreview.tsx` (extend)

**Changes:**
- Add "Update" mode tile to export mode selection
- Show preview of tracks to be added vs. already in playlist
- Display estimated counts:
  - Tracks already in playlist (will skip)
  - Tracks to add
  - Tracks needing re-matching

**UI Layout:**

```tsx
<div className="grid grid-cols-2 gap-4">
  {/* Existing modes */}
  <ModeButton mode="create" ... />
  <ModeButton mode="append" ... />
  <ModeButton mode="overwrite" ... />
  
  {/* New mode */}
  <ModeButton 
    mode="update" 
    label="Update Existing"
    description="Add new tracks, keep existing ones"
    disabled={!existingPlaylistId}
    tooltip="Select an existing playlist to update"
  />
</div>

{mode === 'update' && (
  <UpdatePreviewStats
    totalSpotifyTracks={statistics.total}
    estimatedSkipped={...}
    estimatedToAdd={...}
  />
)}
```

---

#### 2.2 Update Playlist Selection Logic
**File:** `components/ExportPreview/useExportPreview.ts` (extend)

**Changes:**
- When mode = 'update' → require `existingPlaylistId` selection
- Filter available playlists to only show those with export metadata OR let user manually select
- Add validation: ensure selected playlist exists in Navidrome

**Type Update:**

```typescript
interface UseExportPreviewReturn {
  // ... existing fields
  selectedMode: ExportMode;  // Now includes 'update'
  availablePlaylistsForUpdate?: Array<{ id: string; name: string; trackCount: number }>;
  canUpdatePlaylist: (playlistId: string) => boolean;
}
```

---

#### 2.3 Create Update Status Component
**File:** `components/Dashboard/ProgressTracker/UpdateProgressTracker.tsx` (new)

**Purpose:** Show real-time progress during update operation

**Display:**
- Tracks processed vs. total
- Current track being matched/added
- Breakdown: added vs. skipped vs. failed
- Estimated time remaining
- Action buttons: Cancel, Pause (optional)

---

#### 2.4 Update Results Report
**File:** `components/Dashboard/ResultsReport/UpdateResultsReport.tsx` (new)

**Display:**
- Operation summary (success/failure)
- Statistics breakdown
  - Tracks already in playlist (skipped)
  - Tracks successfully added
  - Tracks failed to add
  - Tracks re-matched
- Detailed list of added tracks (scrollable, searchable)
- Detailed list of skipped tracks
- Error details (if any)
- Buttons: Done, Update Again, view in Navidrome

---

### Phase 3: Spotify & Navidrome Integration

#### 3.1 Spotify Track Fetching with Snapshot Checking
**File:** `lib/spotify/track-fetcher.ts` (extend)

**Enhancement:** Add snapshot ID comparison

```typescript
interface TrackFetcherOptions {
  useCache?: boolean;
}

interface FetchResult {
  tracks: SpotifyTrack[];
  snapshotId: string;
  hasChanges: boolean;  // Compare with cached snapshot
  newTracksCount: number;
  removedTracksCount: number;
}

interface TrackFetcher {
  // New method: Check if playlist has changed
  hasPlaylistChanged(
    playlistId: string,
    cachedSnapshotId: string
  ): Promise<boolean>;
  
  // Enhanced: Fetch with change detection
  fetchPlaylistTracksWithChangeDetection(
    playlistId: string,
    options: TrackFetcherOptions
  ): Promise<FetchResult>;
}
```

**Logic:**
- Compare current `snapshot_id` with cached value from export metadata
- If different → fetch new tracks and show what changed
- Can help user decide whether to update

---

#### 3.2 Update Dashboard Integration Flow
**File:** `components/Dashboard/Dashboard.tsx` (extend)

**Workflow:**
1. User selects playlist from table
2. If playlist has export metadata → show "Update" option
3. User clicks "Update"
4. Fetch current Spotify tracks
5. Fetch current Navidrome playlist contents
6. Show preview of changes to be made
7. User confirms
8. Start update operation with progress tracking
9. Show results report

**State Changes:**

```typescript
type DashboardStage = 'table' | 'export' | 'exporting' | 'results' | 'updating';
// Add new stage for update operation
```

---

### Phase 4: Matching & Track Addition

#### 4.1 Leverage Matching Orchestrator for Unmatched Tracks
**File:** `lib/export/incremental-update-orchestrator.ts`

**Integration:**
- When track has no cached match AND `reMatchUnmatched = true`
- Call `MatchingOrchestrator.matchSingleTrack(spotifyTrack)`
- Collect results for progress reporting

---

#### 4.2 Batch Addition with Error Handling
**File:** `lib/export/incremental-update-orchestrator.ts`

**Strategy:**
- Chunk additions into batches of 50-100 tracks
- For each batch:
  - Call `navidromeClient.addTracksToPlaylist(playlistId, trackIds)`
  - Catch errors per track
  - Log failed track details
- Continue with remaining tracks even if some fail (resilience)

---

### Phase 5: Cache & Metadata Management

#### 5.1 Update Export Metadata After Addition
**File:** `lib/navidrome/client.ts`

**Purpose:** Keep playlist metadata in sync

**After successful additions:**
- Update playlist comment with new snapshot ID
- Add newly matched track entries to the tracks mapping
- Preserve existing track entries
- Update `trackCount` and statistics

```typescript
async updatePlaylistMetadata(
  playlistId: string,
  metadata: ExportMetadata,
  newlyAddedTracks: Array<{ spotifyTrackId: string; navidromeSongId: string }>
): Promise<boolean>
```

---

#### 5.2 Snapshot ID Management
**File:** `lib/export/track-export-cache.ts`

**Enhancement:**
- Store current Spotify snapshot ID after each update
- Compare on next update to detect changes
- Help user know if update is needed

---

## Implementation Order

### Week 1: Core Logic
1. ✅ Extend ExportMetadata to track Spotify snapshot IDs
2. ✅ Create `incremental-update-orchestrator.ts`
3. ✅ Extend `NavidromeApiClient` with track comparison helpers
4. ✅ Build track deduplication logic

### Week 2: Spotify Integration
5. ✅ Enhance track fetcher with snapshot checking
6. ✅ Add change detection logic
7. ✅ Integrate with matching orchestrator for re-matching

### Week 3: UI Components
8. ✅ Update `ExportPreview` component
9. ✅ Create update progress component
10. ✅ Create update results component

### Week 4: Dashboard Integration
11. ✅ Integrate into Dashboard workflow
12. ✅ Wire up Spotify → Navidrome update flow
13. ✅ Update export metadata after successful additions

### Week 5: Polish & Testing
14. ✅ Error handling & edge cases
15. ✅ Performance optimization (batching, caching)
16. ✅ UI/UX refinement
17. ✅ Comprehensive testing

---

## Key Algorithms

### Track Deduplication Algorithm

```
Input: 
  - spotifyTracks: SpotifyTrack[]
  - navidromePlaylist: {tracks: NavidromeNativeSong[]}
  - cachedMatches: Record<spotifyId, NavidromeMatch>

Process:
  {
    navidromeSongIdSet = buildSet(navidromePlaylist.tracks.map(t => t.id))
    tracksToAdd = []
    tracksToSkip = []
    
    for each spotifyTrack in spotifyTracks:
      if cachedMatches[spotifyTrack.id]:
        navidromeSongId = cachedMatches[spotifyTrack.id]
        if navidromeSongId in navidromeSongIdSet:
          tracksToSkip.push(spotifyTrack)  // Already in playlist
        else:
          tracksToAdd.push({spotifyTrack, navidromeSongId})  // Add cached match
      else:
        // No cached match
        if reMatchUnmatched:
          match = matchingOrchestrator.matchSingleTrack(spotifyTrack)
          if match.navidromeSong:
            tracksToAdd.push({spotifyTrack, match.navidromeSong})
          else:
            tracksToSkip.push(spotifyTrack)  // No match found
        else:
          tracksToSkip.push(spotifyTrack)  // Skip unmatched
    
    return {tracksToAdd, tracksToSkip}
  }

Output:
  - tracksToAdd: [{spotifyTrack, navidromeSongId}]
  - tracksToSkip: [SpotifyTrack[]]
```

### Batch Addition with Resilience

```
Input: tracksToAdd[], batchSize=50

Process:
  {
    results = []
    errors = []
    
    for batch in chunks(tracksToAdd, batchSize):
      try:
        addResult = navidromeClient.addTracksToPlaylist(
          playlistId,
          batch.map(t => t.navidromeSongId)
        )
        results.push(...batch)
      catch error:
        errors.push({
          batch,
          error,
          failureStrategy: 'skip_batch'  // or 'retry_individual'
        })
    
    // Optional: Retry individual tracks from failed batches
    for error in errors:
      for track in error.batch:
        try:
          addTracksToPlaylist(playlistId, [track.navidromeSongId])
          results.push(track)
        catch:
          errors.push({track, error})
    
    return {successCount: results.length, errors}
  }

Output:
  - successCount: number
  - errors: [{track, reason}]
```

---

## Types to Add/Extend

```typescript
// lib/export/incremental-update-orchestrator.ts
export interface IncrementalUpdateOrchestrator { ... }
export interface UpdateOptions { ... }
export interface IncrementalTrackMatch { ... }
export interface UpdateResult { ... }
export type UpdateMode = 'full' | 'matchedOnly';

// types/export.ts
export type ExportMode = 'create' | 'append' | 'overwrite' | 'update';

// types/navidrome.ts
export interface PlaylistComparisonResult {
  playlistId: string;
  totalSpotifyTracks: number;
  tracksAlreadyInPlaylist: string[];
  tracksToAdd: {spotifyId: string; navidromeId: string}[];
  tracksNeedingMatch: SpotifyTrack[];
}
```

---

## Testing Strategy

### Unit Tests

1. **Track Deduplication Logic**
   - Empty Navidrome playlist → all tracks added
   - Full Navidrome playlist → all tracks skipped
   - Partial overlap → correct split
   - Cached matches with gaps → re-match correctly

2. **Incremental Update Orchestrator**
   - Successful full update
   - Successful partial update
   - Update with no changes needed
   - Update with re-matching required
   - Error handling & resilience

3. **Spotify Snapshot Change Detection**
   - Same snapshot → no changes
   - Different snapshot → detect changes
   - New tracks added to Spotify
   - Tracks removed from Spotify

4. **Export Metadata Updates**
   - Preserve existing track entries
   - Add new entries correctly
   - Update snapshot ID
   - Maintain data integrity

### Integration Tests

1. **End-to-End Update Flow**
   - Select playlist with export metadata
   - Fetch current Spotify tracks
   - Fetch Navidrome playlist
   - Run update orchestrator
   - Verify API calls to Navidrome
   - Verify metadata updated

2. **UI/UX Flow**
   - Select update mode
   - Show preview with correct counts
   - Confirm and start update
   - Progress tracking updates
   - Results display correctly

### Edge Cases

1. Playlist deleted in Navidrome
2. Spotify tracks with no Navidrome equivalent
3. Network failures during update
4. Large playlists (1000+ tracks)
5. Duplicate detection edge cases
6. Concurrent update attempts

---

## Performance Considerations

1. **Caching:**
   - Cache Spotify track list with snapshot ID
   - Cache Navidrome playlist contents with timestamp
   - Use cached matches from export metadata

2. **Batching:**
   - Batch Navidrome additions (50-100 tracks per request)
   - Batch matching operations if re-matching needed

3. **Efficiency:**
   - Use Set<string> for O(1) duplicate checks
   - Paginate large Navidrome playlists if needed
   - Lazy-load matching only for uncached tracks

4. **Resource Management:**
   - Cancel operations on user request
   - Limit concurrent API requests
   - Clear cache after successful update

---

## UI/UX Wireframes

### Update Preview Panel

```
┌─────────────────────────────────┐
│ Update Existing Playlist         │
├─────────────────────────────────┤
│ Select Playlist to Update:       │
│ [Dropdown: My Playlist ▼]        │
│                                 │
│ Playlist Changes Detected:       │
│ ┌─────────────────────────────┐ │
│ │ Spotify Snapshot ID: abc123 │ │
│ │ Last Updated: 2 days ago    │ │
│ │ New Tracks Added: 5         │ │
│ │ Tracks Removed: 1           │ │
│ └─────────────────────────────┘ │
│                                 │
│ Update Preview:                 │
│ ┌─────────────────────────────┐ │
│ │ Total Spotify Tracks: 42    │ │
│ │ Already in Playlist: 37     │ │
│ │ Will Add: 5                 │ │
│ │ Need Re-matching: 0         │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### Update Progress Panel

```
┌─────────────────────────────────┐
│ Updating: My Playlist           │
├─────────────────────────────────┤
│ Progress: 23 / 42 tracks        │
│ [████████░░░░░░░░░░░] 55%      │
│                                 │
│ Current: Adding "Track Name"    │
│ by Artist Name                  │
│                                 │
│ Stats:                          │
│ ✓ Added: 5                      │
│ → Skipped: 18                   │
│ ⚠ Re-matching: 0                │
│ ✗ Failed: 0                     │
│                                 │
│ Estimated Time: 45 seconds      │
│              [Cancel] [Pause]    │
└─────────────────────────────────┘
```

### Update Results Panel

```
┌─────────────────────────────────┐
│ ✓ Update Complete               │
├─────────────────────────────────┤
│ Playlist: My Playlist           │
│ Duration: 2 minutes 30 seconds  │
│                                 │
│ Results:                        │
│ • Tracks Added: 5               │
│ • Tracks Skipped: 37            │
│ • Tracks Failed: 0              │
│ • New Total: 42 tracks          │
│                                 │
│ Added Tracks:                   │
│ ┌─────────────────────────────┐ │
│ │ • Track Name 1 - Artist 1   │ │
│ │ • Track Name 2 - Artist 2   │ │
│ │ • Track Name 3 - Artist 3   │ │
│ │ • ... (scroll if more)      │ │
│ └─────────────────────────────┘ │
│                                 │
│   [Done] [Update Again]         │
│   [View in Navidrome →]         │
└─────────────────────────────────┘
```

---

## Configuration Options

```typescript
interface IncrementalUpdateConfig {
  // Matching behavior
  reMatchUnmatched: boolean;        // default: false
  minMatchScore: number;             // default: 0.7
  maxBatchSize: number;              // default: 50
  
  // UI options
  showSkippedTracks: boolean;        // default: true
  showAddedTracks: boolean;          // default: true
  
  // Optimization
  useCachedMatches: boolean;         // default: true
  cacheExpirationHours: number;      // default: 24
}
```

---

## Documentation Needed

- User guide for update feature (how to use)
- API documentation for new methods
- Architecture diagram showing data flow
- Configuration guide
- Troubleshooting guide

---

## Success Criteria

✅ Feature is complete when:

1. Users can select "Update" mode when exporting
2. System correctly identifies duplicate tracks
3. Tracks are added to Navidrome without duplication
4. Progress is tracked and displayed accurately
5. Results are detailed and transparent
6. Export metadata is updated for future updates
7. Performance is acceptable (< 2 minutes for 100+ track playlist)
8. Error handling is robust and informative
9. UI is consistent with existing design
10. All edge cases are handled gracefully

---

## Future Enhancements

1. **Bidirectional Sync:** Detect tracks removed from Spotify, optionally remove from Navidrome
2. **Automated Updates:** Schedule periodic playlist updates
3. **Batch Updates:** Select multiple playlists to update simultaneously
4. **Manual Skip/Add:** Let users manually choose which tracks to add
5. **Update History:** Track all updates per playlist with timestamps
6. **Conflict Resolution:** Handle cases where metadata is inconsistent
7. **Duplicate Detection:** Find and merge playlists with same Spotify source

---

## References

- Feature F2.8: Playlist Exporter (`docs/feature-F2-8-playlist-exporter.md`)
- Feature F2.4: Matching Orchestrator (`docs/feature-F2-4-matching-orchestrator.md`)
- Feature F3.2: Dashboard Revamp (`docs/feature-F3-2-dashboard-revamp-2026-01-06.md`)
- Types: `types/export.ts`, `types/navidrome.ts`, `types/matching.ts`
- Navidrome Client: `lib/navidrome/client.ts`
- Playlist Exporter: `lib/export/playlist-exporter.ts`

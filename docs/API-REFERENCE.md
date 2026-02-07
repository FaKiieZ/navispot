# Public API & Exports Reference

## Core Exports

### Orchestrator
```typescript
// lib/export/incremental-update-orchestrator.ts
export class IncrementalUpdateOrchestrator { ... }
export function createIncrementalUpdateOrchestrator(
  navidromeClient: NavidromeApiClient
): IncrementalUpdateOrchestrator

export interface IncrementalTrackMatch { ... }
export interface UpdateResult { ... }
export interface UpdateOptions { ... }
export interface CachedTrackMatch { ... }
```

### React Hook
```typescript
// hooks/incremental-update/useIncrementalUpdate.ts
export function useIncrementalUpdate(
  options: UseIncrementalUpdateOptions
): UseIncrementalUpdateReturn

export interface UseIncrementalUpdateOptions { ... }
export interface UseIncrementalUpdateReturn { ... }
```

### UI Components
```typescript
// components/Dashboard/UpdateProgressTracker/index.ts
export { UpdateProgressTracker } from './UpdateProgressTracker'

// components/Dashboard/UpdateResultsReport/index.ts
export { UpdateResultsReport } from './UpdateResultsReport'
```

### Types
```typescript
// types/export.ts
export interface UpdateOptions { ... }
export interface UpdatePreviewStatistics { ... }
export type ExportMode = 'create' | 'append' | 'overwrite' | 'update'
```

### Extended Navidrome Client
```typescript
// lib/navidrome/client.ts
NavidromeApiClient.getPlaylistWithFullTracks(
  playlistId: string,
  signal?: AbortSignal
): Promise<{
  playlist: NavidromePlaylist
  tracks: NavidromeNativeSong[]
  trackIdSet: Set<string>
}>
```

---

## Import Examples

### Using the Orchestrator Directly
```typescript
import { createIncrementalUpdateOrchestrator } from '@/lib/export/incremental-update-orchestrator';
import type { UpdateResult, IncrementalTrackMatch } from '@/lib/export/incremental-update-orchestrator';

const orchestrator = createIncrementalUpdateOrchestrator(navidromeClient);
const result: UpdateResult = await orchestrator.updatePlaylist(...);
```

### Using the React Hook
```typescript
import { useIncrementalUpdate } from '@/hooks/incremental-update';

const {
  isUpdating,
  progress,
  result,
  error,
  startUpdate,
  cancelUpdate,
  reset
} = useIncrementalUpdate({ navidromeClient });
```

### Using UI Components
```typescript
import { UpdateProgressTracker } from '@/components/Dashboard/UpdateProgressTracker';
import { UpdateResultsReport } from '@/components/Dashboard/UpdateResultsReport';

<UpdateProgressTracker
  progress={progress}
  onCancel={handleCancel}
/>

<UpdateResultsReport
  result={result}
  onDone={handleDone}
  onUpdateAgain={handleUpdateAgain}
/>
```

### Import All at Once
```typescript
import { useIncrementalUpdate } from '@/hooks/incremental-update';
import { UpdateProgressTracker } from '@/components/Dashboard/UpdateProgressTracker';
import { UpdateResultsReport } from '@/components/Dashboard/UpdateResultsReport';
import type { UpdateResult } from '@/lib/export/incremental-update-orchestrator';
```

---

## Type Reference

### IncrementalTrackMatch
```typescript
interface IncrementalTrackMatch {
  spotifyTrack: SpotifyTrack;
  navidromeSong?: NavidromeNativeSong;
  status: 'add' | 'skip';
  reason: string;
}
```

### UpdateResult
```typescript
interface UpdateResult {
  success: boolean;
  playlistId: string;
  playlistName: string;
  statistics: {
    totalSpotifyTracks: number;
    alreadyInPlaylist: number;
    addedToPlaylist: number;
    failed: number;
  };
  tracksAdded: Array<{ spotifyId: string; navidromeId: string; title: string }>;
  tracksSkipped: string[];
  errors: ExportError[];
  duration: number;
}
```

### UpdateOptions
```typescript
interface UpdateOptions {
  useCache?: boolean;
  onProgress?: ProgressCallback;
  signal?: AbortSignal;
}
```

### CachedTrackMatch
```typescript
interface CachedTrackMatch {
  spotifyTrackId: string;
  navidromeSongId?: string;
  status: 'matched' | 'ambiguous' | 'unmatched';
  matchStrategy: string;
  matchScore: number;
}
```

### UseIncrementalUpdateReturn
```typescript
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
```

### UpdateProgressTrackerProps
```typescript
interface UpdateProgressTrackerProps {
  progress: ExportProgress;
  onCancel: () => void;
  onPause?: () => void;
}
```

### UpdateResultsReportProps
```typescript
interface UpdateResultsReportProps {
  result: UpdateResult;
  onDone: () => void;
  onUpdateAgain: () => void;
}
```

---

## Component Props Reference

### UpdateProgressTracker
```tsx
<UpdateProgressTracker
  progress={{
    current: number;
    total: number;
    percent: number;
    currentTrack?: string;
    status: 'preparing' | 'exporting' | 'completed' | 'failed';
  }}
  onCancel={() => {...}}
  onPause={() => {...}}  // optional
/>
```

### UpdateResultsReport
```tsx
<UpdateResultsReport
  result={updateResult}
  onDone={() => {...}}
  onUpdateAgain={() => {...}}
/>
```

---

## Export Modes

```typescript
type ExportMode = 'create' | 'append' | 'overwrite' | 'update';

// 'create'   - Create a new playlist in Navidrome
// 'append'   - Add tracks to an existing playlist
// 'overwrite'- Replace all tracks in a playlist
// 'update'   - Add new tracks, keep existing ones (NEW)
```

---

## Environment Requirements

- TypeScript 4.5+
- React 18+
- The existing auth context and Spotify/Navidrome clients

---

## Breaking Changes

**None** - This is a purely additive feature. All existing code continues to work unchanged.

---

## Deprecations

**None** - No existing APIs were deprecated.

---

## Compatibility

✅ Compatible with:
- All existing export modes (create/append/overwrite)
- Current NavidromeApiClient
- Current Spotify client
- Current auth context
- Current batch matcher
- Current track export cache

---

## See Also

- [Feature Specification](./feature-incremental-playlist-update.md)
- [Integration Guide](./incremental-update-integration-guide.md)
- [Implementation Summary](./IMPLEMENTATION-SUMMARY.md)

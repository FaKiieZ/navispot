# Feature F3.5: Export Preview

## Feature Overview

The Export Preview feature provides a user interface for reviewing and confirming export options before initiating a playlist export to Navidrome. It displays match statistics, export modes, and allows users to configure export behavior.

### Purpose and Functionality

The export preview enables users to:

- Review matched vs unmatched track counts before exporting
- Select export mode (create new, append to existing, overwrite)
- See estimated export results based on current matches
- Confirm or cancel the export operation
- Configure additional options like skipping unmatched tracks

## Implementation Details

### Files Modified/Created

1. **components/ExportPreview/ExportPreview.tsx** - Main export preview component
2. **components/ExportPreview/index.ts** - Component exports
3. **components/ExportPreview/useExportPreview.ts** - Export preview hook for logic
4. **types/export.ts** - Export preview types
5. **docs/feature-F3-5-export-preview.md** - This documentation

### Requirements Met

| Requirement | Status | Location |
|-------------|--------|----------|
| Show export options (create/append/overwrite) | ✅ | `ExportPreview.tsx:45-80` |
| Preview of matched vs unmatched count | ✅ | `ExportPreview.tsx:82-120` |
| Confirm dialog with statistics | ✅ | `ExportPreview.tsx:122-180` |

## Components

### ExportPreview Component

Located in `components/ExportPreview/ExportPreview.tsx`:

| Prop | Type | Description |
|------|------|-------------|
| `matchResult` | `MatchResult` | Match results from batch matcher |
| `onConfirm` | `(options: ExportOptions) => void` | Called when export is confirmed |
| `onCancel` | `() => void` | Called when export is cancelled |
| `existingPlaylists` | `NavidromePlaylist[]` | Optional list of existing playlists for append/overwrite |

### ExportOptions Interface

```typescript
export interface ExportOptions {
  mode: ExportMode;
  existingPlaylistId?: string;
  skipUnmatched: boolean;
}
```

- **mode**: Export operation type ('create' | 'append' | 'overwrite')
- **existingPlaylistId**: Required for 'append' and 'overwrite' modes
- **skipUnmatched**: Whether to skip tracks without Navidrome matches

### MatchStatistics Interface

```typescript
export interface MatchStatistics {
  total: number;
  matched: number;
  ambiguous: number;
  unmatched: number;
  matchedPercentage: number;
}
```

### ExportPreviewHook Return Type

```typescript
interface UseExportPreviewReturn {
  statistics: MatchStatistics;
  selectedMode: ExportMode;
  selectedPlaylistId: string | undefined;
  skipUnmatched: boolean;
  setMode: (mode: ExportMode) => void;
  setSelectedPlaylistId: (id: string | undefined) => void;
  setSkipUnmatched: (skip: boolean) => void;
  estimatedExported: number;
  estimatedSkipped: number;
  canExport: boolean;
}
```

## Usage Examples

### Basic Export Preview

```tsx
import { ExportPreview } from '@/components/ExportPreview';
import { MatchResult } from '@/types/matching';

const matchResult: MatchResult = {
  playlistName: 'My Playlist',
  matches: [...],
  statistics: { ... },
};

<ExportPreview
  matchResult={matchResult}
  onConfirm={(options) => handleExport(options)}
  onCancel={() => setShowPreview(false)}
/>
```

### Export Preview with Existing Playlists

```tsx
<ExportPreview
  matchResult={matchResult}
  existingPlaylists={navidromePlaylists}
  onConfirm={handleExport}
  onCancel={handleCancel}
/>
```

### Using the Export Preview Hook

```tsx
import { useExportPreview } from '@/components/ExportPreview';

const {
  statistics,
  selectedMode,
  selectedPlaylistId,
  skipUnmatched,
  setMode,
  setSelectedPlaylistId,
  setSkipUnmatched,
  estimatedExported,
  canExport,
} = useExportPreview({ statistics });
```

## UI Components

### Export Mode Selection

Three radio buttons or cards for selecting export mode:

1. **Create New Playlist** - Default option
   - Creates a new playlist with matched tracks
   - Shows input for playlist name (optional)

2. **Append to Existing** - Shows playlist dropdown
   - Requires selecting an existing Navidrome playlist
   - Preserves existing tracks in the playlist

3. **Overwrite Existing** - Shows playlist dropdown
   - Requires selecting an existing Navidrome playlist
   - Replaces all tracks in the selected playlist

### Statistics Preview

Visual display of match statistics:

- **Total Tracks**: Total number of tracks in the playlist
- **Matched**: Number of successfully matched tracks (green)
- **Ambiguous**: Number of tracks with multiple candidates (yellow)
- **Unmatched**: Number of tracks without matches (red)
- **Match Rate**: Percentage of matched tracks

### Estimated Export Results

Based on current options:

- **Will Export**: Number of tracks that will be added
- **Will Skip**: Number of tracks that will be skipped

### Confirm/Cancel Actions

- **Confirm Button**: Enabled when all required fields are filled
  - Shows "Export X tracks" or similar
  - Triggers `onConfirm` with selected options
- **Cancel Button**: Triggers `onCancel`
- Shows confirmation dialog on click

## Export Modes

### Create New Playlist

Default mode for exporting to a new playlist:

```
Mode: 'create'
Required: None
Effect: Creates a new playlist with matched tracks
```

### Append to Existing Playlist

For adding tracks to an existing Navidrome playlist:

```
Mode: 'append'
Required: existingPlaylistId
Effect: Adds matched tracks to the existing playlist
Preserves: All existing tracks in the playlist
```

### Overwrite Existing Playlist

For replacing playlist contents:

```
Mode: 'overwrite'
Required: existingPlaylistId
Effect: Removes all existing tracks, adds matched tracks
Result: Playlist contains only the newly matched tracks
```

## Styling

The Export Preview component uses Tailwind CSS for styling:

- Clean, card-based layout
- Color-coded statistics (green/yellow/red)
- Radio button cards with icons for export modes
- Responsive design for mobile and desktop
- Smooth transitions on mode selection

## Dependencies

This feature depends on:

- **F2.7 (Batch Matcher)** - Provides match results with statistics
- **F2.8 (Playlist Exporter)** - Uses ExportOptions interface

The Export Preview feature is in turn a dependency for:

- **F3.6 (Progress Tracker)** - Shows progress during export
- **F3.7 (Results Report)** - Shows export results

## Error Handling

- **Missing Match Data**: Shows error if no match results provided
- **Invalid Playlist ID**: Validates append/overwrite selection
- **Empty Match Results**: Shows warning and disables export

## Accessibility

- Keyboard navigation for mode selection
- ARIA labels for statistics and options
- Focus management for modal dialog
- Screen reader announcements for changes

## Date and Status

**Date Implemented:** January 4, 2026

**Status:** Completed

**Last Verified:** January 4, 2026

The Export Preview feature is fully implemented and verified. All sub-tasks have been completed, the code passes static analysis checks, and the implementation is ready for use by dependent features.

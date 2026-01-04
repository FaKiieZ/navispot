# Feature F3.7: Results Report

## Overview

Display a comprehensive summary of the playlist export results after the export process completes, showing statistics, unmatched tracks list, export log download option, and quick actions for re-exporting.

## User Stories

- As a user, I want to see a summary of how many tracks were successfully exported so I know the export quality.
- As a user, I want to see which tracks failed to match so I can manually find alternatives.
- As a user, I want to download the export log for my records or troubleshooting.
- As a user, I want to quickly start another export without going back to the dashboard.

## Requirements

### Functional Requirements

1. **Summary Statistics Cards**
   - Display total tracks processed
   - Show matched tracks count
   - Show unmatched tracks count
   - Show exported tracks count
   - Show failed exports count
   - Calculate and display match rate percentage

2. **Unmatched Tracks List**
   - List all tracks that couldn't be matched
   - Show track name, artist, and album
   - Display reason for match failure
   - Allow expanding for more details
   - Support pagination for large lists

3. **Export Log Download**
   - Generate a downloadable log file (JSON/CSV format)
   - Include timestamp, playlist name, and statistics
   - Include detailed list of all tracks with match status
   - Include candidate information for ambiguous matches

4. **Quick Actions**
   - "Export Again" button to restart export with same settings
   - "Back to Dashboard" button to return to playlist view
   - "View Details" button to see full match information

### Non-Functional Requirements

- Results should load immediately after export completion
- List should be sortable and filterable
- Log download should complete within 2 seconds
- Component should be responsive for mobile devices

## Technical Design

### Interface

```typescript
interface ExportResult {
  playlistName: string;
  timestamp: Date;
  statistics: {
    total: number;
    matched: number;
    unmatched: number;
    ambiguous: number;
    exported: number;
    failed: number;
  };
  matches: TrackMatch[];
  options: ExportOptions;
}

interface ResultsReportProps {
  result: ExportResult;
  onExportAgain: () => void;
  onBackToDashboard: () => void;
  onViewDetails?: (trackId: string) => void;
}
```

### Component Structure

```
ResultsReport/
├── ResultsReport.tsx      # Main component
├── SummaryCards.tsx       # Statistics summary cards
├── UnmatchedTrackList.tsx # List of unmatched tracks
├── ExportLogButton.tsx    # Download log functionality
├── QuickActions.tsx       # Export again and navigation buttons
└── types.ts               # Type definitions
```

### Data Flow

1. **From ProgressTracker**
   - Export completion triggers `onComplete` callback
   - Passes `ExportResult` object with all match data

2. **State Management**
   - Results stored in Dashboard component state
   - Passed to ResultsReport for rendering
   - Unmatched tracks filtered from matches array

### Integration Points

1. **Dashboard Component**
   - Receives export results from ProgressTracker
   - Displays ResultsReport when export completes
   - Passes callbacks for navigation

2. **ProgressTracker**
   - Modified to include match data in completion callback
   - Updates onComplete callback signature to include result

3. **Export Log Generator**
   - Formats match data into downloadable format
   - Creates JSON/CSV blob for download

## UI Design

### Layout

```
+--------------------------------------------------+
|  Export Complete                                 |
+--------------------------------------------------+
|  +------------+  +------------+  +------------+  |
|  | Total      |  | Matched    |  | Unmatched  |  |
|  | 50         |  | 42 (84%)   |  | 8 (16%)    |  |
|  +------------+  +------------+  +------------+  |
|                                                  |
|  +------------+  +------------+                  |
|  | Exported   |  | Failed     |                  |
|  | 40         |  | 2          |                  |
|  +------------+  +------------+                  |
+--------------------------------------------------+
|  Unmatched Tracks (8)                            |
+--------------------------------------------------+
|  [Track 1] _________________                     |
|  [Track 2] _________________                     |
|  [Track 3] _________________                     |
|  ...                                             |
+--------------------------------------------------+
|  [ Download Log ]  [ Export Again ]  [ Dashboard ]|
+--------------------------------------------------+
```

### Summary Cards Styling

- Use color-coded backgrounds for each statistic
- Large bold numbers for quick scanning
- Percentage indicators for key metrics
- Icons for visual recognition

### Unmatched Tracks List

- Table or card-based layout
- Show track details in expandable rows
- Include reason for match failure
- Pagination for large lists

### Export Log Format (JSON)

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "playlistName": "My Playlist",
  "options": {
    "mode": "create",
    "skipUnmatched": false
  },
  "statistics": {
    "total": 50,
    "matched": 42,
    "unmatched": 8,
    "exported": 40,
    "failed": 2
  },
  "tracks": [
    {
      "name": "Song Title",
      "artist": "Artist Name",
      "album": "Album Name",
      "status": "matched",
      "matchStrategy": "isrc",
      "navidromeId": "abc123"
    },
    {
      "name": "Unmatched Song",
      "artist": "Unknown Artist",
      "album": "Unknown Album",
      "status": "unmatched",
      "reason": "No candidates found"
    }
  ]
}
```

## Implementation Plan

### Step 1: Create Types and Interfaces
Define the ExportResult interface and component props.

### Step 2: Build ResultsReport Component
Create the main component with sub-components:
- SummaryCards
- UnmatchedTrackList
- ExportLogButton
- QuickActions

### Step 3: Update ProgressTracker Types
Modify ProgressTrackerProps to include result data in onComplete callback.

### Step 4: Integrate with Dashboard
Update Dashboard to display ResultsReport after export completion.

### Step 5: Implement Export Log Download
Create function to generate and download log file.

### Step 6: Styling and Polish
Apply Tailwind CSS for consistent styling.

## Dependencies

- F3.6 (Progress Tracker) - Provides completion state and results
- F2.8 (Playlist Exporter) - Provides export statistics
- React 19 - Component framework

## Testing Strategy

### Unit Tests
- Test summary card calculations
- Test export log generation
- Test navigation callbacks

### Integration Tests
- Test results display after export completion
- Test export again functionality
- Test log download

### Manual Testing
- Verify all statistics are accurate
- Test download on different browsers
- Verify responsive layout
- Test with various playlist sizes

## Acceptance Criteria

1. Summary cards show correct statistics after export
2. Unmatched tracks list displays all failed matches
3. Export log downloads correctly in JSON format
4. Export Again button restarts the export flow
5. Dashboard integration works correctly
6. Component is responsive on mobile devices
7. Statistics match the actual export results

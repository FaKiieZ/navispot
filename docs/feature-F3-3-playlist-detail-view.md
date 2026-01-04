# Feature F3.3: Playlist Detail View

## Overview
Displays detailed information about a selected playlist, including a list of tracks with their match status and summary statistics.

## Requirements
- Track list with columns: title, artist, album
- Match status column (color-coded)
- Matched/unmatched counts summary

## Dependencies
- F2.7 Batch Matcher

## Data Structures

### Track List Props
```typescript
interface PlaylistDetailProps {
  playlistId: string;
  playlistName: string;
  tracks: SpotifyPlaylistTrack[];
  matches: TrackMatch[];
  statistics: {
    total: number;
    matched: number;
    ambiguous: number;
    unmatched: number;
    byStrategy: Record<MatchStrategy, number>;
  };
  onBack?: () => void;
  onExport?: () => void;
}
```

### Match Status Indicators
- Green: matched (exact match via ISRC, fuzzy, or strict)
- Yellow: ambiguous (multiple candidates above threshold)
- Red: unmatched (no suitable match found)

## Components

### PlaylistDetail
Main component that orchestrates the display of track list and statistics.

### TrackList
Table component displaying:
- Track title
- Artist name(s)
- Album name
- Match status indicator
- Match strategy (if matched)

### MatchStatistics
Summary component displaying:
- Total tracks count
- Matched count (with percentage)
- Ambiguous count (with percentage)
- Unmatched count (with percentage)

### MatchStatusBadge
Visual indicator for match status with tooltip showing details.

## Implementation Details

### Track Duration Formatting
Convert milliseconds to MM:SS format for display.

### Artist Name Handling
Multiple artists are joined with commas.

### Match Strategy Display
Show strategy used for matched tracks:
- "ISRC" for ISRC matches
- "Fuzzy" for fuzzy matches
- "Strict" for strict matches
- "None" for unmatched tracks

### Responsive Design
- Hide album column on small screens
- Use horizontal scroll for track table on mobile
- Stack statistics cards on mobile

## Files Modified
- `app/playlist/[id]/page.tsx` - Playlist detail page
- `app/components/PlaylistDetail.tsx` - Main component
- `app/components/TrackList.tsx` - Track table component
- `app/components/MatchStatistics.tsx` - Statistics summary
- `app/components/MatchStatusBadge.tsx` - Status indicator
- `types/index.ts` - Extended types if needed

## Testing
- Verify all track columns display correctly
- Check color-coded match status
- Validate summary statistics calculations
- Test responsive behavior
- Verify tooltip functionality

## Future Enhancements
- Sortable columns
- Filter by match status
- Search within track list
- Pagination for large playlists
- Inline candidate selection for ambiguous matches

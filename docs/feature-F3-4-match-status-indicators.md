# Feature F3.4: Match Status Indicators

## Overview

Visual indicators that show the match status of each track in a playlist, using color coding and tooltips to communicate match quality and details.

## Requirements

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Green: matched (with match type) | ✓ Done | `MatchStatusBadge.tsx:21-25` |
| Yellow: ambiguous (show candidate count) | ✓ Done | `MatchStatusBadge.tsx:26-30` |
| Red: unmatched | ✓ Done | `MatchStatusBadge.tsx:31-35` |
| Tooltip with match details | ✓ Done | `MatchStatusBadge.tsx:46-61` |

## Components

### MatchStatusBadge

**File:** `app/components/MatchStatusBadge.tsx`

**Props:**
```typescript
interface MatchStatusBadgeProps {
  status: MatchStatus;           // 'matched' | 'ambiguous' | 'unmatched'
  strategy?: MatchStrategy;       // 'isrc' | 'fuzzy' | 'strict' | 'none'
  candidates?: number;            // Number of candidate matches
  navidromeTitle?: string;        // Matched song title
  navidromeArtist?: string;       // Matched artist name
}
```

**Features:**
- Color-coded badges with icons
- Strategy label for matched tracks
- Candidate count for ambiguous matches
- Hover tooltips with detailed information
- Responsive design (hides labels on small screens)

### TrackList

**File:** `app/components/TrackList.tsx`

**Features:**
- Table display of playlist tracks
- MatchStatusBadge in dedicated "Status" column
- Columns: #, Title, Artist, Album, Duration, Status
- Responsive column hiding (md, lg breakpoints)
- Handles missing tracks gracefully

### MatchStatistics

**File:** `app/components/MatchStatistics.tsx`

**Features:**
- Summary cards for Matched, Ambiguous, Unmatched
- Color-coded cards matching badge colors
- Progress bars showing percentage
- Responsive grid layout (2 cols mobile, 4 cols desktop)

### PlaylistDetail

**File:** `app/components/PlaylistDetail.tsx`

**Features:**
- Collapsible track list section
- Export button integration
- Match statistics display
- Track count and match rate summary

## Usage Example

```tsx
import { MatchStatusBadge } from './MatchStatusBadge';
import { TrackList } from './TrackList';
import { MatchStatistics } from './MatchStatistics';

// In component:
<MatchStatistics statistics={statistics} />

<TrackList tracks={tracks} matches={matches} />

// Or individual badge:
<MatchStatusBadge
  status="matched"
  strategy="isrc"
  navidromeTitle="Song Title"
  navidromeArtist="Artist Name"
/>
```

## Visual Design

### Colors
- **Matched:** `bg-green-500/10 text-green-500 border-green-500/20`
- **Ambiguous:** `bg-yellow-500/10 text-yellow-500 border-yellow-500/20`
- **Unmatched:** `bg-red-500/10 text-red-500 border-red-500/20`

### Icons
- Matched: ✓ (check)
- Ambiguous: ? (question mark)
- Unmatched: ✗ (cross)

### Tooltip Content
- **Matched:** "Matched (via ISRC) - Found: Title - Artist"
- **Ambiguous:** "Ambiguous - 3 candidates found"
- **Unmatched:** "Unmatched - No match in Navidrome"

## Dependencies

- Feature F2.7 (Batch Matcher) - provides TrackMatch data
- Feature F3.3 (Playlist Detail View) - uses TrackList component

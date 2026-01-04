# NaviSpot-Plist: Spotify to Navidrome Playlist Exporter

## Project Overview

A Next.js web application that exports playlists from Spotify to Navidrome music server with flexible matching strategies.

## Architecture

- **Frontend**: Next.js 16 (React 19) + Tailwind CSS
- **Backend**: Next.js API Routes
- **Authentication**: Spotify OAuth 2.0 + Navidrome Basic Auth
- **State Management**: React Context + localStorage

## Authentication

### Spotify OAuth 2.0
- Flow: Authorization Code with PKCE (recommended for client-side) or standard flow
- Scopes: `playlist-read-private`, `playlist-read-collaborative`
- Token storage: In-memory + localStorage (encrypted)
- Refresh token handling: Automatic refresh before expiry

### Navidrome Authentication
- Method: Subsonic API Basic Auth
- Credentials: Username + Password stored in localStorage
- No server-side credential storage

## Features

### 1. Playlist Export
- One-way sync: Spotify → Navidrome
- Export modes:
  - Append to existing playlist
  - Create new playlist
  - Overwrite existing playlist

### 2. Track Matching Strategies
- **Strict Matching**: Exact match on artist + title
- **Fuzzy Matching**: Levenshtein distance with configurable threshold (0.0-1.0)
- **ISRC Matching**: Use International Standard Recording Code when available
- **Manual Review**: User selects from multiple candidates
- **Fallback Chain**: Try ISRC → Fuzzy → Strict → Skip

### 3. Batch Operations
- Export all playlists at once
- Select individual playlists
- Filter by playlist name/date

## API Design

### Spotify API Routes
```
GET  /api/auth/spotify          - Initiate OAuth flow
GET  /api/auth/callback         - Handle OAuth callback
GET  /api/spotify/playlists     - List user playlists
GET  /api/spotify/playlists/:id - Get playlist details
GET  /api/spotify/tracks/:id    - Get playlist tracks (paginated)
```

### Navidrome API Routes
```
POST /api/navidrome/auth        - Test/store credentials
GET  /api/navidrome/playlists   - List existing playlists
POST /api/navidrome/search      - Search songs
POST /api/navidrome/playlist    - Create new playlist
PUT  /api/navidrome/playlist    - Update playlist (add tracks)
DELETE /api/navidrome/playlist  - Delete playlist
```

## Data Models

### Spotify Track
```typescript
interface SpotifyTrack {
  id: string;
  name: string;
  artists: { id: string; name: string }[];
  album: { id: string; name: string; release_date: string };
  duration_ms: number;
  external_ids: { isrc?: string };
  external_urls: { spotify: string };
}
```

### Spotify Playlist
```typescript
interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  images: { url: string }[];
  owner: { id: string; display_name: string };
  tracks: { total: number };
  snapshot_id: string;
}
```

### Navidrome Song
```typescript
interface NavidromeSong {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  isrc?: string;
}
```

### Navidrome Playlist
```typescript
interface NavidromePlaylist {
  id: string;
  name: string;
  comment?: string;
  songCount: number;
  duration: number;
  createdAt: string;
  updatedAt: string;
}
```

### Track Match Result
```typescript
interface TrackMatch {
  spotifyTrack: SpotifyTrack;
  navidromeSong?: NavidromeSong;
  matchScore: number;
  matchStrategy: 'isrc' | 'fuzzy' | 'strict' | 'none';
  status: 'matched' | 'ambiguous' | 'unmatched';
  candidates?: NavidromeSong[];
}
```

## Matching Algorithm

### ISRC Matching
1. Extract ISRC from Spotify `external_ids`
2. Search Navidrome for songs with matching ISRC
3. Return exact match if found

### Fuzzy Matching
1. Create search query: `${artist} ${title}`
2. Search Navidrome using `search3` endpoint
3. Calculate similarity score for each result
4. Apply threshold (default 0.8)
5. If multiple results above threshold → ambiguous

### Strict Matching
1. Normalize strings (lowercase, remove special chars)
2. Exact match on artist + title
3. Return single match or none

### Priority Order
1. ISRC (highest priority - most accurate)
2. Fuzzy matching (configurable threshold)
3. Strict matching (fallback)
4. Skip unmatched tracks

## Export Process

### Step-by-Step Flow
1. User authenticates with Spotify
2. User enters Navidrome credentials (stored in localStorage)
3. Fetch Spotify playlists
4. For each selected playlist:
   a. Fetch all tracks (handle pagination)
   b. For each track:
      - Try matching strategies in order
      - Record match status
   c. Show preview with match results
   d. User confirms export options
   e. Create/update Navidrome playlist
   f. Add matched song IDs
5. Show final report (success/fail counts)

### Error Handling
- Spotify token expired → refresh automatically
- Navidrome auth failed → prompt for credentials again
- Network errors → retry with exponential backoff
- Rate limiting → implement delays between requests
- Large playlists → process in batches of 100 tracks

## UI Components

### Pages
1. **Login Page**: Spotify Connect button + Navidrome credentials form
2. **Dashboard**: List Spotify playlists with export status
3. **Playlist Detail**: Track list with match status indicators
4. **Export Progress**: Real-time progress with cancel option
5. **Results Report**: Summary of successful/failed matches

### Key Components
- `PlaylistCard`: Display playlist with track count, image
- `TrackList`: Table of tracks with match status
- `MatchIndicator`: Color-coded match status (green/yellow/red)
- `CandidateSelector`: Modal for manual match selection
- `MatchSettings`: Configure matching strategies and thresholds
- `ExportControls`: Export options and progress display

## Environment Variables

```env
# Spotify (required)
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/auth/callback

# Navidrome (configured via UI, stored in localStorage)
# NAVIDROME_URL
# NAVIDROME_USERNAME
# NAVIDROME_PASSWORD

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Security Considerations

- Spotify tokens: Encrypt before storing in localStorage
- Navidrome credentials: Simple base64 encoding (Subsonic requirement)
- HTTPS required in production
- No server-side credential storage
- CSRF protection on API routes

## Future Enhancements (Post-MVP)

- Bidirectional sync (Navidrome → Spotify)
- Sync scheduling (automatic periodic export)
- Webhook integration for real-time updates
- Multiple Navidrome server support
- Playlist templates and presets
- Advanced filtering and rules
- Export history and versioning
- Rate limit visualization
- Dark/light theme

## Development Phases

### Phase 1: Foundation
- Project setup and configuration
- Spotify OAuth implementation
- Navidrome API client

### Phase 2: Core Features
- Playlist fetching (Spotify)
- Track matching algorithms
- Basic export functionality

### Phase 3: UI/UX
- Dashboard and playlist views
- Match status visualization
- Progress tracking

### Phase 4: Polish
- Error handling and retries
- Match settings UI
- Export options
- Results reporting

## Testing Strategy

- Unit tests for matching algorithms
- Integration tests for API routes
- E2E tests for export flow
- Manual testing with real Spotify/Navidrome instances

## Deployment Options

- Vercel (frontend-heavy, API routes)
- Docker container
- Standalone Node.js server
- Same host as Navidrome

## References

- [Spotify Web API](https://developer.spotify.com/documentation/web-api/)
- [Navidrome Subsonic API](https://navidrome.org/docs/developers/subsonic-api/)
- [Subsonic API Reference](http://www.subsonic.org/pages/api.jsp)
- [OpenSubsonic Extensions](https://opensubsonic.netlify.app/)

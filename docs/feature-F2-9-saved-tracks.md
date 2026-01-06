# Feature F2.9: Saved Tracks Fetching

## Overview

Implements functionality to fetch all user's saved/liked songs from Spotify, including pagination handling and automatic rate limiting.

## Implementation Details

### Files Modified/Created

| File | Action | Description |
|------|--------|-------------|
| `types/spotify.ts` | Modified | Added `SpotifySavedTrack` and `SpotifySavedTracksResponse` interfaces |
| `lib/spotify/client.ts` | Modified | Added `getSavedTracks()` and `getAllSavedTracks()` methods |
| `docs/feature-F2-9-saved-tracks.md` | Created | This documentation file |

### Requirements Met

| Requirement | Status | Location |
|-------------|--------|----------|
| Fetch single page of saved tracks | ✅ | `client.ts:54-60` (getSavedTracks) |
| Fetch all saved tracks with pagination | ✅ | `client.ts:62-76` (getAllSavedTracks) |
| Rate limiting on all requests | ✅ | `client.ts:55` (spotifyRateLimiter.acquire) |

## Components

### getSavedTracks() Method

Located in `lib/spotify/client.ts`:

```typescript
async getSavedTracks(limit: number = 50, offset: number = 0): Promise<SpotifySavedTracksResponse> {
  await spotifyRateLimiter.acquire();
  const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
  const response = await this.fetch(`/me/tracks?${params.toString()}`);
  return response.json();
}
```

### getAllSavedTracks() Method

Located in `lib/spotify/client.ts`:

```typescript
async getAllSavedTracks(): Promise<SpotifySavedTrack[]> {
  const allTracks: SpotifySavedTrack[] = [];
  let offset = 0;
  const limit = 50;

  while (true) {
    const response = await this.getSavedTracks(limit, offset);
    allTracks.push(...response.items);

    if (!response.next) break;
    offset += limit;
  }

  return allTracks;
}
```

## Data Model

### SpotifySavedTrack

```typescript
interface SpotifySavedTrack {
  added_at: string;  // ISO 8601 timestamp when track was saved
  track: SpotifyTrack;  // The track details
}
```

### SpotifySavedTracksResponse

```typescript
interface SpotifySavedTracksResponse {
  href: string;  // URL that returned this response
  items: SpotifySavedTrack[];  // Array of saved tracks
  limit: number;  // Maximum number of items returned
  next?: string;  // URL for next page of results (null if no more pages)
  previous?: string;  // URL for previous page (null if first page)
  offset: number;  // Offset of the first item returned
  total: number;  // Total number of saved tracks
}
```

## Usage Example

```typescript
import { spotifyClient } from '@/lib/spotify/client';

async function fetchAllSavedTracks() {
  await spotifyClient.loadToken();

  const savedTracks = await spotifyClient.getAllSavedTracks();

  console.log(`Found ${savedTracks.length} saved tracks`);

  savedTracks.forEach(item => {
    console.log(`"${item.track.name}" by ${item.track.artists.map(a => a.name).join(', ')}`);
    console.log(`  Saved on: ${item.added_at}`);
  });

  return savedTracks;
}

// Alternative: Fetch single page
async function fetchFirstPage() {
  await spotifyClient.loadToken();

  const response = await spotifyClient.getSavedTracks(50, 0);
  console.log(`Total saved tracks: ${response.total}`);
  return response.items;
}
```

## API Endpoint

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/me/tracks` | Get user's saved tracks |

## Pagination Behavior

1. **Initial Fetch**: Gets first 50 saved tracks (default limit)
2. **Check Next**: Checks for `next` property in response
3. **Continue**: Fetches next page if `next` exists
4. **Aggregate**: Collects all items into single array
5. **Return**: Returns complete list of all saved tracks

## Rate Limiting

All API requests are subject to Spotify's rate limits via the `spotifyRateLimiter`:

- Each page fetch acquires a rate limit token
- Prevents HTTP 429 responses from Spotify
- Applied consistently to both single-page and paginated requests

## Dependencies

- **F1.3 Spotify API Client**: Base client with authentication and token refresh
- **lib/spotify/rate-limiter.ts**: Rate limiting to avoid API throttling
- **F1.2 Spotify OAuth**: Token management for authenticated requests

## Testing

Run the following to verify the implementation:

```bash
# Type check
npm run typecheck

# Lint
npm run lint
```

## Notes

- The `added_at` field contains the ISO 8601 timestamp when the track was saved
- Saved tracks are returned in reverse chronological order (most recently saved first)
- Pagination is handled automatically without manual intervention
- Rate limiting is applied to each page fetch
- All saved tracks are returned in a single array
- Track counts reflect the current state of the user's library

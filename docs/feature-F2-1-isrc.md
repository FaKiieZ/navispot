# Feature F2.1: Track Matching - ISRC

## Feature Overview

The ISRC (International Standard Recording Code) Matching feature provides a high-precision method for matching Spotify tracks to Navidrome songs using their ISRC codes. ISRC is the international identification system for sound recordings and music video recordings, making it the most accurate method for track matching when available.

### Purpose and Functionality

The ISRC matching feature enables the application to:
- Extract ISRC codes from Spotify track metadata
- Search Navidrome's library for songs with matching ISRC codes
- Return precise match results with full song details
- Handle cases where ISRC codes are missing or not found

ISRC matching is the highest priority strategy in the matching chain because it provides the most reliable identification of recordings across different platforms and releases.

## Sub-tasks Implemented

### Extract ISRC from Spotify Track

The matching function extracts the ISRC code from the Spotify track's `external_ids` field. The Spotify API provides ISRC codes as part of the track metadata when available:

```typescript
const isrc = spotifyTrack.external_ids?.isrc;
```

The implementation handles cases where:
- The `external_ids` field is undefined
- The `isrc` property is missing from `external_ids`
- The ISRC code is present but the song doesn't exist in Navidrome

### Search Navidrome by ISRC

The `NavidromeApiClient` class now includes a `searchByISRC` method that:
- Uses the Subsonic `search3` endpoint to search for songs
- Filters results to find exact ISRC matches
- Returns the matched song or `null` if no match exists

```typescript
async searchByISRC(isrc: string): Promise<NavidromeSong | null> {
  const url = this._buildUrl('/rest/search3', {
    query: isrc,
    songCount: '10',
  });

  const response = await this._makeRequest<{
    searchResult3: SearchResult3;
  }>(url);

  const songs = response.searchResult3?.song || [];
  const match = songs.find((song) => song.isrc === isrc);

  return match || null;
}
```

### Return Match or Null

The matching function returns a `TrackMatch` object with:
- `status`: 'matched' if a song is found, 'unmatched' otherwise
- `matchStrategy`: Always 'isrc' for this matching function
- `matchScore`: 1.0 for matches, 0.0 for no matches
- `navidromeSong`: The matched song details (if found)
- `spotifyTrack`: Reference to the original Spotify track

## File Structure

```
types/matching.ts            # Type definitions for track matching
types/navidrome.ts           # Navidrome types including isrc field
lib/navidrome/client.ts      # API client with searchByISRC method
lib/matching/isrc-matcher.ts # ISRC matching implementation
```

### types/matching.ts

This file contains the type definitions for track matching:

- `MatchStrategy` - Union type for matching strategies ('isrc' | 'fuzzy' | 'strict' | 'none')
- `MatchStatus` - Union type for match status ('matched' | 'ambiguous' | 'unmatched')
- `TrackMatch` - Interface representing a complete match result with all metadata

### lib/matching/isrc-matcher.ts

This file contains the ISRC matching implementation:

- `matchByISRC` - Async function that matches a Spotify track to a Navidrome song using ISRC

### lib/navidrome/client.ts

This file now includes:

- `searchByISRC` - Method to search for songs by ISRC code

## Usage Examples

### Basic ISRC Matching

```typescript
import { NavidromeApiClient } from '@/lib/navidrome/client';
import { matchByISRC } from '@/lib/matching/isrc-matcher';

const client = new NavidromeApiClient(
  'https://navidrome.example.com',
  'myusername',
  'mypassword'
);

const spotifyTrack = {
  id: '4cOdK2wGLETKBW3PvgPWqT',
  name: 'Never Gonna Give You Up',
  artists: [{ id: '1', name: 'Rick Astley' }],
  album: { id: 'a1', name: 'Whenever You Need Somebody', release_date: '1987-11-15' },
  duration_ms: 213000,
  external_ids: { isrc: 'GB-KAN-87-00001' },
  external_urls: { spotify: 'https://open.spotify.com/track/...' }
};

const result = await matchByISRC(client, spotifyTrack);

console.log(result.status); // 'matched' or 'unmatched'
console.log(result.matchStrategy); // 'isrc'
console.log(result.matchScore); // 1.0 or 0.0
if (result.navidromeSong) {
  console.log(result.navidromeSong.title);
  console.log(result.navidromeSong.artist);
}
```

### Handling Missing ISRC

```typescript
const trackWithoutIsrc = {
  id: 'abc123',
  name: 'Unknown Track',
  artists: [{ id: '1', name: 'Unknown Artist' }],
  album: { id: 'a1', name: 'Unknown Album', release_date: '2020-01-01' },
  duration_ms: 180000,
  external_ids: {}, // No external_ids or isrc
  external_urls: { spotify: 'https://open.spotify.com/track/...' }
};

const result = await matchByISRC(client, trackWithoutIsrc);
console.log(result.status); // 'unmatched'
console.log(result.matchScore); // 0.0
console.log(result.navidromeSong); // undefined
```

## API Reference

### Function: matchByISRC

```typescript
async function matchByISRC(
  client: NavidromeApiClient,
  spotifyTrack: SpotifyTrack
): Promise<TrackMatch>
```

**Parameters:**
- `client` (NavidromeApiClient) - An authenticated Navidrome API client instance
- `spotifyTrack` (SpotifyTrack) - A Spotify track object containing the track metadata

**Returns:** A Promise resolving to a `TrackMatch` object with the following structure:

```typescript
interface TrackMatch {
  spotifyTrack: SpotifyTrack;
  navidromeSong?: NavidromeSong;
  matchScore: number;
  matchStrategy: 'isrc';
  status: 'matched' | 'unmatched';
  candidates?: NavidromeSong[];
}
```

**Behavior:**
- If the Spotify track has an ISRC code and a matching song exists in Navidrome, returns a match with `status: 'matched'` and `matchScore: 1`
- If the Spotify track has an ISRC code but no matching song exists, returns `status: 'unmatched'` with `matchScore: 0`
- If the Spotify track doesn't have an ISRC code, returns `status: 'unmatched'` with `matchScore: 0`
- If an error occurs during the search, returns `status: 'unmatched'` with `matchScore: 0`

### Method: searchByISRC (NavidromeApiClient)

```typescript
async searchByISRC(isrc: string): Promise<NavidromeSong | null>
```

**Parameters:**
- `isrc` (string) - The ISRC code to search for

**Returns:** A Promise resolving to the matching `NavidromeSong` object, or `null` if no match is found or an error occurs.

## Integration with Matching Chain

ISRC matching is the highest priority strategy in the matching chain (F2.4 Matching Orchestrator):

```
Priority Order:
1. ISRC (highest priority - most accurate)
2. Fuzzy matching (configurable threshold)
3. Strict matching (fallback)
4. Skip unmatched tracks
```

When implementing the matching orchestrator, ISRC matching should be attempted first:

```typescript
async function matchTrack(
  client: NavidromeApiClient,
  spotifyTrack: SpotifyTrack
): Promise<TrackMatch> {
  // Try ISRC first (highest accuracy)
  const isrcMatch = await matchByISRC(client, spotifyTrack);
  if (isrcMatch.status === 'matched') {
    return isrcMatch;
  }

  // Fall back to other strategies...
}
```

## Dependencies

This feature depends on **F1.5 (Search Functionality)** for:
- The `search3` endpoint wrapper
- Type definitions for `SearchResult3`
- Error handling patterns

The ISRC matching is in turn a dependency for:
- **F2.4 Matching Orchestrator** - Uses ISRC matching as the first strategy in the chain
- **F2.7 Batch Matcher** - Uses ISRC matching when processing playlist tracks

## Verification Results

### TypeScript Compilation

The TypeScript implementation compiles successfully with the project's TypeScript configuration. All type definitions are correctly exported and used throughout the implementation.

### ESLint Checks

The code passes all ESLint checks with the project's configuration. This includes proper use of TypeScript types, consistent code style, and adherence to best practices for async/await usage and error handling.

## Date and Status

**Date Implemented:** January 4, 2026

**Status:** Completed

**Last Verified:** January 4, 2026

The ISRC Matching feature is fully implemented and verified. All sub-tasks have been completed, the code passes static analysis checks, and the implementation is ready for use by dependent features.

# Feature F2.4: Matching Orchestrator

## Feature Overview

The Matching Orchestrator feature chains multiple track matching strategies (ISRC → Fuzzy → Strict) to maximize the likelihood of successfully matching Spotify tracks to Navidrome songs. It provides a unified interface for track matching with configurable strategies and comprehensive statistics.

### Purpose and Functionality

The matching orchestrator enables the application to:

- Chain matching strategies in priority order (ISRC → Fuzzy → Strict)
- Track which strategy succeeded for each match
- Collect ambiguous matches requiring manual review
- Provide configurable matching options
- Generate statistics for match results
- Support batch processing of multiple tracks

## Sub-tasks Implemented

### Chain Matching Strategies

The orchestrator attempts matching strategies in the following order:

1. **ISRC Matching** (highest priority) - Uses International Standard Recording Code for precise identification
2. **Fuzzy Matching** - Uses Levenshtein distance for similarity-based matching
3. **Strict Matching** - Uses exact string matching on artist + title

The chain stops at the first successful match, ensuring optimal accuracy.

### Track Which Strategy Succeeded

Each match result includes the strategy that was used:

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

### Collect Ambiguous Matches

When fuzzy matching returns multiple close candidates (within 0.05 of the best score), the result is marked as 'ambiguous' with all candidates included for manual review.

## File Structure

```
lib/matching/
├── orchestrator.ts    # Matching orchestrator implementation
├── isrc-matcher.ts   # ISRC matching strategy
├── fuzzy.ts          # Fuzzy matching strategy
└── strict-matcher.ts # Strict matching strategy
```

### lib/matching/orchestrator.ts

This file contains the orchestrator implementation:

- `MatchingOrchestratorOptions` - Configuration interface for matching behavior
- `defaultMatchingOptions` - Default configuration values
- `MatchingStrategyResult` - Individual strategy result
- `OrchestratedMatchResult` - Complete match result with all strategy attempts
- `matchTrack()` - Match a single Spotify track
- `matchTracks()` - Match multiple tracks in batch
- `getMatchStatistics()` - Calculate match statistics
- `getAmbiguousMatches()` - Get all ambiguous matches
- `getUnmatchedTracks()` - Get all unmatched tracks
- `getMatchedTracks()` - Get all successfully matched tracks

## Usage Examples

### Basic Single Track Matching

```typescript
import { NavidromeApiClient } from '@/lib/navidrome/client';
import { matchTrack } from '@/lib/matching/orchestrator';

const client = new NavidromeApiClient(
  'https://navidrome.example.com',
  'username',
  'password'
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

const result = await matchTrack(client, spotifyTrack);

console.log(result.status); // 'matched', 'ambiguous', or 'unmatched'
console.log(result.matchStrategy); // 'isrc', 'fuzzy', 'strict', or 'none'
console.log(result.matchScore); // 0.0 - 1.0
if (result.navidromeSong) {
  console.log(result.navidromeSong.title);
}
```

### Batch Track Matching

```typescript
const spotifyTracks = [
  /* array of SpotifyTrack objects */
];

const results = await matchTracks(client, spotifyTracks);

for (const match of results) {
  console.log(`${match.spotifyTrack.name} - ${match.matchStrategy}: ${match.status}`);
}
```

### Custom Matching Options

```typescript
const result = await matchTrack(client, spotifyTrack, {
  enableISRC: true,
  enableFuzzy: true,
  enableStrict: true,
  fuzzyThreshold: 0.85,  // Higher threshold for more precise matches
  maxFuzzyCandidates: 30,
});
```

### Getting Statistics

```typescript
const results = await matchTracks(client, spotifyTracks);
const stats = getMatchStatistics(results);

console.log(`Total: ${stats.total}`);
console.log(`Matched: ${stats.matched} (ISRC: ${stats.byStrategy.isrc}, Fuzzy: ${stats.byStrategy.fuzzy}, Strict: ${stats.byStrategy.strict})`);
console.log(`Ambiguous: ${stats.ambiguous}`);
console.log(`Unmatched: ${stats.unmatched}`);
```

### Handling Ambiguous Matches

```typescript
const results = await matchTracks(client, spotifyTracks);
const ambiguous = getAmbiguousMatches(results);

for (const match of ambiguous) {
  console.log(`Ambiguous match: ${match.spotifyTrack.name}`);
  console.log('Candidates:');
  match.candidates?.forEach((song, i) => {
    console.log(`  ${i + 1}. ${song.title} - ${song.artist} (score unknown)`);
  });
}
```

## API Reference

### Function: matchTrack

```typescript
async function matchTrack(
  client: NavidromeApiClient,
  spotifyTrack: SpotifyTrack,
  options?: Partial<MatchingOrchestratorOptions>
): Promise<TrackMatch>
```

**Parameters:**
- `client` (NavidromeApiClient) - An authenticated Navidrome API client instance
- `spotifyTrack` (SpotifyTrack) - A Spotify track object to match
- `options` (MatchingOrchestratorOptions, optional) - Custom matching options

**Returns:** A Promise resolving to a `TrackMatch` object.

**Behavior:**
- Attempts ISRC matching first if enabled
- Falls back to fuzzy matching if ISRC fails and enabled
- Falls back to strict matching if fuzzy fails and enabled
- Returns ambiguous status if fuzzy returns multiple close candidates
- Returns unmatched if no strategies succeed

### Function: matchTracks

```typescript
async function matchTracks(
  client: NavidromeApiClient,
  spotifyTracks: SpotifyTrack[],
  options?: Partial<MatchingOrchestratorOptions>
): Promise<TrackMatch[]>
```

**Parameters:**
- `client` (NavidromeApiClient) - An authenticated Navidrome API client instance
- `spotifyTracks` (SpotifyTrack[]) - Array of Spotify tracks to match
- `options` (MatchingOrchestratorOptions, optional) - Custom matching options

**Returns:** A Promise resolving to an array of `TrackMatch` objects.

### Function: getMatchStatistics

```typescript
function getMatchStatistics(matches: TrackMatch[]): {
  total: number;
  matched: number;
  ambiguous: number;
  unmatched: number;
  byStrategy: Record<MatchStrategy, number>;
}
```

**Parameters:**
- `matches` (TrackMatch[]) - Array of match results

**Returns:** Statistics object with counts and strategy breakdown.

### Interface: MatchingOrchestratorOptions

```typescript
interface MatchingOrchestratorOptions {
  enableISRC: boolean;           // Enable ISRC matching (default: true)
  enableFuzzy: boolean;          // Enable fuzzy matching (default: true)
  enableStrict: boolean;         // Enable strict matching (default: true)
  fuzzyThreshold: number;        // Minimum similarity score (default: 0.8)
  maxFuzzyCandidates: number;    // Max candidates for fuzzy search (default: 20)
}
```

## Matching Chain Details

### Priority Order

1. **ISRC (highest priority)**
   - Most accurate method when ISRC codes are available
   - Exact match on ISRC code
   - Returns immediately if match found

2. **Fuzzy Matching**
   - Handles minor variations in artist/title names
   - Configurable similarity threshold
   - Detects ambiguous matches (multiple close candidates)
   - Proceeds to strict matching if no match or ambiguous

3. **Strict Matching**
   - Fallback for remaining unmatched tracks
   - Exact match on normalized artist + title
   - Final attempt before marking as unmatched

### Match Status

- **matched**: Unique high-confidence match found
- **ambiguous**: Multiple similar candidates exist (requires manual review)
- **unmatched**: No suitable match found after trying all strategies

## Dependencies

This feature depends on:

- **F2.1 (ISRC Matching)** - Uses `matchByISRC` function
- **F2.2 (Fuzzy Matching)** - Uses `findBestMatch` function
- **F2.3 (Strict Matching)** - Uses `matchByStrict` function
- **F1.4 (Navidrome API Client)** - Uses `search` method for fuzzy matching candidates

The Matching Orchestrator is in turn a dependency for:

- **F2.7 (Batch Matcher)** - Uses orchestrator for processing playlist tracks
- **F3.3 (Playlist Detail View)** - Displays match results and statistics
- **F3.5 (Export Preview)** - Shows matched/unmatched counts before export

## Configuration Options

### Default Configuration

```typescript
const defaultMatchingOptions: MatchingOrchestratorOptions = {
  enableISRC: true,
  enableFuzzy: true,
  enableStrict: true,
  fuzzyThreshold: 0.8,
  maxFuzzyCandidates: 20,
};
```

### Custom Threshold Example

```typescript
// High precision - fewer but more confident matches
const preciseOptions = {
  fuzzyThreshold: 0.9,
  maxFuzzyCandidates: 10,
};

// High recall - more matches but potentially more false positives
const lenientOptions = {
  fuzzyThreshold: 0.7,
  maxFuzzyCandidates: 50,
};
```

## Performance Considerations

- Batch matching processes tracks sequentially to avoid overwhelming the Navidrome API
- Fuzzy matching fetches candidates with configurable limits
- Consider rate limiting for large playlists (100+ tracks)
- Caching normalized strings could improve batch performance

## Error Handling

- ISRC errors fall through to fuzzy matching
- Fuzzy matching errors fall through to strict matching
- Strict matching errors result in unmatched status
- Network errors are caught and handled gracefully
- Each strategy returns consistent TrackMatch structure regardless of errors

## Verification Results

### TypeScript Compilation

The TypeScript implementation compiles successfully with the project's TypeScript configuration. All type definitions are correctly exported and match the expected data structures.

### ESLint Checks

The code passes all ESLint checks with the project's configuration. This includes proper use of TypeScript types, consistent code style, and adherence to best practices for async/await usage.

## Date and Status

**Date Implemented:** January 4, 2026

**Status:** Completed

**Last Verified:** January 4, 2026

The Matching Orchestrator feature is fully implemented and verified. All sub-tasks have been completed, the code passes static analysis checks, and the implementation is ready for use by dependent features.

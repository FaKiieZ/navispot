import { SpotifyTrack } from '@/types/spotify';
import { NavidromeSong } from '@/types/navidrome';
import { TrackMatch, MatchStrategy, MatchStatus } from '@/types/matching';
import { NavidromeApiClient } from '@/lib/navidrome/client';
import { matchByISRC } from './isrc-matcher';
import { matchByStrict } from './strict-matcher';
import { findBestMatch } from './fuzzy';

export interface MatchingOrchestratorOptions {
  enableISRC: boolean;
  enableFuzzy: boolean;
  enableStrict: boolean;
  fuzzyThreshold: number;
  maxFuzzyCandidates: number;
}

export const defaultMatchingOptions: MatchingOrchestratorOptions = {
  enableISRC: true,
  enableFuzzy: true,
  enableStrict: true,
  fuzzyThreshold: 0.8,
  maxFuzzyCandidates: 20,
};

export interface MatchingStrategyResult {
  strategy: MatchStrategy;
  matched: boolean;
  ambiguous: boolean;
  navidromeSong?: NavidromeSong;
  candidates?: NavidromeSong[];
  score: number;
}

export interface OrchestratedMatchResult {
  spotifyTrack: SpotifyTrack;
  strategyResults: MatchingStrategyResult[];
  finalMatch: MatchingStrategyResult;
  overallStatus: MatchStatus;
}

export async function matchTrack(
  client: NavidromeApiClient,
  spotifyTrack: SpotifyTrack,
  options: Partial<MatchingOrchestratorOptions> = {}
): Promise<TrackMatch> {
  const opts: MatchingOrchestratorOptions = { ...defaultMatchingOptions, ...options };
  const strategyResults: MatchingStrategyResult[] = [];

  if (opts.enableISRC) {
    const isrcResult = await matchByISRC(client, spotifyTrack);
    strategyResults.push({
      strategy: 'isrc',
      matched: isrcResult.status === 'matched',
      ambiguous: false,
      navidromeSong: isrcResult.navidromeSong,
      score: isrcResult.matchScore,
    });

    if (isrcResult.status === 'matched') {
      return {
        spotifyTrack,
        navidromeSong: isrcResult.navidromeSong,
        matchStrategy: 'isrc',
        matchScore: 1,
        status: 'matched',
      };
    }
  }

  if (opts.enableFuzzy) {
    const candidates = await client.search(
      `${spotifyTrack.artists.map((a) => a.name).join(' ')} ${spotifyTrack.name}`,
      { songCount: opts.maxFuzzyCandidates }
    );

    const fuzzyResult = findBestMatch(spotifyTrack, candidates, opts.fuzzyThreshold);
    const matchResult: MatchingStrategyResult = {
      strategy: 'fuzzy',
      matched: fuzzyResult.bestMatch !== undefined,
      ambiguous: fuzzyResult.hasAmbiguous,
      navidromeSong: fuzzyResult.bestMatch?.song,
      candidates: fuzzyResult.matches.map((m) => m.song),
      score: fuzzyResult.bestMatch?.score ?? 0,
    };
    strategyResults.push(matchResult);

    if (fuzzyResult.bestMatch && !fuzzyResult.hasAmbiguous) {
      return {
        spotifyTrack,
        navidromeSong: fuzzyResult.bestMatch.song,
        matchStrategy: 'fuzzy',
        matchScore: fuzzyResult.bestMatch.score,
        status: 'matched',
        candidates: fuzzyResult.matches.map((m) => m.song),
      };
    }
  }

  if (opts.enableStrict) {
    const strictResult = await matchByStrict(client, spotifyTrack);
    strategyResults.push({
      strategy: 'strict',
      matched: strictResult.status === 'matched',
      ambiguous: false,
      navidromeSong: strictResult.navidromeSong,
      score: strictResult.matchScore,
    });

    if (strictResult.status === 'matched') {
      return {
        spotifyTrack,
        navidromeSong: strictResult.navidromeSong,
        matchStrategy: 'strict',
        matchScore: 1,
        status: 'matched',
      };
    }
  }

  const hasAmbiguous = strategyResults.some((r) => r.ambiguous);
  const bestResult = strategyResults.reduce(
    (best, current) => (current.score > best.score ? current : best),
    { score: -1 } as MatchingStrategyResult
  );

  return {
    spotifyTrack,
    navidromeSong: bestResult.navidromeSong,
    matchStrategy: bestResult.strategy,
    matchScore: bestResult.score > 0 ? bestResult.score : 0,
    status: hasAmbiguous ? 'ambiguous' : 'unmatched',
    candidates: bestResult.candidates,
  };
}

export async function matchTracks(
  client: NavidromeApiClient,
  spotifyTracks: SpotifyTrack[],
  options: Partial<MatchingOrchestratorOptions> = {}
): Promise<TrackMatch[]> {
  const results: TrackMatch[] = [];

  for (const track of spotifyTracks) {
    const match = await matchTrack(client, track, options);
    results.push(match);
  }

  return results;
}

export function getMatchStatistics(matches: TrackMatch[]): {
  total: number;
  matched: number;
  ambiguous: number;
  unmatched: number;
  byStrategy: Record<MatchStrategy, number>;
} {
  const stats = {
    total: matches.length,
    matched: 0,
    ambiguous: 0,
    unmatched: 0,
    byStrategy: {
      isrc: 0,
      fuzzy: 0,
      strict: 0,
      none: 0,
    } as Record<MatchStrategy, number>,
  };

  for (const match of matches) {
    if (match.status === 'matched') {
      stats.matched++;
      stats.byStrategy[match.matchStrategy]++;
    } else if (match.status === 'ambiguous') {
      stats.ambiguous++;
    } else {
      stats.unmatched++;
    }
  }

  return stats;
}

export function getAmbiguousMatches(matches: TrackMatch[]): TrackMatch[] {
  return matches.filter((m) => m.status === 'ambiguous');
}

export function getUnmatchedTracks(matches: TrackMatch[]): SpotifyTrack[] {
  return matches
    .filter((m) => m.status === 'unmatched' || m.status === 'ambiguous')
    .map((m) => m.spotifyTrack);
}

export function getMatchedTracks(matches: TrackMatch[]): Array<{
  spotifyTrack: SpotifyTrack;
  navidromeSong: NavidromeSong;
  strategy: MatchStrategy;
}> {
  return matches
    .filter((m) => m.status === 'matched' && m.navidromeSong)
    .map((m) => ({
      spotifyTrack: m.spotifyTrack,
      navidromeSong: m.navidromeSong!,
      strategy: m.matchStrategy,
    }));
}

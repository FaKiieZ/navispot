import { SpotifyTrack } from '@/types/spotify';
import { TrackMatch } from '@/types/matching';
import { NavidromeApiClient } from '@/lib/navidrome/client';

export async function matchByISRC(
  client: NavidromeApiClient,
  spotifyTrack: SpotifyTrack
): Promise<TrackMatch> {
  const isrc = spotifyTrack.external_ids?.isrc;

  if (!isrc) {
    return {
      spotifyTrack,
      matchStrategy: 'isrc',
      matchScore: 0,
      status: 'unmatched',
    };
  }

  try {
    const navidromeSong = await client.searchByISRC(isrc);

    if (navidromeSong) {
      return {
        spotifyTrack,
        navidromeSong,
        matchStrategy: 'isrc',
        matchScore: 1,
        status: 'matched',
      };
    }

    return {
      spotifyTrack,
      matchStrategy: 'isrc',
      matchScore: 0,
      status: 'unmatched',
    };
  } catch {
    return {
      spotifyTrack,
      matchStrategy: 'isrc',
      matchScore: 0,
      status: 'unmatched',
    };
  }
}

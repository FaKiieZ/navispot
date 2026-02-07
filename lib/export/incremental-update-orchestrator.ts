import { NavidromeApiClient } from '@/lib/navidrome/client';
import { SpotifyTrack } from '@/types/spotify';
import { NavidromeNativeSong } from '@/types/navidrome';
import { ProgressCallback, ExportError } from './playlist-exporter';

export interface IncrementalTrackMatch {
  spotifyTrack: SpotifyTrack;
  navidromeSong?: NavidromeNativeSong;
  status: 'add' | 'skip';
  reason: string;
}

export interface UpdateResult {
  success: boolean;
  playlistId: string;
  playlistName: string;
  statistics: {
    totalSpotifyTracks: number;
    alreadyInPlaylist: number;
    addedToPlaylist: number;
    failed: number;
  };
  tracksAdded: Array<{ spotifyId: string; navidromeId: string; title: string }>;
  tracksSkipped: string[];
  errors: ExportError[];
  duration: number;
}

export interface UpdateOptions {
  useCache?: boolean;
  onProgress?: ProgressCallback;
  signal?: AbortSignal;
}

export interface CachedTrackMatch {
  spotifyTrackId: string;
  navidromeSongId?: string;
  status: 'matched' | 'ambiguous' | 'unmatched';
  matchStrategy: string;
  matchScore: number;
}

/**
 * IncrementalUpdateOrchestrator handles updating existing Navidrome playlists
 * by comparing with current Spotify playlist contents and adding only new tracks
 */
export class IncrementalUpdateOrchestrator {
  private navidromeClient: NavidromeApiClient;

  constructor(navidromeClient: NavidromeApiClient) {
    this.navidromeClient = navidromeClient;
  }

  /**
   * Identifies which Spotify tracks need to be added to the Navidrome playlist
   * @param spotifyTracks Current tracks in the Spotify playlist
   * @param navidromePlaylistId ID of the Navidrome playlist to update
   * @param cachedMatches Optional cached track matches from previous export
   * @returns List of tracks to add and their status
   */
  async identifyTracksToAdd(
    spotifyTracks: SpotifyTrack[],
    navidromePlaylistId: string,
    cachedMatches?: Record<string, CachedTrackMatch>,
    signal?: AbortSignal
  ): Promise<IncrementalTrackMatch[]> {
    const startTime = Date.now();

    // Fetch current Navidrome playlist tracks
    const playlistData = await this.navidromeClient.getPlaylistWithFullTracks(
      navidromePlaylistId,
      signal
    );

    const navidromeSongIdSet = playlistData.trackIdSet;
    const result: IncrementalTrackMatch[] = [];

    // Check each Spotify track against the Navidrome playlist
    for (const spotifyTrack of spotifyTracks) {
      if (signal?.aborted) {
        throw new DOMException('Operation was cancelled', 'AbortError');
      }

      const cached = cachedMatches?.[spotifyTrack.id];

      if (cached?.navidromeSongId) {
        // We have a cached Navidrome song ID
        if (navidromeSongIdSet.has(cached.navidromeSongId)) {
          // Track is already in playlist
          result.push({
            spotifyTrack,
            navidromeSong: undefined,
            status: 'skip',
            reason: 'Already in playlist',
          });
        } else {
          // Track was matched before but isn't in the playlist (may have been removed)
          result.push({
            spotifyTrack,
            status: 'add',
            reason: 'Previously matched but missing from playlist',
          });
        }
      } else {
        // No cached match - this track wasn't previously matched
        result.push({
          spotifyTrack,
          status: 'skip',
          reason: 'No previous match record',
        });
      }
    }

    return result;
  }

  /**
   * Main update operation: compares Spotify and Navidrome playlists and adds new tracks
   */
  async updatePlaylist(
    navidromePlaylistId: string,
    spotifyTracks: SpotifyTrack[],
    playlistName: string,
    cachedMatches?: Record<string, CachedTrackMatch>,
    options: UpdateOptions = {}
  ): Promise<UpdateResult> {
    const startTime = Date.now();
    const { signal, onProgress } = options;
    const errors: ExportError[] = [];

    const checkAbort = () => {
      if (signal?.aborted) {
        throw new DOMException('Update was cancelled', 'AbortError');
      }
    };

    try {
      // Identify tracks to add
      checkAbort();
      if (onProgress) {
        await onProgress({
          current: 0,
          total: spotifyTracks.length,
          percent: 0,
          status: 'preparing',
        });
      }

      const tracksToProcess = await this.identifyTracksToAdd(
        spotifyTracks,
        navidromePlaylistId,
        cachedMatches,
        signal
      );

      const tracksToAdd = tracksToProcess.filter(
        (t) => t.status === 'add' && cachedMatches?.[t.spotifyTrack.id]?.navidromeSongId
      );

      const tracksSkipped = tracksToProcess
        .filter((t) => t.status === 'skip')
        .map((t) => t.spotifyTrack.id);

      if (tracksToAdd.length === 0) {
        if (onProgress) {
          await onProgress({
            current: spotifyTracks.length,
            total: spotifyTracks.length,
            percent: 100,
            status: 'completed',
          });
        }

        return {
          success: true,
          playlistId: navidromePlaylistId,
          playlistName,
          statistics: {
            totalSpotifyTracks: spotifyTracks.length,
            alreadyInPlaylist: tracksToProcess.filter((t) => t.status === 'skip').length,
            addedToPlaylist: 0,
            failed: 0,
          },
          tracksAdded: [],
          tracksSkipped,
          errors: [],
          duration: Date.now() - startTime,
        };
      }

      // Add new tracks in batches
      checkAbort();
      if (onProgress) {
        await onProgress({
          current: 0,
          total: tracksToAdd.length,
          percent: 0,
          currentTrack: tracksToAdd[0]?.spotifyTrack.name,
          status: 'exporting',
        });
      }

      const tracksAdded: Array<{ spotifyId: string; navidromeId: string; title: string }> = [];
      const batchSize = 50;

      for (let i = 0; i < tracksToAdd.length; i += batchSize) {
        checkAbort();

        const batch = tracksToAdd.slice(i, i + batchSize);
        const songIds = batch
          .map((t) => cachedMatches?.[t.spotifyTrack.id]?.navidromeSongId)
          .filter((id) => id !== undefined) as string[];

        if (songIds.length > 0) {
          const result = await this.navidromeClient.updatePlaylist(
            navidromePlaylistId,
            songIds,
            undefined,
            signal
          );

          if (result.success) {
            batch.forEach((track, index) => {
              const navidromeSongId = songIds[index];
              if (navidromeSongId) {
                tracksAdded.push({
                  spotifyId: track.spotifyTrack.id,
                  navidromeId: navidromeSongId,
                  title: track.spotifyTrack.name,
                });
              }
            });
          }
        }

        if (onProgress) {
          const currentProgress = Math.min(i + batchSize, tracksToAdd.length);
          const percent = Math.round((currentProgress / tracksToAdd.length) * 100);
          await onProgress({
            current: currentProgress,
            total: tracksToAdd.length,
            percent,
            currentTrack: tracksToAdd[currentProgress]?.spotifyTrack.name,
            status: 'exporting',
          });
        }
      }

      return {
        success: true,
        playlistId: navidromePlaylistId,
        playlistName,
        statistics: {
          totalSpotifyTracks: spotifyTracks.length,
          alreadyInPlaylist: spotifyTracks.length - tracksToAdd.length,
          addedToPlaylist: tracksAdded.length,
          failed: tracksToAdd.length - tracksAdded.length,
        },
        tracksAdded,
        tracksSkipped,
        errors,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error;
      }

      errors.push({
        trackName: 'N/A',
        artistName: 'N/A',
        reason: `Failed to update playlist: ${errorMessage}`,
      });

      return {
        success: false,
        playlistId: navidromePlaylistId,
        playlistName,
        statistics: {
          totalSpotifyTracks: spotifyTracks.length,
          alreadyInPlaylist: 0,
          addedToPlaylist: 0,
          failed: spotifyTracks.length,
        },
        tracksAdded: [],
        tracksSkipped: [],
        errors,
        duration: Date.now() - startTime,
      };
    }
  }
}

export function createIncrementalUpdateOrchestrator(
  navidromeClient: NavidromeApiClient
): IncrementalUpdateOrchestrator {
  return new IncrementalUpdateOrchestrator(navidromeClient);
}

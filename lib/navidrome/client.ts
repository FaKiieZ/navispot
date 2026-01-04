import {
  NavidromePlaylist,
  NavidromeSong,
  SubsonicResponse,
} from '../../types/navidrome';

export function generateAuthHeader(username: string, password: string): string {
  const credentials = `${username}:${password}`;
  const encoded = Buffer.from(credentials).toString('base64');
  return `Basic ${encoded}`;
}

export class NavidromeApiClient {
  private baseUrl: string;
  private authHeader: string;

  constructor(url: string, username: string, password: string) {
    this.baseUrl = url.replace(/\/$/, '');
    this.authHeader = generateAuthHeader(username, password);
  }

  async ping(): Promise<{
    success: boolean;
    serverVersion?: string;
    error?: string;
  }> {
    try {
      const url = this._buildUrl('/rest/ping', {});
      const response = await this._makeRequest<{ status: string; version: string; serverVersion?: string }>(url);
      
      if (response.status === 'ok') {
        return { success: true, serverVersion: response.serverVersion };
      }
      
      return { success: false, error: 'Ping failed' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getPlaylists(): Promise<NavidromePlaylist[]> {
    const url = this._buildUrl('/rest/getPlaylists', {});
    const response = await this._makeRequest<{
      playlists: { playlist: NavidromePlaylist[] };
    }>(url);

    if (!response.playlists?.playlist) {
      return [];
    }

    return response.playlists.playlist.map(this._mapPlaylist);
  }

  async getPlaylist(playlistId: string): Promise<{
    playlist: NavidromePlaylist;
    tracks: NavidromeSong[];
  }> {
    const url = this._buildUrl('/rest/getPlaylist', { id: playlistId });
    const response = await this._makeRequest<{
      playlist: NavidromePlaylist;
      playlistEntry: NavidromeSong[];
    }>(url);

    return {
      playlist: this._mapPlaylist(response.playlist),
      tracks: response.playlistEntry || [],
    };
  }

  async createPlaylist(name: string, songIds: string[]): Promise<{
    id: string;
    success: boolean;
  }> {
    const params: Record<string, string | string[]> = { name };
    if (songIds.length > 0) {
      params.songId = songIds;
    }

    const url = this._buildUrl('/rest/createPlaylist', params);
    const response = await this._makeRequest<{
      status: string;
      playlistId?: string;
    }>(url);

    return {
      id: response.playlistId || '',
      success: response.status === 'ok',
    };
  }

  async updatePlaylist(
    playlistId: string,
    songIdsToAdd: string[],
    songIdsToRemove?: number[]
  ): Promise<{ success: boolean }> {
    const params: Record<string, string | string[]> = { id: playlistId };
    
    if (songIdsToAdd.length > 0) {
      params.songIdToAdd = songIdsToAdd;
    }
    
    if (songIdsToRemove && songIdsToRemove.length > 0) {
      params.songIdToRemove = songIdsToRemove.map(String);
    }

    const url = this._buildUrl('/rest/updatePlaylist', params);
    const response = await this._makeRequest<{ status: string }>(url);

    return { success: response.status === 'ok' };
  }

  private _buildUrl(
    endpoint: string,
    params: Record<string, string | string[] | undefined>
  ): string {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined) return;
      
      if (Array.isArray(value)) {
        value.forEach((v) => searchParams.append(key, v));
      } else {
        searchParams.set(key, value);
      }
    });

    const queryString = searchParams.toString();
    return queryString
      ? `${this.baseUrl}${endpoint}?${queryString}`
      : `${this.baseUrl}${endpoint}`;
  }

  private async _makeRequest<T>(url: string): Promise<T> {
    const response = await fetch(url, {
      headers: {
        Authorization: this.authHeader,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  private _handleResponse<T>(response: SubsonicResponse<T>): T {
    if (response.status === 'failed' && response.error) {
      const errorMessages: Record<number, string> = {
        0: 'A generic error occurred',
        10: 'Required parameter is missing',
        20: 'Incompatible Subsonic protocol version',
        30: 'Incompatible authentication mechanism',
        40: 'Invalid username or password',
        50: 'User is not authorized for the requested operation',
        60: 'The requested data was not found',
      };

      const message =
        errorMessages[response.error.code] ||
        `Subsonic error ${response.error.code}: ${response.error.message}`;

      throw new Error(message);
    }

    return response as unknown as T;
  }

  private _mapPlaylist(item: NavidromePlaylist): NavidromePlaylist {
    return {
      id: item.id,
      name: item.name,
      comment: item.comment,
      songCount: item.songCount,
      duration: item.duration,
      createdAt: item.createdAt || '',
      updatedAt: item.updatedAt || '',
    };
  }
}

export default NavidromeApiClient;

import { SpotifyToken, SpotifyUser } from './spotify-auth';
import { NavidromeCredentials } from './navidrome';

export interface SpotifyAuthState {
  isAuthenticated: boolean;
  user: SpotifyUser | null;
  token: SpotifyToken | null;
}

export interface NavidromeAuthState {
  isConnected: boolean;
  credentials: NavidromeCredentials | null;
  serverVersion: string | null;
  error: string | null;
}

export interface AuthContextType {
  spotify: SpotifyAuthState;
  navidrome: NavidromeAuthState;
  spotifyLogin: () => Promise<void>;
  spotifyLogout: () => Promise<void>;
  refreshSpotifyToken: () => Promise<boolean>;
  setNavidromeCredentials: (credentials: NavidromeCredentials) => Promise<boolean>;
  testNavidromeConnection: () => Promise<boolean>;
  clearNavidromeCredentials: () => void;
  isLoading: boolean;
}

export const SPOTIFY_STORAGE_KEY = 'navispot_spotify_auth';
export const NAVIDROME_STORAGE_KEY = 'navispot_navidrome_auth';

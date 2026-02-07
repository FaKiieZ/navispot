import type { ExportMode } from '@/lib/export/playlist-exporter';

export type { ExportMode };

export interface ExportOptions {
  mode: ExportMode;
  existingPlaylistId?: string;
  skipUnmatched: boolean;
}

export interface UpdateOptions {
  mode: 'update';
  existingPlaylistId: string;
  skipUnmatched?: boolean;
}

export interface MatchStatistics {
  total: number;
  matched: number;
  ambiguous: number;
  unmatched: number;
  matchedPercentage: number;
}

export interface UpdatePreviewStatistics {
  totalSpotifyTracks: number;
  alreadyInPlaylist: number;
  estimatedToAdd: number;
  needsReMatch: number;
}

export interface ExportPreviewProps {
  playlistName: string;
  statistics: MatchStatistics;
  existingPlaylists?: Array<{ id: string; name: string }>;
  onConfirm: (options: ExportOptions | UpdateOptions) => void;
  onCancel: () => void;
}

export interface UseExportPreviewReturn {
  statistics: MatchStatistics;
  selectedMode: ExportMode;
  selectedPlaylistId: string | undefined;
  skipUnmatched: boolean;
  setMode: (mode: ExportMode) => void;
  setSelectedPlaylistId: (id: string | undefined) => void;
  setSkipUnmatched: (skip: boolean) => void;
  estimatedExported: number;
  estimatedSkipped: number;
  canExport: boolean;
}

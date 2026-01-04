import { TrackMatch } from '@/types/matching';
import { ExportOptions } from '@/types/export';

export interface ExportResult {
  playlistName: string;
  timestamp: Date;
  statistics: {
    total: number;
    matched: number;
    unmatched: number;
    ambiguous: number;
    exported: number;
    failed: number;
  };
  matches: TrackMatch[];
  options: ExportOptions;
}

export interface ResultsReportProps {
  result: ExportResult;
  onExportAgain: () => void;
  onBackToDashboard: () => void;
  onViewDetails?: (trackId: string) => void;
}

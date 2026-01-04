'use client';

import { useState, useMemo, useCallback } from 'react';
import { UseExportPreviewReturn, MatchStatistics, ExportMode } from '@/types/export';

interface UseExportPreviewProps {
  statistics: MatchStatistics;
}

export function useExportPreview({ statistics }: UseExportPreviewProps): UseExportPreviewReturn {
  const [selectedMode, setSelectedMode] = useState<ExportMode>('create');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | undefined>(undefined);
  const [skipUnmatched, setSkipUnmatched] = useState(false);

  const estimatedExported = useMemo(() => {
    if (skipUnmatched) {
      return statistics.matched;
    }
    return statistics.matched + statistics.ambiguous;
  }, [statistics.matched, statistics.ambiguous, skipUnmatched]);

  const estimatedSkipped = useMemo(() => {
    if (skipUnmatched) {
      return statistics.unmatched + statistics.ambiguous;
    }
    return 0;
  }, [statistics.unmatched, statistics.ambiguous, skipUnmatched]);

  const canExport = useMemo(() => {
    if (selectedMode === 'create') {
      return estimatedExported > 0;
    }
    return estimatedExported > 0 && selectedPlaylistId !== undefined;
  }, [selectedMode, selectedPlaylistId, estimatedExported]);

  const setMode = useCallback((mode: ExportMode) => {
    setSelectedMode(mode);
    if (mode !== 'append' && mode !== 'overwrite') {
      setSelectedPlaylistId(undefined);
    }
  }, []);

  const setSelectedPlaylistIdWithValidation = useCallback((id: string | undefined) => {
    setSelectedPlaylistId(id);
  }, []);

  const setSkipUnmatchedValue = useCallback((skip: boolean) => {
    setSkipUnmatched(skip);
  }, []);

  return {
    statistics,
    selectedMode,
    selectedPlaylistId,
    skipUnmatched,
    setMode,
    setSelectedPlaylistId: setSelectedPlaylistIdWithValidation,
    setSkipUnmatched: setSkipUnmatchedValue,
    estimatedExported,
    estimatedSkipped,
    canExport,
  };
}

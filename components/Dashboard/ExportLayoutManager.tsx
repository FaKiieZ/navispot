import React, { ReactNode } from "react"

export interface ExportLayoutManagerProps {
  selectedPlaylistsSection: ReactNode
  unmatchedSongsSection: ReactNode
  mainTableSection: ReactNode
  fixedExportButton: ReactNode
}

export function ExportLayoutManager({
  selectedPlaylistsSection,
  unmatchedSongsSection,
  mainTableSection,
  fixedExportButton,
}: ExportLayoutManagerProps) {
  return (
    <div className="relative">
      {fixedExportButton}

      <div className="flex flex-col h-[calc(100vh-90px)] pb-8">
        {/* Top Section - 40% height - Consistent across all stages */}
        <div className="h-[40%] flex gap-4 overflow-hidden">
          {/* Left Column - Selected Playlists (50% width) */}
          <div className="w-1/2 flex flex-col overflow-hidden">
            {selectedPlaylistsSection}
          </div>

          {/* Right Column - Unmatched Songs (50% width) */}
          <div className="w-1/2 flex flex-col overflow-hidden">
            {unmatchedSongsSection}
          </div>
        </div>

        {/* Bottom Section - 60% height - Main Playlist Table */}
        <div className="h-[60%] overflow-hidden pt-4">{mainTableSection}</div>
      </div>
    </div>
  )
}

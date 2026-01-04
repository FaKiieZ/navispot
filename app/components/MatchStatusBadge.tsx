'use client';

import { MatchStatus, MatchStrategy } from '@/types/matching';

interface MatchStatusBadgeProps {
  status: MatchStatus;
  strategy?: MatchStrategy;
  candidates?: number;
  navidromeTitle?: string;
  navidromeArtist?: string;
}

export function MatchStatusBadge({
  status,
  strategy,
  candidates,
  navidromeTitle,
  navidromeArtist,
}: MatchStatusBadgeProps) {
  const statusConfig = {
    matched: {
      color: 'bg-green-500/10 text-green-500 border-green-500/20',
      icon: '✓',
      label: 'Matched',
    },
    ambiguous: {
      color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      icon: '?',
      label: 'Ambiguous',
    },
    unmatched: {
      color: 'bg-red-500/10 text-red-500 border-red-500/20',
      icon: '✗',
      label: 'Unmatched',
    },
  };

  const config = statusConfig[status];
  const strategyLabels = {
    isrc: 'ISRC',
    fuzzy: 'Fuzzy',
    strict: 'Strict',
    none: 'None',
  };

  const tooltipContent = () => {
    let content = config.label;
    if (status === 'matched' && strategy) {
      content += ` (via ${strategyLabels[strategy]})`;
    }
    if (status === 'matched' && navidromeTitle) {
      content += ` - Found: ${navidromeTitle} - ${navidromeArtist}`;
    }
    if (status === 'ambiguous' && candidates) {
      content += ` - ${candidates} candidates found`;
    }
    if (status === 'unmatched') {
      content += ' - No match in Navidrome';
    }
    return content;
  };

  return (
    <div className="relative group inline-block">
      <div
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${config.color} cursor-help`}
      >
        <span>{config.icon}</span>
        <span className="hidden sm:inline">
          {status === 'matched' && strategy
            ? strategyLabels[strategy]
            : status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-800 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-10">
        {tooltipContent()}
      </div>
    </div>
  );
}

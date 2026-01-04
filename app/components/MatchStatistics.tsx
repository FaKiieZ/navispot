'use client';

interface MatchStatisticsProps {
  statistics: {
    total: number;
    matched: number;
    ambiguous: number;
    unmatched: number;
  };
}

function getPercentage(value: number, total: number): string {
  if (total === 0) return '0%';
  return `${Math.round((value / total) * 100)}%`;
}

export function MatchStatistics({ statistics }: MatchStatisticsProps) {
  const { total, matched, ambiguous, unmatched } = statistics;
  const matchedPercentage = getPercentage(matched, total);
  const ambiguousPercentage = getPercentage(ambiguous, total);
  const unmatchedPercentage = getPercentage(unmatched, total);

  const stats = [
    {
      label: 'Matched',
      count: matched,
      percentage: matchedPercentage,
      color: 'text-green-500',
      bgColor: 'bg-green-500',
      borderColor: 'border-green-500/20',
      cardBg: 'bg-green-500/5',
    },
    {
      label: 'Ambiguous',
      count: ambiguous,
      percentage: ambiguousPercentage,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500',
      borderColor: 'border-yellow-500/20',
      cardBg: 'bg-yellow-500/5',
    },
    {
      label: 'Unmatched',
      count: unmatched,
      percentage: unmatchedPercentage,
      color: 'text-red-500',
      bgColor: 'bg-red-500',
      borderColor: 'border-red-500/20',
      cardBg: 'bg-red-500/5',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="col-span-2 md:col-span-4">
        <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-3">
          Match Summary
        </h3>
      </div>
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`p-4 rounded-lg border ${stat.cardBg} ${stat.borderColor}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
              {stat.label}
            </span>
            <span className={`text-lg font-semibold ${stat.color}`}>
              {stat.count}
            </span>
          </div>
          <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${stat.bgColor} transition-all duration-300`}
              style={{ width: stat.percentage }}
            />
          </div>
          <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {stat.percentage} of {total} tracks
          </div>
        </div>
      ))}
    </div>
  );
}

export function WinningsStats({
  successRate,
  totalPicks,
  winStreak,
}: {
  successRate: number;
  totalPicks: number;
  winStreak: number;
}) {
  const stats = [
    { label: "Success Rate", value: `${successRate}%` },
    { label: "Total Picks", value: totalPicks },
    { label: "Win Streak", value: winStreak },
  ];

  return (
    <div className="grid grid-cols-3 divide-x divide-border border-t border-border pt-4">
      {stats.map((stat) => (
        <div key={stat.label} className="text-center">
          <p className="text-xl font-bold text-brand">{stat.value}</p>
          <p className="text-xs text-muted-foreground">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}

"use client";

import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { StandingRow } from "@/lib/football-api";

export function LeagueStandingsTabs({
  leagues,
}: {
  leagues: { id: number; name: string; slug: string; standings: StandingRow[] | null }[];
}) {
  const withData = leagues.filter((l) => l.standings && l.standings.length > 0);

  if (withData.length === 0) return null;

  return (
    <Tabs defaultValue={String(withData[0].id)}>
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <TabsList className="w-fit min-w-full sm:min-w-0">
          {withData.map((league) => (
            <TabsTrigger key={league.id} value={String(league.id)} className="shrink-0">
              {league.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {withData.map((league) => (
        <TabsContent key={league.id} value={String(league.id)}>
          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="py-2 pl-4">#</th>
                  <th className="py-2">Team</th>
                  <th className="py-2 text-center">P</th>
                  <th className="py-2 text-center">W</th>
                  <th className="py-2 text-center">D</th>
                  <th className="py-2 text-center">L</th>
                  <th className="py-2 text-center">GD</th>
                  <th className="py-2 pr-4 text-center">Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {league.standings!.slice(0, 8).map((row) => (
                  <tr key={row.team.id}>
                    <td className="py-2 pl-4 font-medium">{row.rank}</td>
                    <td className="py-2 font-medium">{row.team.name}</td>
                    <td className="py-2 text-center text-muted-foreground">{row.all.played}</td>
                    <td className="py-2 text-center text-muted-foreground">{row.all.win}</td>
                    <td className="py-2 text-center text-muted-foreground">{row.all.draw}</td>
                    <td className="py-2 text-center text-muted-foreground">{row.all.lose}</td>
                    <td className="py-2 text-center text-muted-foreground">{row.goalsDiff}</td>
                    <td className="py-2 pr-4 text-center font-bold">{row.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Link href={`/competitions/${league.slug}`} className="mt-2 inline-block text-sm font-medium text-brand hover:underline">
            {league.name} predictions and full table →
          </Link>
        </TabsContent>
      ))}
    </Tabs>
  );
}

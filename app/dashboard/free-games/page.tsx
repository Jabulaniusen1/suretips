import type { Metadata } from "next";
import { Trophy } from "lucide-react";
import { getCurrentUser } from "@/lib/data/current-user";
import { getTodaysFeaturedMatch, getUserEntryForToday, getLeaderboard } from "@/lib/data/free-games";
import { FreeGameCard } from "@/components/dashboard/free-game-card";

export const metadata: Metadata = { title: "Free Games" };

export default async function FreeGamesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [match, entry, leaderboard] = await Promise.all([
    getTodaysFeaturedMatch(),
    getUserEntryForToday(user.authId),
    getLeaderboard(),
  ]);

  const existingChoice = (entry?.prediction as { choice?: "home" | "draw" | "away" } | undefined)?.choice;

  return (
    <div>
      <h1 className="text-xl font-bold">Free Games</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Predict today&apos;s featured match correctly to earn points and climb the leaderboard.
      </p>

      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        {match ? (
          <FreeGameCard match={match} existingChoice={existingChoice} />
        ) : (
          <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            No featured match today — check back soon.
          </div>
        )}

        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <Trophy className="size-5 text-brand" />
            <h3 className="font-bold">Leaderboard</h3>
          </div>
          <ol className="mt-4 space-y-2">
            {leaderboard.map((entry, i) => (
              <li key={entry.user_id} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="text-muted-foreground">#{i + 1}</span>
                  {entry.full_name ?? "Anonymous"}
                </span>
                <span className="font-bold">{entry.total_points} pts</span>
              </li>
            ))}
            {leaderboard.length === 0 && <p className="text-sm text-muted-foreground">No entries yet — be the first!</p>}
          </ol>
        </div>
      </div>
    </div>
  );
}

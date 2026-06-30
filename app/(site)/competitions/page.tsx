import Link from "next/link";
import type { Metadata } from "next";
import { Trophy } from "lucide-react";
import { getActiveCompetitions } from "@/lib/data/competitions";

export const metadata: Metadata = { title: "Competitions" };

export default async function CompetitionsPage() {
  const competitions = await getActiveCompetitions();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Competitions</h1>
      <p className="mt-2 text-muted-foreground">Fixtures, standings and predictions for the world&apos;s top leagues.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {competitions.map((comp) => (
          <Link
            key={comp.id}
            href={`/competitions/${comp.slug}`}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5 hover:border-brand"
          >
            <span className="flex size-10 items-center justify-center rounded-full bg-accent text-brand">
              <Trophy className="size-5" />
            </span>
            <span className="font-bold">{comp.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

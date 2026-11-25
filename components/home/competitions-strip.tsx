import Link from "next/link";
import Image from "next/image";
import { Trophy } from "lucide-react";
import type { Tables } from "@/types/database";

export function CompetitionsStrip({ competitions }: { competitions: Tables<"competitions">[] }) {
  if (competitions.length === 0) return null;
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {competitions.map((comp) => (
        <li key={comp.id}>
          <Link
            href={`/competitions/${comp.slug}`}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 text-sm font-semibold transition-colors hover:border-brand/50 hover:text-brand"
          >
            {comp.league_id ? (
              <Image
                src={`https://media.api-sports.io/football/leagues/${comp.league_id}.png`}
                alt=""
                width={28}
                height={28}
                className="size-7 shrink-0 object-contain"
              />
            ) : (
              <Trophy aria-hidden className="size-6 shrink-0 text-muted-foreground" />
            )}
            <span className="min-w-0">
              <span className="block truncate">{comp.name}</span>
              {comp.country && <span className="block truncate text-xs font-normal text-muted-foreground">{comp.country}</span>}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

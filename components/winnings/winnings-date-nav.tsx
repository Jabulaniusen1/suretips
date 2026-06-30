import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatShortDate } from "@/lib/utils/date";
import { Button } from "@/components/ui/button";

export function WinningsDateNav({
  basePath,
  date,
  previousDate,
  nextDate,
  paramName = "resultsDate",
}: {
  basePath: string;
  date: string;
  previousDate: string | null;
  nextDate: string | null;
  paramName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      {previousDate ? (
        <Button
          variant="outline"
          size="icon"
          render={<Link href={`${basePath}?${paramName}=${previousDate}`} aria-label="Previous results" />}
        >
          <ChevronLeft className="size-4" />
        </Button>
      ) : (
        <Button variant="outline" size="icon" disabled aria-label="Previous results">
          <ChevronLeft className="size-4" />
        </Button>
      )}
      <p className="text-sm font-semibold">{formatShortDate(date)}</p>
      {nextDate ? (
        <Button
          variant="outline"
          size="icon"
          render={<Link href={`${basePath}?${paramName}=${nextDate}`} aria-label="Next results" />}
        >
          <ChevronRight className="size-4" />
        </Button>
      ) : (
        <Button variant="outline" size="icon" disabled aria-label="Next results">
          <ChevronRight className="size-4" />
        </Button>
      )}
    </div>
  );
}

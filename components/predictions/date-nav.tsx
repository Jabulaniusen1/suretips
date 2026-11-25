"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DateNavPeriod } from "@/lib/utils/date";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/**
 * Previous / Today / Tomorrow links plus a date picker. "Today" links to the
 * bare base path so the canonical URL is the one users and crawlers share;
 * other periods use query parameters, which every page canonicalises away.
 */
export function DateNav({
  active,
  basePath,
  dateKey,
  dateLabel,
}: {
  active: DateNavPeriod;
  basePath: string;
  /** Currently shown Lagos day, yyyy-MM-dd. */
  dateKey: string;
  dateLabel: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  // Noon local time keeps the picker on the same calendar day in every time zone.
  const selected = new Date(`${dateKey}T12:00:00`);

  const periods: { value: DateNavPeriod; label: string; href: string }[] = [
    { value: "previous", label: "Yesterday", href: `${basePath}?period=previous` },
    { value: "today", label: "Today", href: basePath },
    { value: "tomorrow", label: "Tomorrow", href: `${basePath}?period=tomorrow` },
  ];

  function handleSelect(date: Date | undefined) {
    if (!date) return;
    setOpen(false);
    router.push(`${basePath}?date=${format(date, "yyyy-MM-dd")}`);
  }

  return (
    <nav aria-label="Choose a date" className="flex flex-wrap items-center gap-2">
      <div className="inline-flex rounded-lg border border-border bg-card p-1">
        {periods.map((period) => (
          <Link
            key={period.value}
            href={period.href}
            aria-current={active === period.value ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active === period.value ? "bg-brand text-brand-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {period.label}
          </Link>
        ))}
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button variant="outline" size="sm" className={cn("gap-1.5", active === "custom" && "border-brand text-brand")}>
              <CalendarIcon aria-hidden className="size-4" />
              {active === "custom" ? dateLabel : "Pick a date"}
            </Button>
          }
        />
        <PopoverContent className="w-auto p-0">
          <Calendar mode="single" selected={selected} onSelect={handleSelect} defaultMonth={selected} />
        </PopoverContent>
      </Popover>
    </nav>
  );
}

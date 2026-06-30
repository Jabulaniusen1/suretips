"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatShortDate } from "@/lib/utils/date";
import type { DateNavPeriod } from "@/lib/utils/date";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function DateNav({
  active,
  basePath,
  extraParams,
  currentDate,
  dateParamName = "date",
}: {
  active: DateNavPeriod;
  basePath: string;
  extraParams?: Record<string, string>;
  currentDate?: Date;
  dateParamName?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const periods: { value: DateNavPeriod; label: string }[] = [
    { value: "previous", label: "Previous" },
    { value: "today", label: "Today" },
    { value: "tomorrow", label: "Tomorrow" },
  ];

  function hrefFor(period: DateNavPeriod) {
    const query = new URLSearchParams(extraParams);
    query.set("period", period);
    query.delete(dateParamName);
    return `${basePath}?${query.toString()}`;
  }

  function handleSelect(date: Date | undefined) {
    if (!date) return;
    setOpen(false);
    const query = new URLSearchParams(extraParams);
    query.set("period", "custom");
    query.set(dateParamName, format(date, "yyyy-MM-dd"));
    router.push(`${basePath}?${query.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex rounded-lg border border-border bg-card p-1">
        {periods.map((period) => (
          <Link
            key={period.value}
            href={hrefFor(period.value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active === period.value
                ? "bg-brand text-brand-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {period.label}
          </Link>
        ))}
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className={cn("gap-1.5", active === "custom" && "border-brand text-brand")}
            >
              <CalendarIcon className="size-4" />
              {active === "custom" && currentDate ? formatShortDate(currentDate) : "Pick a date"}
            </Button>
          }
        />
        <PopoverContent className="w-auto p-0">
          <Calendar mode="single" selected={currentDate} onSelect={handleSelect} defaultMonth={currentDate} />
        </PopoverContent>
      </Popover>
    </div>
  );
}

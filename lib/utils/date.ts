import { addDays, endOfDay, format, startOfDay, subDays } from "date-fns";

export type DateNavPeriod = "previous" | "today" | "tomorrow" | "custom";

export function getDateRange(period: DateNavPeriod, customDate?: Date) {
  const base = customDate ?? new Date();
  const target = period === "previous" ? subDays(base, 1) : period === "tomorrow" ? addDays(base, 1) : base;

  return {
    date: target,
    from: startOfDay(target).toISOString(),
    to: endOfDay(target).toISOString(),
    label: format(target, "EEEE, MMM d, yyyy"),
  };
}

export function shiftDate(date: Date, days: number): Date {
  return days >= 0 ? addDays(date, days) : subDays(date, Math.abs(days));
}

export function formatShortDate(date: Date | string): string {
  return format(new Date(date), "d MMM yyyy");
}

export function isToday(date: Date): boolean {
  return startOfDay(date).getTime() === startOfDay(new Date()).getTime();
}

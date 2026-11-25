// All public dates use the site's home time zone. Africa/Lagos (WAT) is
// UTC+1 all year with no daylight saving, so day boundaries can be computed
// with a fixed offset; display formatting goes through Intl so it is correct
// regardless of the server's own time zone (UTC on Vercel).

export const SITE_TIME_ZONE = "Africa/Lagos";
export const SITE_TIME_ZONE_LABEL = "WAT";
const LAGOS_OFFSET_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export type DateNavPeriod = "previous" | "today" | "tomorrow" | "custom";

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** yyyy-MM-dd for the Lagos calendar day containing `date`. */
export function lagosDateKey(date: Date = new Date()): string {
  return new Date(date.getTime() + LAGOS_OFFSET_MS).toISOString().slice(0, 10);
}

/** Validates a yyyy-MM-dd string; returns null for anything else. */
export function parseDateKey(value: string | undefined | null): string | null {
  if (!value || !DATE_KEY_RE.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) return null;
  return value;
}

export function addDaysToKey(dateKey: string, days: number): string {
  return new Date(new Date(`${dateKey}T00:00:00Z`).getTime() + days * DAY_MS).toISOString().slice(0, 10);
}

/** UTC instants bounding a Lagos calendar day: [from, to]. */
export function lagosDayRange(dateKey: string): { from: string; to: string } {
  const startUtc = new Date(`${dateKey}T00:00:00Z`).getTime() - LAGOS_OFFSET_MS;
  return {
    from: new Date(startUtc).toISOString(),
    to: new Date(startUtc + DAY_MS - 1).toISOString(),
  };
}

export function isDateNavPeriod(value: unknown): value is DateNavPeriod {
  return value === "previous" || value === "today" || value === "tomorrow" || value === "custom";
}

export interface DateRange {
  period: DateNavPeriod;
  dateKey: string;
  from: string;
  to: string;
  label: string;
}

/**
 * Resolves the date navigation state from search params. Invalid input
 * falls back to today rather than erroring, so arbitrary query strings
 * can't produce broken pages.
 */
/**
 * True when ?period= / ?date= select a day other than today. Those views are
 * useful to visitors but duplicate the canonical (today) page for search, so
 * they are noindexed, like filtered result views.
 */
export function isOtherDayView(periodParam?: string, dateParam?: string): boolean {
  return getDateRange(periodParam, dateParam).dateKey !== lagosDateKey();
}

export function getDateRange(periodParam?: string, dateParam?: string): DateRange {
  const today = lagosDateKey();
  const custom = parseDateKey(dateParam);

  let period: DateNavPeriod = isDateNavPeriod(periodParam) ? periodParam : "today";
  let dateKey = today;

  if (custom) {
    period = custom === today ? "today" : "custom";
    dateKey = custom;
  } else if (period === "previous") {
    dateKey = addDaysToKey(today, -1);
  } else if (period === "tomorrow") {
    dateKey = addDaysToKey(today, 1);
  } else {
    period = "today";
  }

  return { period, dateKey, ...lagosDayRange(dateKey), label: formatDateKeyLong(dateKey) };
}

const longDateFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC",
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** "Thursday, 19 November 2026" for a yyyy-MM-dd key. */
export function formatDateKeyLong(dateKey: string): string {
  return longDateFmt.format(new Date(`${dateKey}T12:00:00Z`));
}

const shortDateKeyFmt = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" });

export function formatDateKeyShort(dateKey: string): string {
  return shortDateKeyFmt.format(new Date(`${dateKey}T12:00:00Z`));
}

const timeFmt = new Intl.DateTimeFormat("en-GB", { timeZone: SITE_TIME_ZONE, hour: "2-digit", minute: "2-digit", hour12: false });
const shortDateFmt = new Intl.DateTimeFormat("en-GB", { timeZone: SITE_TIME_ZONE, day: "numeric", month: "short", year: "numeric" });
const dayMonthFmt = new Intl.DateTimeFormat("en-GB", { timeZone: SITE_TIME_ZONE, day: "numeric", month: "short" });
const fullFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: SITE_TIME_ZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** "18:30" in Lagos time. */
export function formatKickoffTime(value: string | Date): string {
  return timeFmt.format(new Date(value));
}

/** "19 Nov 2026" in Lagos time. */
export function formatShortDate(value: string | Date): string {
  return shortDateFmt.format(new Date(value));
}

/** "19 Nov" in Lagos time. */
export function formatDayMonth(value: string | Date): string {
  return dayMonthFmt.format(new Date(value));
}

/** "Thursday 19 November 2026, 18:30 WAT". */
export function formatKickoffFull(value: string | Date): string {
  return `${fullFmt.format(new Date(value)).replace(" at ", ", ")} ${SITE_TIME_ZONE_LABEL}`;
}

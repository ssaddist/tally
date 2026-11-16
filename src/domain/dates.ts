import { differenceInCalendarDays, format, isValid, parse } from "date-fns";
import type { ISODate } from "./types";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isISODate(value: unknown): value is ISODate {
  if (typeof value !== "string" || !ISO_DATE_RE.test(value)) return false;
  const d = parse(value, "yyyy-MM-dd", new Date(2000, 0, 1));
  return isValid(d) && format(d, "yyyy-MM-dd") === value;
}

export function parseISODate(value: ISODate): Date {
  return parse(value, "yyyy-MM-dd", new Date(2000, 0, 1));
}

export function toISODate(date: Date): ISODate {
  return format(date, "yyyy-MM-dd");
}

export function todayISO(now: Date = new Date()): ISODate {
  return toISODate(now);
}

export function daysBetween(from: ISODate, to: ISODate): number {
  return differenceInCalendarDays(parseISODate(to), parseISODate(from));
}

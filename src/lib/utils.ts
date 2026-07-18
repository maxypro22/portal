import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { SLOT_INTERVAL_MINUTES, WORKING_HOURS, type HoursMap } from "./constants";

/** Tailwind-aware className combiner. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** "HH:mm" -> minutes from midnight. */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** minutes from midnight -> "HH:mm" (handles values >= 1440 by wrapping). */
export function minutesToTime(mins: number): string {
  const wrapped = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

/** "HH:mm" (24h) -> "7:00 PM" display. */
export function formatTime12h(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
}

/**
 * Generate 30-min booking start slots for a given weekday, honoring working
 * hours. The last slot leaves room for a 2-hour dining window before close.
 * Purely a display/selection list — every slot returned here is bookable by
 * any number of guests (no availability/overlap restriction).
 */
export function generateSlotsForDay(
  dayOfWeek: number,
  durationMinutes = 120,
  hoursMap: HoursMap = WORKING_HOURS
): string[] {
  const hours = hoursMap[dayOfWeek];
  if (!hours) return [];
  const slots: string[] = [];
  const lastStart = hours.close - durationMinutes;
  for (let m = hours.open; m <= lastStart; m += SLOT_INTERVAL_MINUTES) {
    slots.push(minutesToTime(m));
  }
  return slots;
}

/** Local YYYY-MM-DD (avoids UTC off-by-one from toISOString). */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parse a YYYY-MM-DD key into a local Date at midnight. */
export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

/**
 * Build a 6-week (42-cell), Sunday-first grid for the month containing
 * `viewDate`. Cells outside that month are `null`. Used by the booking
 * wizard's calendar dropdown.
 */
export function buildMonthGrid(viewDate: Date): (Date | null)[] {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = firstOfMonth.getDay(); // 0 = Sunday

  const cells: (Date | null)[] = [];
  for (let i = 0; i < leadingBlanks; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  while (cells.length < 42) cells.push(null);
  return cells;
}

/** Friendly date, e.g. "Thursday, 16 July 2026". */
export function formatLongDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Generate a booking reference like ST-2026-8F3A. */
export function generateReference(year: number): string {
  const chars = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `ST-${year}-${code}`;
}

/**
 * Local Qatar mobile number: exactly 8 digits, no leading-digit restriction.
 * +974 is shown as a placeholder only — the guest types just the 8 digits.
 */
export const QATAR_PHONE_REGEX = /^\d{8}$/;

/** Normalize user phone input to +974######## where possible. */
export function normalizeQatarPhone(input: string): string {
  const digits = input.replace(/[^\d]/g, "");
  // strip leading 00974 / 974
  let local = digits;
  if (local.startsWith("00974")) local = local.slice(5);
  else if (local.startsWith("974")) local = local.slice(3);
  return `+974${local}`;
}

/** Capacity label for a table. */
export function seatLabel(capacity: number): string {
  return capacity === 1 ? "1 seat" : `${capacity} seats`;
}

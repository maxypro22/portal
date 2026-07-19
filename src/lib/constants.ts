/**
 * Shared domain constants for Steak Town.
 */

// Booking statuses ------------------------------------------------------------
export const BOOKING_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
  "NO_SHOW",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const STATUS_META: Record<
  BookingStatus,
  { label: string; badgeClass: string; dot: string }
> = {
  PENDING: {
    label: "Pending",
    badgeClass: "bg-amber-500/15 text-status-pending border-status-pending/40",
    dot: "bg-status-pending",
  },
  CONFIRMED: {
    label: "Confirmed",
    badgeClass: "bg-emerald-500/15 text-status-confirmed border-status-confirmed/40",
    dot: "bg-status-confirmed",
  },
  CANCELLED: {
    label: "Cancelled",
    badgeClass: "bg-red-500/15 text-status-cancelled border-status-cancelled/40",
    dot: "bg-status-cancelled",
  },
  COMPLETED: {
    label: "Completed",
    badgeClass: "bg-gray-500/15 text-status-completed border-status-completed/40",
    dot: "bg-status-completed",
  },
  NO_SHOW: {
    label: "No-show",
    badgeClass: "bg-purple-500/15 text-status-noshow border-status-noshow/40",
    dot: "bg-status-noshow",
  },
};

// Table sections --------------------------------------------------------------
export const SECTIONS = ["MAIN", "TERRACE", "VIP"] as const;
export type Section = (typeof SECTIONS)[number];

export const SECTION_META: Record<Section, { label: string; description: string }> = {
  MAIN: { label: "Main Hall", description: "The heart of the steakhouse" },
  TERRACE: { label: "Terrace", description: "Open-air dining under the Doha sky" },
  VIP: { label: "VIP Booths", description: "Private, premium seating" },
};

export const TABLE_SHAPES = ["round", "square", "rect", "booth"] as const;
export type TableShape = (typeof TABLE_SHAPES)[number];

// Booking rules ---------------------------------------------------------------
export const DEFAULT_DURATION_MINUTES = 120; // 2-hour dining window (informational — stored on the booking)
export const SLOT_INTERVAL_MINUTES = 30;
// Last seating: a guest can book right up to this many minutes before
// closing, even though the 2-hour dining window would run past close —
// standard "last seating" restaurant practice, not a hard capacity limit.
export const LAST_SEATING_BUFFER_MINUTES = 30;
export const MIN_PARTY_SIZE = 1;
export const MAX_PARTY_SIZE = 15;
/** How far ahead guests can book — the calendar disables dates beyond this. */
export const MAX_ADVANCE_BOOKING_DAYS = 90;

export type DayHours = { open: number; close: number };
export type HoursMap = Record<number, DayHours>;

/**
 * Default working hours per day of week (0 = Sunday … 6 = Saturday) — used
 * as a fallback until the WorkingHours DB table is migrated/seeded, and as
 * the seed values for that migration (prisma/add-working-hours.sql). Once
 * seeded, the database (editable from /admin/hours) is authoritative — see
 * getWorkingHours() in lib/hours.ts. `open`/`close` are minutes from
 * midnight; `close` may exceed 1440 for after-midnight closing (e.g. 1am =
 * 25:00 = 1500).
 */
export const WORKING_HOURS: HoursMap = {
  0: { open: 12 * 60, close: 24 * 60 }, // Sun  12pm–12am
  1: { open: 12 * 60, close: 24 * 60 }, // Mon  12pm–12am
  2: { open: 12 * 60, close: 24 * 60 }, // Tue  12pm–12am
  3: { open: 12 * 60, close: 24 * 60 }, // Wed  12pm–12am
  4: { open: 12 * 60, close: 25 * 60 }, // Thu  12pm–1am
  5: { open: 13 * 60, close: 25 * 60 }, // Fri  1pm–1am
  6: { open: 12 * 60, close: 24 * 60 }, // Sat  12pm–12am
};

// Brand / contact -------------------------------------------------------------
// Values mirror steaktown.qa (logo assets, socials, hours, developer credit).
export const BRAND = {
  name: "Steak Town",
  domain: "steaktown.qa",
  phones: ["+974 30082849", "+974 40337003"],
  // Exact footer copy from steaktown.qa
  hoursLine: "Saturday - Wednesday 12pm - 12am | Thursday 12pm - 1am",
  hoursLine2: "Friday from 1 P.M to 1 A.M",
  hours: [
    { days: "Sat – Wed", time: "12:00 PM – 12:00 AM" },
    { days: "Thursday", time: "12:00 PM – 1:00 AM" },
    { days: "Friday", time: "1:00 PM – 1:00 AM" },
  ],
  socials: {
    snapchat: "https://www.snapchat.com/add/steaktown.qa",
    tiktok: "https://www.tiktok.com/@steaktown.qa",
    instagram: "https://www.instagram.com/steaktown.qa/",
    facebook: "https://www.facebook.com/Steaktown.qa/",
  },
};

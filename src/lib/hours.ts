import { prisma } from "./prisma";
import {
  LAST_SEATING_BUFFER_MINUTES as DEFAULT_LAST_SEATING_BUFFER_MINUTES,
  WORKING_HOURS as DEFAULT_HOURS,
  type DayHours,
  type HoursMap,
} from "./constants";

export type { DayHours, HoursMap };

/**
 * Working hours as configured in the database (editable from /admin/hours).
 * Falls back to the hardcoded defaults if the WorkingHours table hasn't been
 * migrated/seeded yet (see prisma/add-working-hours.sql), so booking still
 * works before that script runs. A day marked closed (isOpen=false) is
 * simply absent from the returned map — callers treat a missing day as
 * "closed," so no special-casing is needed downstream.
 */
export async function getWorkingHours(): Promise<HoursMap> {
  const rows = await prisma.workingHours.findMany();
  if (rows.length === 0) return DEFAULT_HOURS;

  const map: HoursMap = {};
  for (const row of rows) {
    if (row.isOpen) {
      map[row.dayOfWeek] = { open: row.openMinutes, close: row.closeMinutes };
    }
  }
  return map;
}

/**
 * How close to closing time the last bookable slot can be (editable from
 * /admin/hours) — e.g. 10 minutes means the last slot sits exactly 10
 * minutes before close, regardless of the regular slot grid. Falls back to
 * the hardcoded default if BookingSettings hasn't been migrated/seeded yet
 * (see prisma/add-booking-settings.sql).
 */
export async function getLastSeatingBufferMinutes(): Promise<number> {
  const row = await prisma.bookingSettings.findUnique({ where: { id: "default" } });
  return row?.lastSeatingBufferMinutes ?? DEFAULT_LAST_SEATING_BUFFER_MINUTES;
}

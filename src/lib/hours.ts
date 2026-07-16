import { prisma } from "./prisma";
import { WORKING_HOURS as DEFAULT_HOURS, type DayHours, type HoursMap } from "./constants";

export type { DayHours, HoursMap };

/**
 * Working hours as configured in the database (editable from /admin/hours).
 * Falls back to the hardcoded defaults if the WorkingHours table hasn't been
 * migrated/seeded yet (see prisma/add-working-hours.sql), so booking still
 * works before that script runs. A day marked closed (isOpen=false) is
 * simply absent from the returned map — generateSlotsForDay already treats
 * a missing day as "no slots," so no special-casing is needed downstream.
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

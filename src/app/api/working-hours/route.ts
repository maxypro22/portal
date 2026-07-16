import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiOk, apiError, handleRouteError, requireAdmin } from "@/lib/api";

export const dynamic = "force-dynamic";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * GET /api/working-hours — PUBLIC (read-only): all 7 days, seeding sane
 * defaults for any missing day. Not sensitive data — the booking wizard's
 * calendar needs this to grey out days the restaurant is closed, and the
 * availability endpoint already reveals working hours indirectly anyway.
 */
export async function GET() {
  try {
    const rows = await prisma.workingHours.findMany({ orderBy: { dayOfWeek: "asc" } });
    const byDay = new Map(rows.map((r) => [r.dayOfWeek, r]));

    const days = Array.from({ length: 7 }, (_, dayOfWeek) => {
      const row = byDay.get(dayOfWeek);
      return {
        dayOfWeek,
        dayName: DAY_NAMES[dayOfWeek],
        isOpen: row?.isOpen ?? true,
        openMinutes: row?.openMinutes ?? 720,
        closeMinutes: row?.closeMinutes ?? 1440,
      };
    });

    return apiOk(days);
  } catch (err) {
    return handleRouteError(err);
  }
}

const dayUpdateSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  isOpen: z.boolean(),
  openMinutes: z.number().int().min(0).max(1439),
  closeMinutes: z.number().int().min(1).max(1560), // up to 2am next day
});
const patchSchema = z.object({ days: z.array(dayUpdateSchema).min(1).max(7) });

/** PATCH /api/working-hours — admin: upsert one or more days. */
export async function PATCH(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { days } = patchSchema.parse(body);

    for (const day of days) {
      if (day.closeMinutes <= day.openMinutes) {
        return apiError(`${DAY_NAMES[day.dayOfWeek]}: closing time must be after opening time.`, 400);
      }
    }

    await prisma.$transaction(
      days.map((day) =>
        prisma.workingHours.upsert({
          where: { dayOfWeek: day.dayOfWeek },
          update: {
            isOpen: day.isOpen,
            openMinutes: day.openMinutes,
            closeMinutes: day.closeMinutes,
          },
          create: {
            dayOfWeek: day.dayOfWeek,
            isOpen: day.isOpen,
            openMinutes: day.openMinutes,
            closeMinutes: day.closeMinutes,
          },
        })
      )
    );

    const rows = await prisma.workingHours.findMany({ orderBy: { dayOfWeek: "asc" } });
    return apiOk(rows);
  } catch (err) {
    return handleRouteError(err);
  }
}

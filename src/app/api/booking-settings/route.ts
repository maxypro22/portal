import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiOk, handleRouteError, requireAdmin } from "@/lib/api";
import { getSlotIntervalMinutes } from "@/lib/hours";

export const dynamic = "force-dynamic";

/**
 * GET /api/booking-settings — PUBLIC (read-only): the guest-facing booking
 * wizard needs the slot interval to generate its time list. Not sensitive.
 */
export async function GET() {
  try {
    const slotIntervalMinutes = await getSlotIntervalMinutes();
    return apiOk({ slotIntervalMinutes });
  } catch (err) {
    return handleRouteError(err);
  }
}

const patchSchema = z.object({
  slotIntervalMinutes: z.number().int().min(5, "Minimum 5 minutes").max(240, "Maximum 240 minutes"),
});

/** PATCH /api/booking-settings — admin: update the slot interval. */
export async function PATCH(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { slotIntervalMinutes } = patchSchema.parse(body);

    const row = await prisma.bookingSettings.upsert({
      where: { id: "default" },
      update: { slotIntervalMinutes },
      create: { id: "default", slotIntervalMinutes },
    });
    return apiOk(row);
  } catch (err) {
    return handleRouteError(err);
  }
}

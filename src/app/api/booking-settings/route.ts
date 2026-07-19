import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiOk, handleRouteError, requireAdmin } from "@/lib/api";
import { getLastSeatingBufferMinutes } from "@/lib/hours";

export const dynamic = "force-dynamic";

/**
 * GET /api/booking-settings — PUBLIC (read-only): the guest-facing booking
 * wizard needs this to generate its time list. Not sensitive.
 */
export async function GET() {
  try {
    const lastSeatingBufferMinutes = await getLastSeatingBufferMinutes();
    return apiOk({ lastSeatingBufferMinutes });
  } catch (err) {
    return handleRouteError(err);
  }
}

const patchSchema = z.object({
  lastSeatingBufferMinutes: z
    .number()
    .int()
    .min(0, "Minimum 0 minutes")
    .max(240, "Maximum 240 minutes"),
});

/** PATCH /api/booking-settings — admin: update the last-seating buffer. */
export async function PATCH(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { lastSeatingBufferMinutes } = patchSchema.parse(body);

    const row = await prisma.bookingSettings.upsert({
      where: { id: "default" },
      update: { lastSeatingBufferMinutes },
      create: { id: "default", lastSeatingBufferMinutes },
    });
    return apiOk(row);
  } catch (err) {
    return handleRouteError(err);
  }
}

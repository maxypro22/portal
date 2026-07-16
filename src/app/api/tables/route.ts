import { prisma } from "@/lib/prisma";
import { apiOk, apiError, handleRouteError, requireAdmin } from "@/lib/api";
import { tableSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

/**
 * GET /api/tables?locationId=xxx&includeInactive=1
 * Public: returns active tables for a location (floor plan).
 * Admin UI passes includeInactive=1 to see everything.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get("locationId");
    const includeInactive = searchParams.get("includeInactive") === "1";
    if (!locationId) return apiError("locationId is required", 400);

    const tables = await prisma.table.findMany({
      where: { locationId, ...(includeInactive ? {} : { isActive: true }) },
      orderBy: { number: "asc" },
    });
    return apiOk(tables);
  } catch (err) {
    return handleRouteError(err);
  }
}

/** POST /api/tables — admin create. */
export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const data = tableSchema.parse(body);
    const table = await prisma.table.create({ data });
    return apiOk(table, 201);
  } catch (err) {
    return handleRouteError(err);
  }
}

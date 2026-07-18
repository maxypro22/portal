import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { apiOk, handleRouteError, requireAdmin } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * GET /api/clients — ADMIN.
 * There is no separate Customer table; clients are derived from bookings.
 * Grouped by phone (mandatory on every booking — email is optional, so it
 * can't be used as the identity key without accidentally merging every
 * guest who skipped email into one "client").
 *
 * Scales with table size: grouping/aggregation runs in Postgres (indexed on
 * guestPhone), not by loading every booking row into Node memory. Only the
 * current page's canonical name/email is fetched afterwards, bounded to a
 * handful of phone numbers.
 *
 * Query: q (search), page, pageSize
 */
export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const pageSize = Math.min(50, Math.max(5, parseInt(searchParams.get("pageSize") ?? "10", 10)));

    const where: Prisma.BookingWhereInput = q
      ? {
          OR: [
            { guestName: { contains: q, mode: "insensitive" } },
            { guestPhone: { contains: q, mode: "insensitive" } },
            { guestEmail: { contains: q, mode: "insensitive" } },
          ],
        }
      : {};

    // Distinct-client count for pagination — DB-level, index-backed on guestPhone.
    const distinct = await prisma.booking.groupBy({ by: ["guestPhone"], where });
    const total = distinct.length;
    const totalPages = Math.ceil(total / pageSize) || 1;

    // Aggregate stats per phone number, DB-side (count/sum/max), paginated.
    const grouped = await prisma.booking.groupBy({
      by: ["guestPhone"],
      where,
      _count: { _all: true },
      _sum: { partySize: true },
      _max: { date: true },
      orderBy: { _max: { date: "desc" } },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // Canonical name/email per phone — most recent booking only, and only
    // for this page's phone numbers (never the whole table).
    const phones = grouped.map((g) => g.guestPhone);
    const latestRows = phones.length
      ? await prisma.booking.findMany({
          where: { guestPhone: { in: phones } },
          orderBy: { createdAt: "desc" },
          select: { guestPhone: true, guestName: true, guestEmail: true },
        })
      : [];
    const canonicalByPhone = new Map<string, { name: string; email: string }>();
    for (const row of latestRows) {
      if (!canonicalByPhone.has(row.guestPhone)) {
        canonicalByPhone.set(row.guestPhone, { name: row.guestName, email: row.guestEmail ?? "" });
      }
    }

    const clients = grouped.map((g) => {
      const canonical = canonicalByPhone.get(g.guestPhone);
      return {
        name: canonical?.name ?? "",
        phone: g.guestPhone,
        email: canonical?.email ?? "",
        bookings: g._count._all,
        totalGuests: g._sum.partySize ?? 0,
        lastVisit: (g._max.date ?? new Date()).toISOString(),
      };
    });

    return apiOk({ clients, pagination: { page, pageSize, total, totalPages } });
  } catch (err) {
    return handleRouteError(err);
  }
}

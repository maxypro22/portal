import { prisma } from "@/lib/prisma";
import { apiOk, handleRouteError, requireAdmin } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * GET /api/clients — ADMIN.
 * There is no separate Customer table; clients are derived from bookings,
 * grouped by email (the stable identifier). Returns each unique customer's
 * name, phone, email, total bookings, total guests, and last visit date.
 *
 * Query: q (search), page, pageSize
 */
export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim().toLowerCase() ?? "";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const pageSize = Math.min(50, Math.max(5, parseInt(searchParams.get("pageSize") ?? "10", 10)));

    // Pull the lightweight guest fields from every booking and aggregate in JS.
    const bookings = await prisma.booking.findMany({
      select: {
        guestName: true,
        guestPhone: true,
        guestEmail: true,
        partySize: true,
        date: true,
        createdAt: true,
      },
    });

    type Client = {
      name: string;
      phone: string;
      email: string;
      bookings: number;
      totalGuests: number;
      lastVisit: string; // ISO date
      _sortKey: number; // for picking canonical name/phone (latest booking)
    };

    const map = new Map<string, Client>();
    for (const b of bookings) {
      const key = b.guestEmail.trim().toLowerCase();
      const stamp = b.createdAt.getTime();
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          name: b.guestName,
          phone: b.guestPhone,
          email: b.guestEmail,
          bookings: 1,
          totalGuests: b.partySize,
          lastVisit: b.date.toISOString(),
          _sortKey: stamp,
        });
      } else {
        existing.bookings += 1;
        existing.totalGuests += b.partySize;
        if (b.date.toISOString() > existing.lastVisit) existing.lastVisit = b.date.toISOString();
        // Use the most recently created booking's name/phone as canonical.
        if (stamp > existing._sortKey) {
          existing.name = b.guestName;
          existing.phone = b.guestPhone;
          existing._sortKey = stamp;
        }
      }
    }

    let clients = [...map.values()];

    if (q) {
      clients = clients.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q)
      );
    }

    // Most recent visitors first.
    clients.sort((a, b) => (a.lastVisit < b.lastVisit ? 1 : -1));

    const total = clients.length;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const paged = clients
      .slice((page - 1) * pageSize, page * pageSize)
      .map(({ _sortKey, ...rest }) => rest); // strip internal field

    return apiOk({
      clients: paged,
      pagination: { page, pageSize, total, totalPages },
    });
  } catch (err) {
    return handleRouteError(err);
  }
}

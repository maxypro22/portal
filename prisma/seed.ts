/**
 * Steak Town — database seed (safe & idempotent, for Supabase Postgres).
 *
 *  - Upserts the admin user from ADMIN_EMAIL / ADMIN_PASSWORD env vars
 *    (falls back to admin@steaktown.qa / Admin@1234 for first-time setup).
 *  - Seeds demo locations + table layouts + sample bookings ONLY when the
 *    database has no locations yet, so re-running never wipes real data.
 *
 * Run:  npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "admin@steaktown.qa").toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@1234";
const ADMIN_NAME = process.env.ADMIN_NAME || "Steak Town Admin";

type SeedTable = {
  number: number;
  capacity: number;
  section: "MAIN" | "TERRACE" | "VIP";
  shape: "round" | "square" | "rect" | "booth";
  posX: number;
  posY: number;
};

/** A hand-designed, professional-looking floor plan (percentage coordinates). */
function buildFloorPlan(): SeedTable[] {
  const tables: SeedTable[] = [];
  let n = 1;

  const mainRows = [22, 42, 62];
  const mainCols = [12, 26, 40];
  for (const y of mainRows) {
    for (const x of mainCols) {
      const isTwo = (n + x) % 2 === 0;
      tables.push({
        number: n++,
        capacity: isTwo ? 2 : 4,
        section: "MAIN",
        shape: isTwo ? "round" : "square",
        posX: x,
        posY: y,
      });
    }
  }
  tables.push({ number: n++, capacity: 6, section: "MAIN", shape: "rect", posX: 26, posY: 82 });
  tables.push({ number: n++, capacity: 6, section: "MAIN", shape: "rect", posX: 12, posY: 82 });

  const terraceY = [20, 36, 52, 68, 84];
  terraceY.forEach((y, i) => {
    tables.push({
      number: n++,
      capacity: i % 2 === 0 ? 4 : 2,
      section: "TERRACE",
      shape: i % 2 === 0 ? "square" : "round",
      posX: 62,
      posY: y,
    });
  });

  const vipY = [26, 48, 70];
  vipY.forEach((y) => {
    tables.push({ number: n++, capacity: 6, section: "VIP", shape: "booth", posX: 84, posY: y });
  });
  tables.push({ number: n++, capacity: 8, section: "VIP", shape: "booth", posX: 84, posY: 90 });

  return tables;
}

async function main() {
  console.log("🌱  Seeding Steak Town database...");

  // --- Admin user (upsert — never destructive) ---
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { hashedPassword, name: ADMIN_NAME, role: "ADMIN" },
    create: { email: ADMIN_EMAIL, hashedPassword, name: ADMIN_NAME, role: "ADMIN" },
  });
  console.log(`👤  Admin ready: ${admin.email}`);

  // --- Demo data only on an empty database ---
  const existingLocations = await prisma.location.count();
  if (existingLocations > 0) {
    console.log(`ℹ️   ${existingLocations} location(s) already exist — skipping demo data.`);
    console.log("✅  Seed complete.");
    return;
  }

  const locationsData = [
    {
      // Real branch — inside Sapphire Plaza Hotel on Al Reem Street, Doha.
      name: "Steak Town — Sapphire Plaza",
      address: "Sapphire Plaza Hotel, 8113, 950 Al Reem St, Doha, Qatar",
      phone: "+974 30082849",
      imageUrl: null,
    },
    {
      // Second branch (details TBC).
      name: "Steak Town — Lusail",
      address: "Lusail City, Doha, Qatar",
      phone: "+974 40337003",
      imageUrl: null,
    },
  ];

  const floorPlan = buildFloorPlan();

  for (const loc of locationsData) {
    const location = await prisma.location.create({ data: loc });
    await prisma.table.createMany({
      data: floorPlan.map((t) => ({ ...t, locationId: location.id })),
    });
    console.log(`🏛️   Location created: ${location.name} (${floorPlan.length} tables)`);
  }

  // --- Sample bookings so the dashboard isn't empty on first run ---
  const firstLocation = await prisma.location.findFirstOrThrow();
  const someTables = await prisma.table.findMany({
    where: { locationId: firstLocation.id },
    take: 6,
    orderBy: { number: "asc" },
  });

  const today = new Date();
  const dayAt = (offsetDays: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offsetDays);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const sampleBookings = [
    { t: 0, slot: "19:00", name: "Khalid Al-Marri", party: 4, status: "CONFIRMED", off: 0 },
    { t: 1, slot: "20:30", name: "Sara Ahmed", party: 2, status: "PENDING", off: 0 },
    { t: 2, slot: "21:00", name: "James Whitfield", party: 6, status: "CONFIRMED", off: 0 },
    { t: 3, slot: "18:30", name: "Noora Al-Kuwari", party: 2, status: "COMPLETED", off: -1 },
    { t: 4, slot: "20:00", name: "Omar Farouk", party: 4, status: "NO_SHOW", off: -1 },
    { t: 5, slot: "19:30", name: "Layla Hassan", party: 8, status: "CONFIRMED", off: 1 },
  ];

  let refCounter = 1000;
  for (const b of sampleBookings) {
    const table = someTables[b.t % someTables.length];
    await prisma.booking.create({
      data: {
        reference: `ST-${today.getFullYear()}-${(refCounter++).toString(16).toUpperCase().padStart(4, "0")}`,
        locationId: firstLocation.id,
        tableId: table.id,
        guestName: b.name,
        guestPhone: "+97430082849",
        guestEmail: `${b.name.split(" ")[0].toLowerCase()}@example.com`,
        partySize: b.party,
        date: dayAt(b.off),
        timeSlot: b.slot,
        durationMinutes: 120,
        status: b.status,
        specialRequests: b.party >= 6 ? "Celebrating a birthday — please prepare a dessert." : null,
      },
    });
  }
  console.log(`📋  ${sampleBookings.length} sample bookings created`);
  console.log("✅  Seed complete.");
  console.log(`    Admin login → ${ADMIN_EMAIL} / (your ADMIN_PASSWORD)`);
}

main()
  .catch((e) => {
    console.error("❌  Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

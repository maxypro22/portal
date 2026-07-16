import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/AdminUI";
import { BookingsManager } from "@/components/admin/BookingsManager";

export const metadata = { title: "Bookings" };
export const dynamic = "force-dynamic";

export default async function BookingsPage() {
  const locations = await prisma.location.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div>
      <PageHeader
        title="Bookings"
        subtitle="Search, filter, and manage every reservation."
      />
      <BookingsManager locations={locations} />
    </div>
  );
}

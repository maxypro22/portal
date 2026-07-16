import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/AdminUI";
import { LiveFloor } from "@/components/admin/LiveFloor";
import { EmptyState } from "@/components/ui/Primitives";

export const metadata = { title: "Live Floor" };
export const dynamic = "force-dynamic";

export default async function FloorPage() {
  const locations = await prisma.location.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div>
      <PageHeader
        title="Live Floor View"
        subtitle="Real-time table status for any date and time."
      />
      {locations.length === 0 ? (
        <EmptyState title="No active locations" description="Add a location to view its floor." />
      ) : (
        <LiveFloor locations={locations} />
      )}
    </div>
  );
}

import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/AdminUI";
import { TablesManager } from "@/components/admin/TablesManager";
import { EmptyState } from "@/components/ui/Primitives";

export const metadata = { title: "Tables" };
export const dynamic = "force-dynamic";

export default async function TablesPage() {
  const locations = await prisma.location.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div>
      <PageHeader
        title="Tables"
        subtitle="Design each location's floor plan — capacity, section, and position."
      />
      {locations.length === 0 ? (
        <EmptyState
          title="No locations yet"
          description="Create a location first, then add its tables."
        />
      ) : (
        <TablesManager locations={locations} />
      )}
    </div>
  );
}

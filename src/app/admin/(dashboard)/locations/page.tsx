import { PageHeader } from "@/components/admin/AdminUI";
import { LocationsManager } from "@/components/admin/LocationsManager";

export const metadata = { title: "Locations" };

export default function LocationsPage() {
  return (
    <div>
      <PageHeader title="Locations" subtitle="Manage your restaurant branches." />
      <LocationsManager />
    </div>
  );
}

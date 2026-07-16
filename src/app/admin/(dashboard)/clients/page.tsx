import { PageHeader } from "@/components/admin/AdminUI";
import { ClientsManager } from "@/components/admin/ClientsManager";

export const metadata = { title: "Clients" };
export const dynamic = "force-dynamic";

export default function ClientsPage() {
  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle="Every customer who has booked — name, phone number, and email."
      />
      <ClientsManager />
    </div>
  );
}

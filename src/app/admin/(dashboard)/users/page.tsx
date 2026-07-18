import { PageHeader } from "@/components/admin/AdminUI";
import { UsersManager } from "@/components/admin/UsersManager";

export const metadata = { title: "Users" };

export default function UsersPage() {
  return (
    <div>
      <PageHeader title="Users" subtitle="Manage who can sign in to this dashboard." />
      <UsersManager />
    </div>
  );
}

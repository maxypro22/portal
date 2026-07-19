import { PageHeader } from "@/components/admin/AdminUI";
import { EmailsManager } from "@/components/admin/EmailsManager";

export const metadata = { title: "Send Emails" };

export default function EmailsPage() {
  return (
    <div>
      <PageHeader title="Send Emails" subtitle="Who receives a copy of every booking confirmation." />
      <EmailsManager />
    </div>
  );
}

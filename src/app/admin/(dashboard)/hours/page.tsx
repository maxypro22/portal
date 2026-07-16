import { PageHeader } from "@/components/admin/AdminUI";
import { WorkingHoursManager } from "@/components/admin/WorkingHoursManager";

export const metadata = { title: "Working Hours" };

export default function HoursPage() {
  return (
    <div>
      <PageHeader
        title="Working Hours"
        subtitle="Set opening and closing times per day, or close a day entirely."
      />
      <WorkingHoursManager />
    </div>
  );
}

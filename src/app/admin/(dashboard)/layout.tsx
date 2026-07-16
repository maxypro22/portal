import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/admin/Sidebar";

/**
 * Protected admin dashboard shell. Server-side session guard (defence in depth
 * alongside middleware). Renders the sidebar + page content area.
 */
export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/admin/login");

  return (
    <div className="flex min-h-screen bg-brand-800 lg:flex-row flex-col">
      <Sidebar userName={session.user.name} />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">{children}</main>
    </div>
  );
}

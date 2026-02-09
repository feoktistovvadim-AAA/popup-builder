import AdminSidebar from "@/components/AdminSidebar";
import { getOrgContext } from "@/lib/org";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { organizationId, memberships } = await getOrgContext();

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-black">
      <AdminSidebar activeOrgId={organizationId} memberships={memberships} />
      <main className="flex-1 px-6 py-8">{children}</main>
    </div>
  );
}

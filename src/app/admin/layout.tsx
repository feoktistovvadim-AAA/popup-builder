import AdminSidebar from "@/components/AdminSidebar";
import MobileNav from "@/components/admin/MobileNav";
import { getOrgContext } from "@/lib/org";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { organizationId, memberships } = await getOrgContext();

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-zinc-50 dark:bg-black">
      <AdminSidebar activeOrgId={organizationId} memberships={memberships} />
      <MobileNav activeOrgId={organizationId} memberships={memberships} />
      <main className="flex-1 px-4 py-6 md:px-6 md:py-8">{children}</main>
    </div>
  );
}

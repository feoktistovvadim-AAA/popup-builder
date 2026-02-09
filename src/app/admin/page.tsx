import Link from "next/link";
import { cookies } from "next/headers";

import { getOrgContext, getActiveOrgCookieName } from "@/lib/org";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const context = await getOrgContext();
  const organizationId = context.organizationId;
  const cookieStore = await cookies();
  const activeOrgCookie =
    cookieStore.get(getActiveOrgCookieName())?.value ?? null;

  const [organization, sitesCount, popupsCount] = await Promise.all([
    organizationId
      ? prisma.organization.findUnique({ where: { id: organizationId } })
      : null,
    organizationId
      ? prisma.site.count({ where: { organizationId } })
      : 0,
    organizationId
      ? prisma.popup.count({
          where: { site: { organizationId } },
        })
      : 0,
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-black dark:text-white">
          Overview
        </h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Welcome back{organization ? `, ${organization.name}` : ""}.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-black">
          <div className="text-xs uppercase tracking-wide text-black/50 dark:text-white/50">
            Sites
          </div>
          <div className="mt-2 text-2xl font-semibold text-black dark:text-white">
            {sitesCount}
          </div>
        </div>
        <div className="rounded-lg border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-black">
          <div className="text-xs uppercase tracking-wide text-black/50 dark:text-white/50">
            Popups
          </div>
          <div className="mt-2 text-2xl font-semibold text-black dark:text-white">
            {popupsCount}
          </div>
        </div>
        <div className="rounded-lg border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-black">
          <div className="text-xs uppercase tracking-wide text-black/50 dark:text-white/50">
            Status
          </div>
          <div className="mt-2 text-sm text-black/70 dark:text-white/70">
            {sitesCount === 0
              ? "Add a site to start publishing popups."
              : "Ready to build your next popup."}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-black">
        <h2 className="text-lg font-semibold text-black dark:text-white">
          Quick actions
        </h2>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link
            className="rounded border border-black/10 px-4 py-2 text-black/80 hover:bg-black/[.04] dark:border-white/10 dark:text-white/80 dark:hover:bg-white/[.06]"
            href="/admin/sites"
          >
            Create a site
          </Link>
          <Link
            className="rounded border border-black/10 px-4 py-2 text-black/80 hover:bg-black/[.04] dark:border-white/10 dark:text-white/80 dark:hover:bg-white/[.06]"
            href="/admin/popups"
          >
            Create a popup
          </Link>
          <Link
            className="rounded border border-black/10 px-4 py-2 text-black/80 hover:bg-black/[.04] dark:border-white/10 dark:text-white/80 dark:hover:bg-white/[.06]"
            href="/admin/team"
          >
            Invite teammates
          </Link>
        </div>
      </div>

      <div className="rounded-lg border border-black/10 bg-white p-6 text-sm text-black/70 dark:border-white/10 dark:bg-black dark:text-white/70">
        <h2 className="text-sm font-semibold text-black dark:text-white">
          Debug context
        </h2>
        <div className="mt-3 space-y-1">
          <div>session.user.id: {context.session?.user?.id ?? "null"}</div>
          <div>activeOrgId cookie: {activeOrgCookie ?? "null"}</div>
          <div>currentOrgId: {organizationId ?? "null"}</div>
          <div>membershipCount: {context.membershipCount}</div>
        </div>
      </div>
    </div>
  );
}

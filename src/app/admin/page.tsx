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
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold text-black dark:text-white">
          Overview
        </h1>
        <p className="mt-1 text-sm text-black/50 dark:text-white/50">
          Welcome back{organization ? `, ${organization.name}` : ""}.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl p-5 card-hover" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: "rgba(99, 102, 241, 0.1)" }}>
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="8" />
                <path d="M4 12h16M12 4c2.5 2.7 2.5 13.3 0 16M12 4c-2.5 2.7-2.5 13.3 0 16" />
              </svg>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-black/40 dark:text-white/40">
                Sites
              </div>
              <div className="text-2xl font-semibold text-black dark:text-white">
                {sitesCount}
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-xl p-5 card-hover" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: "rgba(168, 85, 247, 0.1)" }}>
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-purple-500" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 5l7 4-7 4-7-4 7-4zm0 8l7 4-7 4-7-4 7-4z" />
              </svg>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-black/40 dark:text-white/40">
                Popups
              </div>
              <div className="text-2xl font-semibold text-black dark:text-white">
                {popupsCount}
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-xl p-5 card-hover" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: popupsCount > 0 ? "var(--status-published-bg)" : "var(--status-draft-bg)" }}>
              <svg viewBox="0 0 24 24" className="h-4 w-4" style={{ color: popupsCount > 0 ? "var(--status-published)" : "var(--status-draft)" }} fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-black/40 dark:text-white/40">
                Status
              </div>
              <div className="text-sm font-medium text-black/70 dark:text-white/70">
                {sitesCount === 0
                  ? "Add a site to start"
                  : "Ready to build"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl p-6" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
        <h2 className="text-sm font-semibold text-black dark:text-white">
          Quick actions
        </h2>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <Link
            className="rounded-lg px-4 py-2 text-xs font-medium text-black/70 hover:text-black dark:text-white/70 dark:hover:text-white transition-colors card-hover"
            style={{ border: "1px solid var(--border)" }}
            href="/admin/sites"
          >
            Create a site
          </Link>
          <Link
            className="rounded-lg px-4 py-2 text-xs font-medium text-black/70 hover:text-black dark:text-white/70 dark:hover:text-white transition-colors card-hover"
            style={{ border: "1px solid var(--border)" }}
            href="/admin/popups"
          >
            Create a popup
          </Link>
          <Link
            className="rounded-lg px-4 py-2 text-xs font-medium text-black/70 hover:text-black dark:text-white/70 dark:hover:text-white transition-colors card-hover"
            style={{ border: "1px solid var(--border)" }}
            href="/admin/team"
          >
            Invite teammates
          </Link>
        </div>
      </div>
    </div>
  );
}

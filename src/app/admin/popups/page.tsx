import Link from "next/link";

import CreatePopupForm from "@/components/admin/CreatePopupForm";
import CreatePopupFromPresetModal from "@/components/admin/CreatePopupFromPresetModal";
import { getOrgContext } from "@/lib/org";
import { prisma } from "@/lib/prisma";

export default async function AdminPopupsPage() {
  const context = await getOrgContext();
  const organizationId = context.organizationId;

  const [sites, popups] = await Promise.all([
    organizationId
      ? prisma.site.findMany({
          where: { organizationId },
          orderBy: { createdAt: "desc" },
        })
      : [],
    organizationId
      ? prisma.popup.findMany({
          where: { site: { organizationId } },
          include: {
            site: true,
            versions: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
          orderBy: { createdAt: "desc" },
        })
      : [],
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-black dark:text-white">
          Popups
        </h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Build, preview, and publish popup campaigns.
        </p>
      </div>

      <div className="rounded-lg border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-black">
        <h2 className="text-lg font-semibold text-black dark:text-white">
          Create a popup
        </h2>
        {sites.length === 0 ? (
          <p className="mt-3 text-sm text-black/60 dark:text-white/60">
            Create a site first to attach a popup.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            <CreatePopupForm sites={sites} />
            <CreatePopupFromPresetModal sites={sites} />
          </div>
        )}
      </div>

      <div className="rounded-lg border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-black">
        <h2 className="text-lg font-semibold text-black dark:text-white">
          Your popups
        </h2>
        {popups.length === 0 ? (
          <p className="mt-3 text-sm text-black/60 dark:text-white/60">
            No popups yet. Create your first campaign.
          </p>
        ) : (
          <div className="mt-4 space-y-3 text-sm">
            {popups.map((popup) => {
              const latestVersion = popup.versions[0];
              return (
                <div
                  key={popup.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded border border-black/10 px-4 py-3 dark:border-white/10"
                >
                  <div>
                    <div className="font-medium text-black dark:text-white">
                      {popup.name}
                    </div>
                    <div className="text-black/60 dark:text-white/60">
                      {popup.site.name} · {popup.site.domain}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-black/5 px-3 py-1 text-xs text-black/70 dark:bg-white/10 dark:text-white/70">
                      {popup.status}
                    </span>
                    {latestVersion ? (
                      <span className="rounded bg-black/5 px-3 py-1 text-xs text-black/70 dark:bg-white/10 dark:text-white/70">
                        v{latestVersion.version}
                      </span>
                    ) : null}
                    <Link
                      className="rounded bg-black px-3 py-1.5 text-xs font-medium text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                      href={`/admin/popups/${popup.id}/builder`}
                    >
                      Open builder
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

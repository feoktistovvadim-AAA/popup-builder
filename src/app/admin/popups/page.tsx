import CreatePopupForm from "@/components/admin/CreatePopupForm";
import CreatePopupFromPresetModal from "@/components/admin/CreatePopupFromPresetModal";
import PopupList from "@/components/admin/PopupList";
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
          select: {
            id: true,
            name: true,
            status: true,
            site: {
              select: {
                name: true,
                domain: true,
              },
            },
            versions: {
              select: {
                version: true,
              },
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
        <PopupList popups={popups} />
      </div>
    </div>
  );
}

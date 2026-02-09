import CreateSiteForm from "@/components/admin/CreateSiteForm";
import SitesList from "@/components/admin/SitesList";
import { getOrgContext } from "@/lib/org";
import { prisma } from "@/lib/prisma";

export default async function SitesPage() {
  const context = await getOrgContext();
  const organizationId = context.organizationId;

  const sites = organizationId
    ? await prisma.site.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
      })
    : [];
  const widgetOrigin =
    process.env.NEXT_PUBLIC_WIDGET_ORIGIN ?? process.env.NEXT_PUBLIC_APP_URL ?? "";
  const baseUrl =
    widgetOrigin || (process.env.NODE_ENV === "development" ? "" : "");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-black dark:text-white">
          Sites
        </h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Connect domains to deliver popups.
        </p>
      </div>

      <div className="rounded-lg border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-black">
        <h2 className="text-lg font-semibold text-black dark:text-white">
          Create a site
        </h2>
        <div className="mt-4">
          <CreateSiteForm />
        </div>
      </div>

      <div className="rounded-lg border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-black">
        <h2 className="text-lg font-semibold text-black dark:text-white">
          Your sites
        </h2>
        {sites.length === 0 ? (
          <p className="mt-3 text-sm text-black/60 dark:text-white/60">
            No sites yet. Create one to start publishing.
          </p>
        ) : (
          <SitesList sites={sites} baseUrl={baseUrl} />
        )}
      </div>
    </div>
  );
}

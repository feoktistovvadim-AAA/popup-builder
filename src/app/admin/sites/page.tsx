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
          Сайты
        </h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Подключайте домены для показа попапов.
        </p>
      </div>

      <div className="rounded-lg border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-black">
        <h2 className="text-lg font-semibold text-black dark:text-white">
          Создать сайт
        </h2>
        <div className="mt-4">
          <CreateSiteForm />
        </div>
      </div>

      <div className="rounded-lg border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-black">
        <h2 className="text-lg font-semibold text-black dark:text-white">
          Ваши сайты
        </h2>
        {sites.length === 0 ? (
          <p className="mt-3 text-sm text-black/60 dark:text-white/60">
            Сайтов пока нет. Создайте первый для начала.
          </p>
        ) : (
          <SitesList sites={sites} baseUrl={baseUrl} />
        )}
      </div>
    </div>
  );
}

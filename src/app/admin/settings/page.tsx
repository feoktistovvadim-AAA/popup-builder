import { getOrgContext } from "@/lib/org";
import { prisma } from "@/lib/prisma";

export default async function SettingsPage() {
  const context = await getOrgContext();
  const organizationId = context.organizationId;

  const organization = organizationId
    ? await prisma.organization.findUnique({ where: { id: organizationId } })
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-black dark:text-white">
          Настройки
        </h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Настройки организации и встраивания.
        </p>
      </div>

      <div className="rounded-lg border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-black">
        <h2 className="text-lg font-semibold text-black dark:text-white">
          Организация
        </h2>
        <div className="mt-3 text-sm text-black/70 dark:text-white/70">
          <div>Название: {organization?.name ?? "—"}</div>
          <div>Адрес: {organization?.slug ?? "—"}</div>
        </div>
      </div>

      <div className="rounded-lg border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-black">
        <h2 className="text-lg font-semibold text-black dark:text-white">
          Код встраивания
        </h2>
        <p className="mt-2 text-sm text-black/60 dark:text-white/60">
          Используйте ID сайта для инициализации движка попапов.
        </p>
        <pre className="mt-4 whitespace-pre-wrap rounded bg-black/5 p-4 text-xs text-black/80 dark:bg-white/10 dark:text-white/80">
          {`<script src="https://your-domain.com/pb.js"></script>
<script>
  PB.init({ siteId: "SITE_ID", userContext: {} })
</script>`}
        </pre>
      </div>
    </div>
  );
}

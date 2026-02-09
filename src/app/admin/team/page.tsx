import TeamManager from "@/components/admin/TeamManager";
import { getOrgContext } from "@/lib/org";
import { prisma } from "@/lib/prisma";

export default async function TeamPage() {
  const context = await getOrgContext();
  const organizationId = context.organizationId;

  const [memberships, invites] = await Promise.all([
    organizationId
      ? prisma.membership.findMany({
          where: { organizationId },
          include: { user: true },
          orderBy: { createdAt: "asc" },
        })
      : [],
    organizationId
      ? prisma.invite.findMany({
          where: { organizationId },
          orderBy: { createdAt: "desc" },
        })
      : [],
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-black dark:text-white">
          Team
        </h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Manage roles and invite teammates.
        </p>
      </div>

      <TeamManager memberships={memberships} invites={invites} />
    </div>
  );
}

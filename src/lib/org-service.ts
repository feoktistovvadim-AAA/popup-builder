import { prisma } from "@/lib/prisma";

export async function ensureUserOrganization(userId: string, nameHint?: string) {
  const memberships = await prisma.membership.findMany({
    where: { userId },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });

  if (memberships.length > 0) {
    return memberships;
  }

  const displayName = nameHint?.trim() || "New Organization";
  const slugBase = displayName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "") || `org-${userId.slice(0, 6)}`;

  const organization = await prisma.organization.create({
    data: {
      name: displayName,
      slug: `${slugBase}-${userId.slice(0, 4)}`,
    },
  });

  await prisma.membership.create({
    data: {
      userId,
      organizationId: organization.id,
      role: "OWNER",
    },
  });

  return prisma.membership.findMany({
    where: { userId },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });
}

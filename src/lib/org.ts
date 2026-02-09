import { cookies } from "next/headers";

import { getAuthSession } from "@/lib/auth";
import { ensureUserOrganization } from "@/lib/org-service";

const ACTIVE_ORG_COOKIE = "pb_active_org";

export type OrgContext = {
  session: Awaited<ReturnType<typeof getAuthSession>>;
  organizationId: string | null;
  role: string | null;
  memberships: Array<{
    organizationId: string;
    role: string;
    organization: { id: string; name: string; slug: string };
  }>;
  activeOrganization: { id: string; name: string; slug: string } | null;
  membershipCount: number;
  activeOrgCookie: string | null;
};

export async function getOrgContext(): Promise<OrgContext> {
  const session = await getAuthSession();
  const cookieStore = await cookies();
  const activeOrgCookie = cookieStore.get(ACTIVE_ORG_COOKIE)?.value ?? null;

  if (!session?.user?.id) {
    return {
      session,
      organizationId: null,
      role: null,
      memberships: [],
      activeOrganization: null,
      membershipCount: 0,
      activeOrgCookie,
    };
  }

  const memberships = await ensureUserOrganization(
    session.user.id,
    session.user.name ?? session.user.email ?? undefined
  );

  const activeMembership =
    memberships.find(
      (membership) => membership.organizationId === activeOrgCookie
    ) ?? memberships[0];

  return {
    session: {
      ...session,
      user: {
        ...session.user,
        organizationId: activeMembership?.organizationId ?? null,
        role: (activeMembership?.role ?? null) as typeof session.user.role,
      },
    },
    organizationId: activeMembership?.organizationId ?? null,
    role: activeMembership?.role ?? null,
    memberships: memberships.map((membership) => ({
      organizationId: membership.organizationId,
      role: membership.role,
      organization: membership.organization,
    })),
    activeOrganization: activeMembership?.organization ?? null,
    membershipCount: memberships.length,
    activeOrgCookie,
  };
}

export function getActiveOrgCookieName() {
  return ACTIVE_ORG_COOKIE;
}

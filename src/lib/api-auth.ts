import { NextResponse } from "next/server";

import { Role } from "@prisma/client";

import { hasPermission, type Permission } from "@/lib/permissions";
import { getOrgContext } from "@/lib/org";

export async function requireSession() {
  const context = await getOrgContext();
  const session = context.session;
  if (!session?.user?.id) {
    return {
      session: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!context.organizationId || !context.role) {
    return {
      session: null,
      response: NextResponse.json(
        { error: "Organization context missing" },
        { status: 403 }
      ),
    };
  }

  return {
    session: {
      ...session,
      user: {
        ...session.user,
        organizationId: context.organizationId,
        role: context.role as Role,
      },
    },
    response: null,
  };
}

export function requirePermission(role: Role, permission: Permission) {
  if (!hasPermission(role, permission)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

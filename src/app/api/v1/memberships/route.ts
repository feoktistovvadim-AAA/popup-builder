import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requirePermission, requireSession } from "@/lib/api-auth";

export async function GET() {
  const { session, response } = await requireSession();
  if (response) return response;

  const permissionError = requirePermission(session.user.role!, "manage_team");
  if (permissionError) return permissionError;

  const memberships = await prisma.membership.findMany({
    where: { organizationId: session.user.organizationId! },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ memberships });
}

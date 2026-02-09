import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requirePermission, requireSession } from "@/lib/api-auth";

const updateSchema = z.object({
  role: z.enum(["OWNER", "ADMIN", "EDITOR", "VIEWER"]).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ membershipId: string }> }
) {
  const { membershipId } = await params;
  const { session, response } = await requireSession();
  if (response) return response;

  const permissionError = requirePermission(session.user.role!, "manage_team");
  if (permissionError) return permissionError;

  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const membership = await prisma.membership.findFirst({
    where: {
      id: membershipId,
      organizationId: session.user.organizationId!,
    },
  });

  if (!membership) {
    return NextResponse.json({ error: "Membership not found" }, { status: 404 });
  }

  if (membership.role === "OWNER" && parsed.data.role !== "OWNER") {
    return NextResponse.json(
      { error: "Owner role cannot be downgraded" },
      { status: 400 }
    );
  }

  const updated = await prisma.membership.update({
    where: { id: membership.id },
    data: parsed.data,
  });

  return NextResponse.json({ membership: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ membershipId: string }> }
) {
  const { membershipId } = await params;
  const { session, response } = await requireSession();
  if (response) return response;

  const permissionError = requirePermission(session.user.role!, "manage_team");
  if (permissionError) return permissionError;

  const membership = await prisma.membership.findFirst({
    where: {
      id: membershipId,
      organizationId: session.user.organizationId!,
    },
  });

  if (!membership) {
    return NextResponse.json({ error: "Membership not found" }, { status: 404 });
  }

  if (membership.role === "OWNER") {
    return NextResponse.json(
      { error: "Owner membership cannot be removed" },
      { status: 400 }
    );
  }

  await prisma.membership.delete({ where: { id: membership.id } });

  return NextResponse.json({ ok: true });
}

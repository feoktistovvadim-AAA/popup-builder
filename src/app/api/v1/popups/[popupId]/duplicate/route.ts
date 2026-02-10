import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requirePermission, requireSession } from "@/lib/api-auth";
import { createDefaultSchema } from "@/lib/builder/schema";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ popupId: string }> }
) {
  const { popupId } = await params;
  const { session, response } = await requireSession();
  if (response) return response;

  const permissionError = requirePermission(session.user.role!, "edit_popups");
  if (permissionError) return permissionError;

  const existing = await prisma.popup.findFirst({
    where: {
      id: popupId,
      site: { organizationId: session.user.organizationId! },
    },
    include: {
      versions: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Popup not found" }, { status: 404 });
  }

  const sourceSchema = (existing.versions[0]?.schema ??
    createDefaultSchema()) as Prisma.InputJsonValue;

  const duplicated = await prisma.$transaction(async (tx) => {
    const popup = await tx.popup.create({
      data: {
        siteId: existing.siteId,
        name: `${existing.name} (copy)`,
        status: "DRAFT",
      },
    });

    await tx.popupVersion.create({
      data: {
        popupId: popup.id,
        version: 1,
        status: "DRAFT",
        schema: sourceSchema,
      },
    });

    return popup;
  });

  return NextResponse.json({ popupId: duplicated.id }, { status: 201 });
}

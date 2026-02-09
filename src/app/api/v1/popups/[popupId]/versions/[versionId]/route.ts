import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requirePermission, requireSession } from "@/lib/api-auth";
import { Prisma } from "@prisma/client";

const updateSchema = z.object({
  schema: z.unknown().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ popupId: string; versionId: string }> }
) {
  const { popupId, versionId } = await params;
  const { session, response } = await requireSession();
  if (response) return response;

  const version = await prisma.popupVersion.findFirst({
    where: {
      id: versionId,
      popupId,
      popup: { site: { organizationId: session.user.organizationId! } },
    },
  });

  if (!version) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  return NextResponse.json({ version });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ popupId: string; versionId: string }> }
) {
  const { popupId, versionId } = await params;
  const { session, response } = await requireSession();
  if (response) return response;

  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const existing = await prisma.popupVersion.findFirst({
    where: {
      id: versionId,
      popupId,
      popup: { site: { organizationId: session.user.organizationId! } },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  const permissionError = requirePermission(
    session.user.role!,
    parsed.data.status === "PUBLISHED" ? "publish_popups" : "edit_popups"
  );
  if (permissionError) return permissionError;

  const nextSchema = (parsed.data.schema ??
    existing.schema) as Prisma.InputJsonValue;

  if (parsed.data.status === "PUBLISHED") {
    await prisma.$transaction(async (tx) => {
      await tx.popupVersion.updateMany({
        where: { popupId },
        data: { status: "DRAFT" },
      });

      await tx.popup.update({
        where: { id: popupId },
        data: { status: "PUBLISHED" },
      });

      await tx.popupVersion.update({
        where: { id: versionId },
        data: {
          status: "PUBLISHED",
          publishedAt: new Date(),
          schema: nextSchema,
        },
      });
    });
  } else {
    await prisma.popupVersion.update({
      where: { id: versionId },
      data: {
        schema: nextSchema,
        status: parsed.data.status,
      },
    });
  }

  return NextResponse.json({ ok: true });
}

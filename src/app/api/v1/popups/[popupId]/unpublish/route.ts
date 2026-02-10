import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requirePermission, requireSession } from "@/lib/api-auth";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ popupId: string }> }
) {
  const { popupId } = await params;
  const { session, response } = await requireSession();
  if (response) return response;

  const permissionError = requirePermission(
    session.user.role!,
    "publish_popups"
  );
  if (permissionError) return permissionError;

  const existing = await prisma.popup.findFirst({
    where: {
      id: popupId,
      site: { organizationId: session.user.organizationId! },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Popup not found" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.popup.update({
      where: { id: popupId },
      data: { status: "DRAFT" },
    });

    await tx.popupVersion.updateMany({
      where: { popupId, status: "PUBLISHED" },
      data: { status: "DRAFT", publishedAt: null },
    });
  });

  return NextResponse.json({ ok: true });
}

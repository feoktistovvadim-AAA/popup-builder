import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requirePermission, requireSession } from "@/lib/api-auth";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ popupId: string }> }
) {
  const { popupId } = await params;
  const { session, response } = await requireSession();
  if (response) return response;

  const popup = await prisma.popup.findFirst({
    where: {
      id: popupId,
      site: { organizationId: session.user.organizationId! },
    },
    include: {
      site: true,
      versions: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!popup) {
    return NextResponse.json({ error: "Popup not found" }, { status: 404 });
  }

  return NextResponse.json({ popup });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ popupId: string }> }
) {
  const { popupId } = await params;
  const { session, response } = await requireSession();
  if (response) return response;

  const permissionError = requirePermission(session.user.role!, "edit_popups");
  if (permissionError) return permissionError;

  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const existing = await prisma.popup.findFirst({
    where: {
      id: popupId,
      site: { organizationId: session.user.organizationId! },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Popup not found" }, { status: 404 });
  }

  const popup = await prisma.popup.update({
    where: { id: popupId },
    data: parsed.data,
  });

  return NextResponse.json({ popup });
}

export async function DELETE(
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
  });

  if (!existing) {
    return NextResponse.json({ error: "Popup not found" }, { status: 404 });
  }

  await prisma.popup.delete({ where: { id: popupId } });

  return NextResponse.json({ ok: true });
}

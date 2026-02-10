import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requirePermission, requireSession } from "@/lib/api-auth";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ presetId: string }> }
) {
  const { presetId } = await params;
  const { session, response } = await requireSession();
  if (response) return response;

  const permissionError = requirePermission(session.user.role!, "edit_popups");
  if (permissionError) return permissionError;

  const preset = await prisma.popupPreset.findFirst({
    where: {
      id: presetId,
      organizationId: session.user.organizationId!,
    },
  });

  if (!preset) {
    return NextResponse.json({ error: "Preset not found" }, { status: 404 });
  }

  await prisma.popupPreset.delete({ where: { id: preset.id } });

  return NextResponse.json({ ok: true });
}

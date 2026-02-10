import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requirePermission, requireSession } from "@/lib/api-auth";

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  popupId: z.string().optional(),
  popupVersionId: z.string().optional(),
});

export async function GET() {
  const { session, response } = await requireSession();
  if (response) return response;

  const presets = await prisma.popupPreset.findMany({
    where: { organizationId: session.user.organizationId! },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ presets });
}

export async function POST(request: Request) {
  const { session, response } = await requireSession();
  if (response) return response;

  const permissionError = requirePermission(session.user.role!, "edit_popups");
  if (permissionError) return permissionError;

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { popupId, popupVersionId } = parsed.data;
  if (!popupId && !popupVersionId) {
    return NextResponse.json(
      { error: "popupId or popupVersionId is required" },
      { status: 400 }
    );
  }

  if (popupId && popupVersionId) {
    return NextResponse.json(
      { error: "Provide only popupId or popupVersionId" },
      { status: 400 }
    );
  }

  let schemaJson: Prisma.InputJsonValue | null = null;

  if (popupVersionId) {
    const version = await prisma.popupVersion.findFirst({
      where: {
        id: popupVersionId,
        popup: { site: { organizationId: session.user.organizationId! } },
      },
    });
    if (!version) {
      return NextResponse.json({ error: "Popup version not found" }, { status: 404 });
    }
    schemaJson = version.schema as Prisma.InputJsonValue;
  }

  if (popupId) {
    const popup = await prisma.popup.findFirst({
      where: {
        id: popupId,
        site: { organizationId: session.user.organizationId! },
      },
      include: {
        versions: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
    if (!popup || popup.versions.length === 0) {
      return NextResponse.json({ error: "Popup version not found" }, { status: 404 });
    }
    schemaJson = popup.versions[0].schema as Prisma.InputJsonValue;
  }

  const preset = await prisma.popupPreset.create({
    data: {
      organizationId: session.user.organizationId!,
      name: parsed.data.name,
      description: parsed.data.description,
      schemaJson: schemaJson ?? {},
      createdByUserId: session.user.id,
    },
  });

  return NextResponse.json({ preset }, { status: 201 });
}

import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requirePermission, requireSession } from "@/lib/api-auth";
import { createDefaultSchema } from "@/lib/builder/schema";
import { Prisma } from "@prisma/client";

const createSchema = z.object({
  schema: z.unknown().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ popupId: string }> }
) {
  const { popupId } = await params;
  const { session, response } = await requireSession();
  if (response) return response;

  const versions = await prisma.popupVersion.findMany({
    where: {
      popupId,
      popup: { site: { organizationId: session.user.organizationId! } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ versions });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ popupId: string }> }
) {
  const { popupId } = await params;
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

  const popup = await prisma.popup.findFirst({
    where: {
      id: popupId,
      site: { organizationId: session.user.organizationId! },
    },
    include: { versions: true },
  });

  if (!popup) {
    return NextResponse.json({ error: "Popup not found" }, { status: 404 });
  }

  const nextVersion =
    popup.versions.reduce((max, version) => Math.max(max, version.version), 0) +
    1;

  const schema =
    (parsed.data.schema ?? createDefaultSchema()) as Prisma.InputJsonValue;

  const version = await prisma.popupVersion.create({
    data: {
      popupId: popup.id,
      version: nextVersion,
      schema,
    },
  });

  return NextResponse.json({ version }, { status: 201 });
}

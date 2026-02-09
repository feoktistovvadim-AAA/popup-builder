import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requirePermission, requireSession } from "@/lib/api-auth";
import { createDefaultSchema } from "@/lib/builder/schema";
import { Prisma } from "@prisma/client";

const createSchema = z.object({
  siteId: z.string().min(1),
  name: z.string().min(1),
  preset: z
    .enum(["welcome", "vip", "deposit_failed", "responsible_gaming"])
    .optional(),
});

export async function GET() {
  const { session, response } = await requireSession();
  if (response) return response;

  const popups = await prisma.popup.findMany({
    where: {
      site: { organizationId: session.user.organizationId! },
    },
    include: {
      site: true,
      versions: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ popups });
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

  const site = await prisma.site.findFirst({
    where: {
      id: parsed.data.siteId,
      organizationId: session.user.organizationId!,
    },
  });

  if (!site) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

  const schema = createDefaultSchema(
    parsed.data.preset ?? "welcome"
  ) as Prisma.InputJsonValue;

  const popup = await prisma.$transaction(async (tx) => {
    const created = await tx.popup.create({
      data: {
        name: parsed.data.name,
        siteId: site.id,
      },
    });

    await tx.popupVersion.create({
      data: {
        popupId: created.id,
        version: 1,
        schema,
      },
    });

    return created;
  });

  return NextResponse.json({ popup }, { status: 201 });
}

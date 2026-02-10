import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requirePermission, requireSession } from "@/lib/api-auth";
import { createEmptySchema, type PopupSchemaV2 } from "@/lib/builder/schema";

const createSchema = z.object({
  siteId: z.string().min(1),
  name: z.string().min(1),
  presetId: z.string().min(1),
  importDesign: z.boolean().optional(),
  importTriggers: z.boolean().optional(),
  importTargeting: z.boolean().optional(),
  importFrequency: z.boolean().optional(),
});

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

  const preset = await prisma.popupPreset.findFirst({
    where: {
      id: parsed.data.presetId,
      organizationId: session.user.organizationId!,
    },
  });

  if (!preset) {
    return NextResponse.json({ error: "Preset not found" }, { status: 404 });
  }

  const presetSchema = preset.schemaJson as PopupSchemaV2;
  const baseSchema = createEmptySchema();
  const schema: PopupSchemaV2 = {
    ...baseSchema,
    schemaVersion: presetSchema?.schemaVersion ?? baseSchema.schemaVersion,
  };

  const importDesign = parsed.data.importDesign ?? true;
  const importTriggers = parsed.data.importTriggers ?? false;
  const importTargeting = parsed.data.importTargeting ?? false;
  const importFrequency = parsed.data.importFrequency ?? false;

  if (importDesign) {
    schema.blocks = presetSchema?.blocks ?? schema.blocks;
    schema.template = presetSchema?.template ?? schema.template;
  }
  if (importTriggers) {
    schema.triggers = presetSchema?.triggers ?? schema.triggers;
    schema.triggersMode = presetSchema?.triggersMode ?? schema.triggersMode;
  }
  if (importTargeting) {
    schema.targeting = presetSchema?.targeting ?? schema.targeting;
  }
  if (importFrequency) {
    schema.frequency = presetSchema?.frequency ?? schema.frequency;
  }

  const created = await prisma.$transaction(async (tx) => {
    const popup = await tx.popup.create({
      data: {
        name: parsed.data.name,
        siteId: site.id,
      },
    });

    await tx.popupVersion.create({
      data: {
        popupId: popup.id,
        version: 1,
        schema: schema as Prisma.InputJsonValue,
      },
    });

    return popup;
  });

  return NextResponse.json({ popupId: created.id }, { status: 201 });
}

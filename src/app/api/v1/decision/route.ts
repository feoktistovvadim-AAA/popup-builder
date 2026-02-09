import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const decisionSchema = z.object({
  siteId: z.string().min(1),
  userContext: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  const parsed = decisionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const popups = await prisma.popup.findMany({
    where: {
      siteId: parsed.data.siteId,
      status: "PUBLISHED",
    },
    include: {
      versions: {
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        take: 1,
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const decisions = popups
    .map((popup) => {
      const version = popup.versions[0];
      if (!version) return null;
      return {
        popupId: popup.id,
        versionId: version.id,
        schema: version.schema,
      };
    })
    .filter(Boolean);

  return NextResponse.json({ popups: decisions });
}

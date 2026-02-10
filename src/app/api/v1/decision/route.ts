import { NextResponse } from "next/server";
import { z } from "zod";
import { handleOptions, withCors } from "@/lib/cors";

import { prisma } from "@/lib/prisma";

const decisionSchema = z.object({
  siteId: z.string().min(1),
  userContext: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  const parsed = decisionSchema.safeParse(await request.json());
  if (!parsed.success) {
    return withCors(NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 }
    ));
  }

  try {
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

    const response = NextResponse.json({ popups: decisions });
    return withCors(response);
  } catch (error) {
    console.error("Decision error:", error);
    return withCors(NextResponse.json({ error: "Internal Server Error" }, { status: 500 }));
  }
}

export async function OPTIONS() {
  return handleOptions();
}

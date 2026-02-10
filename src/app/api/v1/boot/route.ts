import { NextResponse } from "next/server";
import { z } from "zod";

import { handleOptions, withCors } from "@/lib/cors";
import { prisma } from "@/lib/prisma";

const querySchema = z.object({
  siteId: z.string().min(1),
});

export async function OPTIONS() {
  return handleOptions();
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    siteId: url.searchParams.get("siteId"),
  });

  if (!parsed.success) {
    return withCors(NextResponse.json(
      { error: "Invalid request", issues: parsed.error.flatten() },
      { status: 400 }
    ));
  }

  const site = await prisma.site.findUnique({
    where: { id: parsed.data.siteId },
    include: {
      popups: {
        where: { status: "PUBLISHED" },
        include: {
          versions: {
            where: { status: "PUBLISHED" },
            orderBy: { publishedAt: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  if (!site) {
    return withCors(NextResponse.json(
      { error: "Site not found" },
      { status: 404 }
    ));
  }

  const popups = site.popups
    .map((popup) => {
      const version = popup.versions[0];
      if (!version) return null;
      return {
        id: popup.id,
        versionId: version.id,
        status: "active",
        rules: version.schema,
      };
    })
    .filter(Boolean);

  return withCors(NextResponse.json(
    {
      siteId: site.id,
      popups,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    }
  ));
}

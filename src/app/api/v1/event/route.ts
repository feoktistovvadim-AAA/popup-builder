import { NextResponse } from "next/server";
import { z } from "zod";
import { handleOptions, withCors } from "@/lib/cors";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const eventSchema = z.object({
  siteId: z.string().min(1),
  popupId: z.string().min(1),
  type: z.string().min(1),
  data: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  const parsed = eventSchema.safeParse(await request.json());
  if (!parsed.success) {
    return withCors(NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 }
    ));
  }

  try {
    await prisma.popupEvent.create({
      data: {
        siteId: parsed.data.siteId,
        popupId: parsed.data.popupId,
        type: parsed.data.type,
        data: (parsed.data.data ?? {}) as Prisma.InputJsonValue,
      },
    });

    const response = NextResponse.json({ ok: true });
    return withCors(response);
  } catch (error) {
    console.error("Event error:", error);
    return withCors(NextResponse.json({ error: "Internal Server Error" }, { status: 500 }));
  }
}

export async function OPTIONS() {
  return handleOptions();
}

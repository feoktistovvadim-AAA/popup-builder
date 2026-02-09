import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requirePermission, requireSession } from "@/lib/api-auth";

const createSchema = z.object({
  name: z.string().min(1),
  domain: z.string().min(3),
});

export async function GET() {
  const { session, response } = await requireSession();
  if (response) return response;

  const sites = await prisma.site.findMany({
    where: { organizationId: session.user.organizationId! },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ sites });
}

export async function POST(request: Request) {
  const { session, response } = await requireSession();
  if (response) return response;

  const permissionError = requirePermission(session.user.role!, "org_settings");
  if (permissionError) return permissionError;

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const site = await prisma.site.create({
    data: {
      name: parsed.data.name,
      domain: parsed.data.domain,
      organizationId: session.user.organizationId!,
    },
  });

  return NextResponse.json({ site }, { status: 201 });
}

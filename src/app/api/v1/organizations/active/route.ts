import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";

import { getOrgContext, getActiveOrgCookieName } from "@/lib/org";

const schema = z.object({
  organizationId: z.string().min(1),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const context = await getOrgContext();
  if (!context.session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const belongsToUser = context.memberships.some(
    (membership) => membership.organizationId === parsed.data.organizationId
  );

  if (!belongsToUser) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const cookieStore = await cookies();
  cookieStore.set(getActiveOrgCookieName(), parsed.data.organizationId, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
  });

  return NextResponse.json({ ok: true });
}

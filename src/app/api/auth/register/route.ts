import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email(),
  password: z.string().min(8),
  organizationName: z.string().min(1).optional(),
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function createUniqueSlug(base: string) {
  let slug = slugify(base);
  if (!slug) {
    slug = `org-${nanoid(6).toLowerCase()}`;
  }
  const existing = await prisma.organization.findUnique({ where: { slug } });
  if (!existing) return slug;
  return `${slug}-${nanoid(6).toLowerCase()}`;
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { email, password, name, organizationName } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "User already exists" },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const orgName =
    organizationName ?? `${name ?? email.split("@")[0]}'s Organization`;
  const slug = await createUniqueSlug(orgName);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
    });

    const organization = await tx.organization.create({
      data: {
        name: orgName,
        slug,
      },
    });

    await tx.membership.create({
      data: {
        role: "OWNER",
        userId: user.id,
        organizationId: organization.id,
      },
    });

    return { user, organization };
  });

  return NextResponse.json(
    { userId: result.user.id, organizationId: result.organization.id },
    { status: 201 }
  );
}

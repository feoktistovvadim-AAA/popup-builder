import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  const popups = await prisma.popup.findMany();
  return NextResponse.json(popups);
}

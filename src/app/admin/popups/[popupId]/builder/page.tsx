import { notFound } from "next/navigation";

import PopupBuilder from "@/components/builder/PopupBuilder";
import { getOrgContext } from "@/lib/org";
import { createDefaultSchema } from "@/lib/builder/schema";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export default async function PopupBuilderPage({
  params,
}: {
  params: { popupId: string };
}) {
  const context = await getOrgContext();
  const organizationId = context.organizationId;

  if (!organizationId) {
    notFound();
  }

  const popup = await prisma.popup.findFirst({
    where: {
      id: params.popupId,
      site: { organizationId },
    },
    include: {
      site: true,
      versions: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!popup) {
    notFound();
  }

  let version = popup.versions[0];
  if (!version) {
    version = await prisma.popupVersion.create({
      data: {
        popupId: popup.id,
        version: 1,
        schema: createDefaultSchema() as Prisma.InputJsonValue,
      },
    });
  }

  return (
    <PopupBuilder
      popupId={popup.id}
      popupName={popup.name}
      versionId={version.id}
      initialSchema={version.schema}
    />
  );
}

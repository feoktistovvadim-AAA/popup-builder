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

  const popup = await prisma.popup.findUnique({
    where: {
      id: params.popupId,
    },
    include: {
      site: true,
    },
  });

  if (!popup || popup.site.organizationId !== organizationId) {
    notFound();
  }

  let version = await prisma.popupVersion.findFirst({
    where: { popupId: popup.id },
    orderBy: { version: "desc" },
  });

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
      popupStatus={popup.status}
      versionId={version.id}
      initialSchema={version.schema}
    />
  );
}

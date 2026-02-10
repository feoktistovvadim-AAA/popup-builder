-- CreateTable
CREATE TABLE "PopupPreset" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "schemaJson" JSONB NOT NULL,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PopupPreset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PopupPreset_organizationId_idx" ON "PopupPreset"("organizationId");

-- CreateIndex
CREATE INDEX "PopupPreset_createdByUserId_idx" ON "PopupPreset"("createdByUserId");

-- AddForeignKey
ALTER TABLE "PopupPreset" ADD CONSTRAINT "PopupPreset_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PopupPreset" ADD CONSTRAINT "PopupPreset_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

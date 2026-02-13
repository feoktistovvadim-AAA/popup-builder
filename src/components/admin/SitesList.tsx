"use client";

import { useState } from "react";

import InstallCodeModal from "@/components/admin/InstallCodeModal";

type SiteInfo = {
  id: string;
  name: string;
  domain: string;
};

export default function SitesList({
  sites,
  baseUrl,
}: {
  sites: SiteInfo[];
  baseUrl: string;
}) {
  const [activeSite, setActiveSite] = useState<SiteInfo | null>(null);

  return (
    <>
      <div className="mt-4 space-y-3">
        {sites.map((site) => (
          <div
            key={site.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded border border-black/10 px-4 py-3 text-sm dark:border-white/10"
          >
            <div>
              <div className="font-medium text-black dark:text-white">
                {site.name}
              </div>
              <div className="text-black/60 dark:text-white/60">
                {site.domain}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded bg-black/5 px-3 py-1 text-xs text-black/70 dark:bg-white/10 dark:text-white/70">
                Site ID: {site.id}
              </div>
              <button
                className="rounded border border-black/10 px-3 py-1 text-xs text-black/80 hover:bg-black/[.04] dark:border-white/10 dark:text-white/80 dark:hover:bg-white/[.08]"
                type="button"
                onClick={() => setActiveSite(site)}
              >
                Код установки
              </button>
            </div>
          </div>
        ))}
      </div>

      {activeSite ? (
        <InstallCodeModal
          site={activeSite}
          baseUrl={baseUrl}
          onClose={() => setActiveSite(null)}
        />
      ) : null}
    </>
  );
}

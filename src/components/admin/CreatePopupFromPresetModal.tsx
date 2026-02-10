"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type SiteOption = {
  id: string;
  name: string;
  domain: string;
};

type Preset = {
  id: string;
  name: string;
  description: string | null;
};

export default function CreatePopupFromPresetModal({
  sites,
}: {
  sites: SiteOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [siteId, setSiteId] = useState(sites[0]?.id ?? "");
  const [name, setName] = useState("");
  const [presetId, setPresetId] = useState("");
  const [importDesign, setImportDesign] = useState(true);
  const [importTriggers, setImportTriggers] = useState(false);
  const [importTargeting, setImportTargeting] = useState(false);
  const [importFrequency, setImportFrequency] = useState(false);

  const openModal = () => {
    setOpen(true);
    setLoading(true);
    setError(null);
    fetch("/api/v1/presets")
      .then((res) => res.json())
      .then((data) => {
        setPresets(data.presets ?? []);
        setPresetId(data.presets?.[0]?.id ?? "");
      })
      .catch(() => {
        setError("Failed to load presets.");
      })
      .finally(() => setLoading(false));
  };

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    const response = await fetch("/api/v1/popups/from-preset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        siteId,
        name,
        presetId,
        importDesign,
        importTriggers,
        importTargeting,
        importFrequency,
      }),
    });

    setLoading(false);

    if (!response.ok) {
      const data = await response.json();
      setError(data?.error ?? "Failed to create popup.");
      return;
    }

    const data = await response.json();
    setOpen(false);
    router.push(`/admin/popups/${data.popupId}/builder`);
  };

  return (
    <>
      <button
        className="rounded border border-black/10 px-4 py-2 text-sm text-black/80 hover:bg-black/[.04] dark:border-white/10 dark:text-white/80 dark:hover:bg-white/[.08]"
        type="button"
        onClick={openModal}
      >
        From preset
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-xl rounded-xl border border-black/10 bg-white p-6 shadow-lg dark:border-white/10 dark:bg-black">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-black dark:text-white">
                  Create popup from preset
                </h2>
                <p className="mt-1 text-sm text-black/60 dark:text-white/60">
                  Select a preset and choose what to import.
                </p>
              </div>
              <button
                className="rounded p-1 text-black/60 hover:bg-black/[.04] dark:text-white/60 dark:hover:bg-white/[.08]"
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-black/70 dark:text-white/70">
                  Popup name
                </label>
                <input
                  className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-black outline-none focus:border-black/40 dark:border-white/10 dark:bg-black dark:text-white"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Preset-based popup"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-black/70 dark:text-white/70">
                  Site
                </label>
                <select
                  className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-black outline-none focus:border-black/40 dark:border-white/10 dark:bg-black dark:text-white"
                  value={siteId}
                  onChange={(event) => setSiteId(event.target.value)}
                >
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name} ({site.domain})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="text-xs font-medium text-black/70 dark:text-white/70">
                Preset
              </label>
              <select
                className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-black outline-none focus:border-black/40 dark:border-white/10 dark:bg-black dark:text-white"
                value={presetId}
                onChange={(event) => setPresetId(event.target.value)}
                disabled={loading || presets.length === 0}
              >
                {presets.length === 0 ? (
                  <option value="">No presets available</option>
                ) : (
                  presets.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="mt-4 space-y-2 text-sm text-black/70 dark:text-white/70">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={importDesign}
                  onChange={(event) => setImportDesign(event.target.checked)}
                />
                Import design (blocks + layout)
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={importTriggers}
                  onChange={(event) => setImportTriggers(event.target.checked)}
                />
                Import triggers
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={importTargeting}
                  onChange={(event) => setImportTargeting(event.target.checked)}
                />
                Import targeting
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={importFrequency}
                  onChange={(event) => setImportFrequency(event.target.checked)}
                />
                Import frequency
              </label>
            </div>

            {error ? (
              <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            ) : null}

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                className="rounded border border-black/10 px-4 py-2 text-sm text-black/80 hover:bg-black/[.04] dark:border-white/10 dark:text-white/80 dark:hover:bg-white/[.08]"
                type="button"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-white/90"
                type="button"
                disabled={loading || !presetId || !siteId || !name}
                onClick={handleCreate}
              >
                {loading ? "Creating..." : "Create popup"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

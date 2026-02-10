"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type SiteOption = {
  id: string;
  name: string;
  domain: string;
};

export default function CreatePopupForm({ sites }: { sites: SiteOption[] }) {
  const router = useRouter();
  const [siteId, setSiteId] = useState(sites[0]?.id ?? "");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const payload = { siteId, name };
    console.log("[create-popup] sending", payload);

    const response = await fetch("/api/v1/popups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (!response.ok) {
      const data = await response.json();
      setError(data?.error ?? "Failed to create popup.");
      return;
    }

    setName("");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-black/70 dark:text-white/70">
            Popup name
          </label>
          <input
            className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-base text-black outline-none focus:border-black/40 dark:border-white/10 dark:bg-black dark:text-white md:text-sm"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Welcome Bonus"
            required
          />
        </div>
        <div>
          <label className="text-xs font-medium text-black/70 dark:text-white/70">
            Site
          </label>
          <select
            className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-base text-black outline-none focus:border-black/40 dark:border-white/10 dark:bg-black dark:text-white md:text-sm"
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
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}
      <button
        className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-white/90"
        type="submit"
        disabled={loading || !siteId}
      >
        {loading ? "Creating..." : "Create popup"}
      </button>
    </form>
  );
}

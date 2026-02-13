"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateSiteForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/v1/sites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, domain }),
    });

    setLoading(false);

    if (!response.ok) {
      const data = await response.json();
      setError(data?.error ?? "Не удалось создать сайт.");
      return;
    }

    setName("");
    setDomain("");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-black/70 dark:text-white/70">
            Название сайта
          </label>
          <input
            className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-black outline-none focus:border-black/40 dark:border-white/10 dark:bg-black dark:text-white"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Astifeeva Casino"
            required
          />
        </div>
        <div>
          <label className="text-xs font-medium text-black/70 dark:text-white/70">
            Домен
          </label>
          <input
            className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-black outline-none focus:border-black/40 dark:border-white/10 dark:bg-black dark:text-white"
            value={domain}
            onChange={(event) => setDomain(event.target.value)}
            placeholder="astifeeva.ru"
            required
          />
        </div>
      </div>
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}
      <button
        className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-white/90"
        type="submit"
        disabled={loading}
      >
        {loading ? "Создание..." : "Создать сайт"}
      </button>
    </form>
  );
}

"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";

type SiteInfo = {
  id: string;
  name: string;
  domain: string;
};

type InstallCodeModalProps = {
  site: SiteInfo;
  baseUrl: string;
  onClose: () => void;
};

export default function InstallCodeModal({
  site,
  baseUrl,
  onClose,
}: InstallCodeModalProps) {
  const [activeTab, setActiveTab] = useState<"direct" | "gtm">("direct");
  const [copied, setCopied] = useState(false);
  const showWarning = !baseUrl && process.env.NODE_ENV !== "development";

  const scriptBase = baseUrl.replace(/\/$/, "");
  const scriptSrc = scriptBase ? `${scriptBase}/pb.js` : "/pb.js";

  const snippets = useMemo(() => {
    const direct = [
      "<script>",
      `  window.pbSettings = { siteId: "${site.id}", apiBase: "${scriptBase}" };`,
      "</script>",
      `<script async src="${scriptSrc}"></script>`,
    ].join("\n");

    const gtm = [
      "<script>",
      "  (function () {",
      `    window.pbSettings = { siteId: "${site.id}", apiBase: "${scriptBase}" };`,
      "    var s = document.createElement('script');",
      `    s.src = '${scriptSrc}';`,
      "    s.async = true;",
      "    document.head.appendChild(s);",
      "  })();",
      "</script>",
    ].join("\n");

    return { direct, gtm };
  }, [site.id, scriptSrc]);

  const handleCopy = async () => {
    const value = activeTab === "direct" ? snippets.direct : snippets.gtm;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-2xl rounded-xl border border-black/10 bg-white p-6 shadow-lg dark:border-white/10 dark:bg-black">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-black dark:text-white">
              Installation code
            </h2>
            <p className="mt-1 text-sm text-black/60 dark:text-white/60">
              {site.name} · {site.domain}
            </p>
          </div>
          <button
            className="rounded p-1 text-black/60 hover:bg-black/[.04] dark:text-white/60 dark:hover:bg-white/[.08]"
            type="button"
            onClick={onClose}
            aria-label="Close modal"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
              <path
                d="M6 6l12 12M6 18L18 6"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </button>
        </div>

        {showWarning ? (
          <div className="mt-4 rounded border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-900">
            Widget origin is not configured. Set NEXT_PUBLIC_WIDGET_ORIGIN on
            Vercel.
          </div>
        ) : null}

        <div className="mt-6 flex gap-2 text-sm">
          <button
            className={clsx(
              "rounded px-3 py-1.5",
              activeTab === "direct"
                ? "bg-black text-white dark:bg-white dark:text-black"
                : "border border-black/10 text-black/70 dark:border-white/10 dark:text-white/70"
            )}
            type="button"
            onClick={() => setActiveTab("direct")}
          >
            Direct embed
          </button>
          <button
            className={clsx(
              "rounded px-3 py-1.5",
              activeTab === "gtm"
                ? "bg-black text-white dark:bg-white dark:text-black"
                : "border border-black/10 text-black/70 dark:border-white/10 dark:text-white/70"
            )}
            type="button"
            onClick={() => setActiveTab("gtm")}
          >
            Google Tag Manager
          </button>
        </div>

        <div className="mt-4 rounded-lg border border-black/10 bg-black/5 p-4 text-xs text-black/80 dark:border-white/10 dark:bg-white/10 dark:text-white/80">
          <pre className="whitespace-pre-wrap">
            {activeTab === "direct" ? snippets.direct : snippets.gtm}
          </pre>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-black/60 dark:text-white/60">
          <span>
            Paste in the site <code>&lt;head&gt;</code> or GTM Custom HTML tag.
          </span>
          <button
            className="rounded border border-black/10 px-3 py-1 text-xs text-black/80 hover:bg-black/[.04] dark:border-white/10 dark:text-white/80 dark:hover:bg-white/[.08]"
            type="button"
            onClick={handleCopy}
            disabled={showWarning}
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}

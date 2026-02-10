"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type PopupListItem = {
  id: string;
  name: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  site: {
    name: string;
    domain: string;
  };
  versions: Array<{
    version: number;
  }>;
};

type ConfirmAction = "archive" | "delete";

export default function PopupList({ popups }: { popups: PopupListItem[] }) {
  const router = useRouter();
  const [showArchived, setShowArchived] = useState(false);
  const [loadingPopupId, setLoadingPopupId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [confirmPopup, setConfirmPopup] = useState<PopupListItem | null>(null);

  const visiblePopups = useMemo(
    () =>
      showArchived
        ? popups
        : popups.filter((popup) => popup.status !== "ARCHIVED"),
    [popups, showArchived]
  );

  const runAction = async (
    popup: PopupListItem,
    action: "duplicate" | "unpublish" | "archive" | "delete"
  ) => {
    setError(null);
    setLoadingPopupId(popup.id);

    try {
      const endpointMap = {
        duplicate: `/api/v1/popups/${popup.id}/duplicate`,
        unpublish: `/api/v1/popups/${popup.id}/unpublish`,
        archive: `/api/v1/popups/${popup.id}/archive`,
        delete: `/api/v1/popups/${popup.id}`,
      };

      const methodMap = {
        duplicate: "POST",
        unpublish: "POST",
        archive: "POST",
        delete: "DELETE",
      };

      const response = await fetch(endpointMap[action], {
        method: methodMap[action],
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Action failed.");
      }

      if (action === "duplicate") {
        const data = await response.json();
        router.push(`/admin/popups/${data.popupId}/builder`);
        return;
      }

      router.refresh();
    } catch (actionError) {
      setError(
        actionError instanceof Error ? actionError.message : "Action failed."
      );
    } finally {
      setLoadingPopupId(null);
      setConfirmAction(null);
      setConfirmPopup(null);
    }
  };

  const requestConfirm = (popup: PopupListItem, action: ConfirmAction) => {
    setConfirmPopup(popup);
    setConfirmAction(action);
  };

  return (
    <div className="mt-4 space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <label className="inline-flex items-center gap-2 text-xs text-black/70 dark:text-white/70">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(event) => setShowArchived(event.target.checked)}
          />
          Show archived
        </label>
      </div>

      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      {visiblePopups.length === 0 ? (
        <p className="text-sm text-black/60 dark:text-white/60">
          No popups yet. Create your first campaign.
        </p>
      ) : (
        visiblePopups.map((popup) => {
          const latestVersion = popup.versions[0];
          const isLoading = loadingPopupId === popup.id;

          return (
            <div
              key={popup.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded border border-black/10 px-4 py-3 dark:border-white/10"
            >
              <div>
                <div className="font-medium text-black dark:text-white">
                  {popup.name}
                </div>
                <div className="text-black/60 dark:text-white/60">
                  {popup.site.name} · {popup.site.domain}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-black/5 px-3 py-1 text-xs text-black/70 dark:bg-white/10 dark:text-white/70">
                  {popup.status}
                </span>
                {latestVersion ? (
                  <span className="rounded bg-black/5 px-3 py-1 text-xs text-black/70 dark:bg-white/10 dark:text-white/70">
                    v{latestVersion.version}
                  </span>
                ) : null}

                <details className="relative">
                  <summary className="list-none cursor-pointer rounded border border-black/10 px-2 py-1 text-xs text-black/70 hover:bg-black/[.04] dark:border-white/10 dark:text-white/70 dark:hover:bg-white/[.08]">
                    ...
                  </summary>
                  <div className="absolute right-0 z-10 mt-1 min-w-40 rounded-lg border border-black/10 bg-white p-1 shadow-lg dark:border-white/10 dark:bg-black">
                    <Link
                      className="block rounded px-2 py-1.5 text-xs text-black/80 hover:bg-black/[.04] dark:text-white/80 dark:hover:bg-white/[.08]"
                      href={`/admin/popups/${popup.id}/builder`}
                    >
                      Open builder
                    </Link>
                    <button
                      className="block w-full rounded px-2 py-1.5 text-left text-xs text-black/80 hover:bg-black/[.04] disabled:opacity-50 dark:text-white/80 dark:hover:bg-white/[.08]"
                      type="button"
                      disabled={isLoading}
                      onClick={() => runAction(popup, "duplicate")}
                    >
                      Duplicate
                    </button>
                    <button
                      className="block w-full rounded px-2 py-1.5 text-left text-xs text-black/80 hover:bg-black/[.04] disabled:opacity-50 dark:text-white/80 dark:hover:bg-white/[.08]"
                      type="button"
                      disabled={isLoading || popup.status !== "PUBLISHED"}
                      onClick={() => runAction(popup, "unpublish")}
                    >
                      Unpublish
                    </button>
                    <button
                      className="block w-full rounded px-2 py-1.5 text-left text-xs text-black/80 hover:bg-black/[.04] disabled:opacity-50 dark:text-white/80 dark:hover:bg-white/[.08]"
                      type="button"
                      disabled={isLoading || popup.status === "ARCHIVED"}
                      onClick={() => requestConfirm(popup, "archive")}
                    >
                      Archive
                    </button>
                    <button
                      className="block w-full rounded px-2 py-1.5 text-left text-xs text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/30"
                      type="button"
                      disabled={isLoading}
                      onClick={() => requestConfirm(popup, "delete")}
                    >
                      Delete
                    </button>
                  </div>
                </details>
              </div>
            </div>
          );
        })
      )}

      {confirmAction && confirmPopup ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-xl border border-black/10 bg-white p-6 shadow-lg dark:border-white/10 dark:bg-black">
            <h3 className="text-lg font-semibold text-black dark:text-white">
              {confirmAction === "archive" ? "Archive popup?" : "Delete popup?"}
            </h3>
            <p className="mt-2 text-sm text-black/70 dark:text-white/70">
              {confirmAction === "archive"
                ? `This will hide "${confirmPopup.name}" from the default list.`
                : `This will permanently delete "${confirmPopup.name}" and its versions.`}
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                className="rounded border border-black/10 px-4 py-2 text-sm text-black/80 hover:bg-black/[.04] dark:border-white/10 dark:text-white/80 dark:hover:bg-white/[.08]"
                type="button"
                onClick={() => {
                  setConfirmAction(null);
                  setConfirmPopup(null);
                }}
              >
                Cancel
              </button>
              <button
                className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-white/90"
                type="button"
                disabled={loadingPopupId === confirmPopup.id}
                onClick={() => runAction(confirmPopup, confirmAction)}
              >
                {loadingPopupId === confirmPopup.id
                  ? "Working..."
                  : confirmAction === "archive"
                    ? "Archive"
                    : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

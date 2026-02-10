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

export default function PopupList({ popups }: { popups: PopupListItem[] }) {
  const router = useRouter();
  const [showArchived, setShowArchived] = useState(false);
  const [loadingPopupId, setLoadingPopupId] = useState<string | null>(null);
  const [toastError, setToastError] = useState<string | null>(null);
  const [confirmArchive, setConfirmArchive] = useState(false);
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
    action: "duplicate" | "unpublish" | "archive"
  ) => {
    setToastError(null);
    setLoadingPopupId(popup.id);

    try {
      const endpointMap = {
        duplicate: `/api/v1/popups/${popup.id}/duplicate`,
        unpublish: `/api/v1/popups/${popup.id}/unpublish`,
        archive: `/api/v1/popups/${popup.id}/archive`,
      };

      const methodMap = {
        duplicate: "POST",
        unpublish: "POST",
        archive: "POST",
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
      setToastError(
        actionError instanceof Error ? actionError.message : "Action failed."
      );
    } finally {
      setLoadingPopupId(null);
      setConfirmArchive(false);
      setConfirmPopup(null);
    }
  };

  const requestArchiveConfirm = (popup: PopupListItem) => {
    setConfirmPopup(popup);
    setConfirmArchive(true);
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

                <Link
                  className="rounded bg-black px-3 py-1.5 text-xs font-medium text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                  href={`/admin/popups/${popup.id}/builder`}
                >
                  Open builder
                </Link>
                <button
                  className="rounded border border-black/10 px-3 py-1.5 text-xs text-black/80 hover:bg-black/[.04] disabled:opacity-50 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/[.08]"
                  type="button"
                  disabled={isLoading}
                  onClick={() => runAction(popup, "duplicate")}
                >
                  Duplicate
                </button>
                {popup.status === "PUBLISHED" ? (
                  <button
                    className="rounded border border-black/10 px-3 py-1.5 text-xs text-black/80 hover:bg-black/[.04] disabled:opacity-50 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/[.08]"
                    type="button"
                    disabled={isLoading}
                    onClick={() => runAction(popup, "unpublish")}
                  >
                    Unpublish
                  </button>
                ) : null}
                <button
                  className="rounded border border-black/10 px-3 py-1.5 text-xs text-black/80 hover:bg-black/[.04] disabled:opacity-50 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/[.08]"
                  type="button"
                  disabled={isLoading || popup.status === "ARCHIVED"}
                  onClick={() => requestArchiveConfirm(popup)}
                >
                  Archive
                </button>
              </div>
            </div>
          );
        })
      )}

      {confirmArchive && confirmPopup ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-xl border border-black/10 bg-white p-6 shadow-lg dark:border-white/10 dark:bg-black">
            <h3 className="text-lg font-semibold text-black dark:text-white">
              Archive popup?
            </h3>
            <p className="mt-2 text-sm text-black/70 dark:text-white/70">
              {`This will hide "${confirmPopup.name}" from the default list.`}
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                className="rounded border border-black/10 px-4 py-2 text-sm text-black/80 hover:bg-black/[.04] dark:border-white/10 dark:text-white/80 dark:hover:bg-white/[.08]"
                type="button"
                onClick={() => {
                  setConfirmArchive(false);
                  setConfirmPopup(null);
                }}
              >
                Cancel
              </button>
              <button
                className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-white/90"
                type="button"
                disabled={loadingPopupId === confirmPopup.id}
                onClick={() => runAction(confirmPopup, "archive")}
              >
                {loadingPopupId === confirmPopup.id
                  ? "Working..."
                  : "Archive"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toastError ? (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-red-600 px-4 py-2 text-sm text-white shadow-lg">
          {toastError}
        </div>
      ) : null}
    </div>
  );
}

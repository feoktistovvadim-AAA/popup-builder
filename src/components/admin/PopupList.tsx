"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
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

type PopupStats = {
  popupId: string;
  impressions: number;
  clicks: number;
  ctr: number;
  closes: number;
  closeRate: number;
};

type TimeRange = "24h" | "7d" | "30d" | "all";

export default function PopupList({ popups }: { popups: PopupListItem[] }) {
  const router = useRouter();
  const [showArchived, setShowArchived] = useState(false);
  const [loadingPopupId, setLoadingPopupId] = useState<string | null>(null);
  const [toastError, setToastError] = useState<string | null>(null);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [confirmPopup, setConfirmPopup] = useState<PopupListItem | null>(null);
  const [range, setRange] = useState<TimeRange>("7d");
  const [analyticsData, setAnalyticsData] = useState<PopupStats[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoadingAnalytics(true);
      try {
        const response = await fetch(`/api/v1/analytics/popups?range=${range}`);
        if (response.ok) {
          const data = await response.json();
          setAnalyticsData(data.popups || []);
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoadingAnalytics(false);
      }
    };
    fetchAnalytics();
  }, [range]);

  const visiblePopups = useMemo(
    () =>
      showArchived
        ? popups
        : popups.filter((popup) => popup.status !== "ARCHIVED"),
    [popups, showArchived]
  );

  const getPopupStats = (popupId: string): PopupStats | null => {
    return analyticsData.find((stats) => stats.popupId === popupId) || null;
  };

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
        actionError instanceof Error ? actionError.message : "Ошибка выполнения."
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
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <label className="inline-flex items-center gap-2 text-xs text-black/70 dark:text-white/70">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(event) => setShowArchived(event.target.checked)}
          />
          Показывать архивные
        </label>

        {/* Range Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-black/70 dark:text-white/70">Период:</span>
          <div className="flex rounded-lg border border-black/10 bg-white dark:border-white/10 dark:bg-black">
            {(["24h", "7d", "30d", "all"] as TimeRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1 text-xs font-medium transition-colors first:rounded-l-lg last:rounded-r-lg ${range === r
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
                  }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {visiblePopups.length === 0 ? (
        <p className="text-sm text-black/60 dark:text-white/60">
          Попапов пока нет. Создайте первую кампанию.
        </p>
      ) : (
        <div className="space-y-3">
          {visiblePopups.map((popup) => {
            const latestVersion = popup.versions[0];
            const isLoading = loadingPopupId === popup.id;
            const stats = getPopupStats(popup.id);

            return (
              <div
                key={popup.id}
                className="flex flex-col gap-3 rounded-lg border border-black/10 px-4 py-4 dark:border-white/10"
              >
                {/* Header Row */}
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <div className="font-medium text-black dark:text-white">
                      {popup.name}
                    </div>
                    <div className="text-sm text-black/60 dark:text-white/60">
                      {popup.site.name} · {popup.site.domain}
                    </div>
                  </div>
                  <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                    <span className="rounded bg-black/5 px-2.5 py-1 text-xs font-medium text-black/70 dark:bg-white/10 dark:text-white/70">
                      {popup.status}
                    </span>
                    {latestVersion ? (
                      <span className="rounded bg-black/5 px-2.5 py-1 text-xs font-medium text-black/70 dark:bg-white/10 dark:text-white/70">
                        v{latestVersion.version}
                      </span>
                    ) : null}

                    <div className="flex flex-1 items-center justify-end gap-2 sm:flex-none">
                      <Link
                        className="rounded-lg bg-black px-3 py-1.5 text-xs font-medium text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                        href={`/admin/popups/${popup.id}/builder`}
                      >
                        Конструктор
                      </Link>
                      <button
                        className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-medium text-black/80 hover:bg-black/[.04] disabled:opacity-50 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/[.08]"
                        type="button"
                        disabled={isLoading}
                        onClick={() => runAction(popup, "duplicate")}
                      >
                        Дублировать
                      </button>
                      {popup.status === "PUBLISHED" ? (
                        <button
                          className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-medium text-black/80 hover:bg-black/[.04] disabled:opacity-50 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/[.08]"
                          type="button"
                          disabled={isLoading}
                          onClick={() => runAction(popup, "unpublish")}
                        >
                          Снять с публикации
                        </button>
                      ) : null}
                      <button
                        className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-medium text-black/80 hover:bg-black/[.04] disabled:opacity-50 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/[.08]"
                        type="button"
                        disabled={isLoading || popup.status === "ARCHIVED"}
                        onClick={() => requestArchiveConfirm(popup)}
                      >
                        Архивировать
                      </button>
                    </div>
                  </div>
                </div>

                {/* Analytics Row */}
                {loadingAnalytics ? (
                  <div className="text-xs text-black/40 dark:text-white/40">
                    Загрузка аналитики...
                  </div>
                ) : stats ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                    <div>
                      <div className="text-xs text-black/60 dark:text-white/60">
                        Показы
                      </div>
                      <div className="text-sm font-medium text-black dark:text-white">
                        {stats.impressions.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-black/60 dark:text-white/60">
                        Клики
                      </div>
                      <div className="text-sm font-medium text-black dark:text-white">
                        {stats.clicks.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-black/60 dark:text-white/60">
                        CTR
                      </div>
                      <div className="text-sm font-medium text-black dark:text-white">
                        {stats.ctr.toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-black/60 dark:text-white/60">
                        Закрытия
                      </div>
                      <div className="text-sm font-medium text-black dark:text-white">
                        {stats.closes.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-black/60 dark:text-white/60">
                        % закрытий
                      </div>
                      <div className="text-sm font-medium text-black dark:text-white">
                        {stats.closeRate.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-black/40 dark:text-white/40">
                    Нет данных за этот период
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {confirmArchive && confirmPopup ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-xl border border-black/10 bg-white p-6 shadow-lg dark:border-white/10 dark:bg-black">
            <h3 className="text-lg font-semibold text-black dark:text-white">
              Архивировать попап?
            </h3>
            <p className="mt-2 text-sm text-black/70 dark:text-white/70">
              {`Это скроет "${confirmPopup.name}" из основного списка.`}
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
                  ? "Выполняется..."
                  : "Архивировать"}
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

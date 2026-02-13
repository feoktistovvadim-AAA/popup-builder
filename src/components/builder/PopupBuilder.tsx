"use client";

import { useMemo, useState } from "react";
import { nanoid } from "nanoid";
import clsx from "clsx";

import BlockList from "@/components/builder/BlockList";
import BlockPalette from "@/components/builder/BlockPalette";
import InspectorTabs from "@/components/builder/inspector/InspectorTabs";
import PreviewCanvas from "@/components/builder/PreviewCanvas";
import LanguageSelector from "@/components/builder/LanguageSelector";
import ManageLanguagesModal from "@/components/builder/ManageLanguagesModal";
import {
  BlockType,
  PopupBlock,
  PopupSchemaV2,
  createEmptySchema,
} from "@/lib/builder/schema";
import { DEFAULT_LOCALIZATION, getTranslatableFields } from "@/lib/builder/localization";

type PopupBuilderProps = {
  popupId: string;
  popupName: string;
  popupStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  versionId: string;
  initialSchema: unknown;
};

function createBlock(type: BlockType): PopupBlock {
  switch (type) {
    case "headline":
      return {
        id: nanoid(8),
        type,
        props: { text: "Headline", align: "center", color: "#ffffff" },
      };
    case "text":
      return {
        id: nanoid(8),
        type,
        props: {
          text: "Write supporting text for your popup.",
          align: "center",
          color: "#d1d5db",
        },
      };
    case "button":
      return {
        id: nanoid(8),
        type,
        props: {
          label: "Claim Bonus",
          url: "/cashier",
          backgroundColor: "#7c3aed",
          textColor: "#ffffff",
          borderRadius: 10,
        },
      };
    case "image":
      return {
        id: nanoid(8),
        type,
        props: {
          src: "",
          alt: "Popup image",
          borderRadius: 12,
          width: 100,
        },
      };
    case "spacer":
      return {
        id: nanoid(8),
        type,
        props: {
          height: 16,
        },
      };
    default:
      return {
        id: nanoid(8),
        type: "text",
        props: { text: "Block" },
      };
  }
}

const statusConfig = {
  DRAFT: { label: "Черновик", bg: "var(--status-draft-bg)", color: "var(--status-draft)" },
  PUBLISHED: { label: "Опубликован", bg: "var(--status-published-bg)", color: "var(--status-published)" },
  ARCHIVED: { label: "Архив", bg: "var(--status-archived-bg)", color: "var(--status-archived)" },
} as const;

export default function PopupBuilder({
  popupId,
  popupName,
  popupStatus,
  versionId,
  initialSchema,
}: PopupBuilderProps) {
  const hydratedSchema = useMemo(() => {
    if (
      initialSchema &&
      typeof initialSchema === "object" &&
      "schemaVersion" in (initialSchema as PopupSchemaV2)
    ) {
      return initialSchema as PopupSchemaV2;
    }
    return createEmptySchema();
  }, [initialSchema]);

  const [mobileTab, setMobileTab] = useState<"preview" | "add" | "edit">("preview");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");

  const [schema, setSchema] = useState<PopupSchemaV2>(hydratedSchema);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(
    hydratedSchema.blocks[0]?.id ?? null
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [presetDescription, setPresetDescription] = useState("");

  // Language state
  const [currentLang, setCurrentLang] = useState<string>(
    schema.localization?.baseLang || "en"
  );
  const [showManageLanguages, setShowManageLanguages] = useState(false);

  // Initialize localization if missing
  if (!schema.localization) {
    schema.localization = DEFAULT_LOCALIZATION;
  }
  const [presetSaving, setPresetSaving] = useState(false);

  // Get the selected block with translations applied for the current language
  const baseSelectedBlock = schema.blocks.find((block) => block.id === selectedBlockId) ?? null;
  const selectedBlock = (() => {
    if (!baseSelectedBlock) return null;
    const baseLang = schema.localization?.baseLang || "en";
    if (currentLang === baseLang) return baseSelectedBlock;
    // Merge translation overrides into the block props
    const blockTrans = schema.localization?.translations?.[currentLang]?.blocks?.[baseSelectedBlock.id];
    if (!blockTrans) return baseSelectedBlock;
    return {
      ...baseSelectedBlock,
      props: {
        ...baseSelectedBlock.props,
        ...blockTrans,
      },
    };
  })();

  const updateBlock = (id: string, nextProps: Record<string, unknown>) => {
    const baseLang = schema.localization?.baseLang || "en";

    // If editing base language, update the base schema
    if (currentLang === baseLang) {
      setSchema((prev) => ({
        ...prev,
        blocks: prev.blocks.map((block) =>
          block.id === id ? { ...block, props: nextProps } : block
        ),
      }));
    } else {
      // If editing non-base language, store only translatable fields as overrides
      setSchema((prev) => {
        const block = prev.blocks.find((b) => b.id === id);
        if (!block) return prev;

        const translatableFields = getTranslatableFields(block.type);
        const translationOverrides: Record<string, unknown> = {};

        // Extract only translatable fields from nextProps
        translatableFields.forEach((field) => {
          if (field in nextProps) {
            translationOverrides[field] = nextProps[field];
          }
        });

        // Update translations object
        const newTranslations = { ...prev.localization!.translations };
        if (!newTranslations[currentLang]) {
          newTranslations[currentLang] = { blocks: {} };
        }
        if (!newTranslations[currentLang].blocks) {
          newTranslations[currentLang].blocks = {};
        }

        newTranslations[currentLang].blocks[id] = {
          ...newTranslations[currentLang].blocks[id],
          ...translationOverrides,
        };

        return {
          ...prev,
          localization: {
            ...prev.localization!,
            translations: newTranslations,
          },
        };
      });
    }
  };

  const updateLayout = (layout: PopupSchemaV2["template"]["layout"]) => {
    setSchema((prev) => ({
      ...prev,
      template: { ...prev.template, layout },
    }));
  };

  const save = async (publish: boolean) => {
    setSaving(true);
    setMessage(null);

    const response = await fetch(
      `/api/v1/popups/${popupId}/versions/${versionId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schema,
          status: publish ? "PUBLISHED" : "DRAFT",
        }),
      }
    );

    setSaving(false);

    if (!response.ok) {
      setMessage("Не удалось сохранить.");
      return;
    }

    setMessage(publish ? "Попап опубликован." : "Черновик сохранён.");
  };

  const handleLanguagesUpdate = (enabledLangs: string[]) => {
    setSchema((prev) => ({
      ...prev,
      localization: {
        ...prev.localization!,
        enabledLangs,
      },
    }));

    // If current language was removed, switch to base language
    if (!enabledLangs.includes(currentLang)) {
      setCurrentLang(schema.localization?.baseLang || "en");
    }
  };

  const savePreset = async () => {
    setPresetSaving(true);
    setMessage(null);

    const response = await fetch("/api/v1/presets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: presetName,
        description: presetDescription,
        popupId,
      }),
    });

    setPresetSaving(false);

    if (!response.ok) {
      const data = await response.json();
      setMessage(data?.error ?? "Не удалось сохранить пресет.");
      return;
    }

    setPresetName("");
    setPresetDescription("");
    setShowPresetModal(false);
    setMessage("Пресет сохранён.");
  };

  const status = statusConfig[popupStatus];

  return (
    <div className="space-y-5 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-semibold text-black dark:text-white lg:text-xl">
                {popupName}
              </h1>
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold leading-none"
                style={{ backgroundColor: status.bg, color: status.color }}
              >
                {status.label}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-black/40 dark:text-white/40">
              Версия {versionId.slice(0, 8)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 lg:gap-2.5">
          {message ? (
            <span className="hidden text-xs text-black/50 dark:text-white/50 sm:inline animate-fade-in">
              {message}
            </span>
          ) : null}

          {/* Device Toggle */}
          <div className="flex rounded-lg p-0.5" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
            <button
              onClick={() => setPreviewDevice("desktop")}
              className={clsx(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                previewDevice === "desktop" ? "bg-black text-white dark:bg-white dark:text-black shadow-sm" : "text-black/50 hover:text-black/80 dark:text-white/50 dark:hover:text-white/80"
              )}
            >
              Desktop
            </button>
            <button
              onClick={() => setPreviewDevice("mobile")}
              className={clsx(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                previewDevice === "mobile" ? "bg-black text-white dark:bg-white dark:text-black shadow-sm" : "text-black/50 hover:text-black/80 dark:text-white/50 dark:hover:text-white/80"
              )}
            >
              Mobile
            </button>
          </div>

          <LanguageSelector
            currentLang={currentLang}
            enabledLangs={schema.localization?.enabledLangs || ["en"]}
            onLanguageChange={setCurrentLang}
            onManageLanguages={() => setShowManageLanguages(true)}
          />

          <div className="hidden sm:block w-px h-6 bg-black/10 dark:bg-white/10" />

          <button
            className="hidden rounded-md px-3 py-1.5 text-xs font-medium transition-colors sm:block"
            style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}
            type="button"
            onClick={() => setShowPresetModal(true)}
          >
            Сохранить пресет
          </button>
          <button
            className="rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
            style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}
            type="button"
            disabled={saving}
            onClick={() => save(false)}
          >
            {saving ? (
              <span className="flex items-center gap-1.5">
                <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" /><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
                Сохранение
              </span>
            ) : "Сохранить"}
          </button>
          <button
            className="rounded-md bg-black px-3 py-1.5 text-xs font-semibold text-white hover:bg-black/90 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/90 transition-colors"
            type="button"
            disabled={saving}
            onClick={() => save(true)}
          >
            {saving ? (
              <span className="flex items-center gap-1.5">
                <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" /><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
                Публикация
              </span>
            ) : "Опубликовать"}
          </button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)_320px]">
        {/* Left Panel: Block Palette (Desktop) */}
        <div className="hidden space-y-4 lg:block">
          <BlockPalette
            onAddBlock={(type) => {
              const block = createBlock(type);
              setSchema((prev) => ({
                ...prev,
                blocks: [...prev.blocks, block],
              }));
              setSelectedBlockId(block.id);
            }}
          />
          <BlockList
            blocks={schema.blocks}
            selectedBlockId={selectedBlockId}
            onSelectBlock={setSelectedBlockId}
            onDeleteBlock={(id) => {
              setSchema((prev) => ({
                ...prev,
                blocks: prev.blocks.filter((block) => block.id !== id),
              }));
              if (selectedBlockId === id) {
                setSelectedBlockId(null);
              }
            }}
            onReorder={(next) =>
              setSchema((prev) => ({
                ...prev,
                blocks: next,
              }))
            }
          />
        </div>

        {/* Center Panel: Preview Canvas */}
        <div className="sticky top-4 self-start">
          <div className={clsx("flex flex-col items-start justify-center rounded-xl", previewDevice === "mobile" ? "pt-8 pb-12 px-4" : "pt-6 pb-8 px-4")} style={{ border: "1px solid var(--border)", background: "var(--surface-secondary)" }}>
            <div className={clsx("relative w-full transition-all duration-300", previewDevice === "mobile" ? "max-w-[360px] mx-auto" : "max-w-full")}>
              <PreviewCanvas
                schema={schema}
                selectedBlockId={selectedBlockId}
                onSelectBlock={(id) => {
                  setSelectedBlockId(id);
                  setMobileTab("edit");
                }}
                currentLang={currentLang}
              />
            </div>
          </div>
        </div>

        {/* Right Panel: Inspector Tabs (Desktop) */}
        <div className="hidden lg:block">
          <InspectorTabs
            schema={schema}
            selectedBlock={selectedBlock}
            onUpdateBlock={updateBlock}
            onUpdateLayout={updateLayout}
            onUpdateTriggers={(triggers) =>
              setSchema((prev) => ({ ...prev, triggers }))
            }
            onUpdateTargeting={(targeting) =>
              setSchema((prev) => ({ ...prev, targeting }))
            }
            onUpdateFrequency={(frequency) =>
              setSchema((prev) => ({ ...prev, frequency }))
            }
          />
        </div>
      </div>

      {/* Mobile Bottom Toolbar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white px-4 pb-safe pt-2 dark:bg-black lg:hidden" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center justify-around">
          <button
            onClick={() => setMobileTab("preview")}
            className={clsx("flex flex-col items-center gap-1 p-2 text-xs font-medium", mobileTab === "preview" ? "text-black dark:text-white" : "text-black/40 dark:text-white/40")}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            Просмотр
          </button>
          <button
            onClick={() => setMobileTab("add")}
            className={clsx("flex flex-col items-center gap-1 p-2 text-xs font-medium", mobileTab === "add" ? "text-black dark:text-white" : "text-black/40 dark:text-white/40")}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Добавить
          </button>
          <button
            onClick={() => setMobileTab("edit")}
            className={clsx("flex flex-col items-center gap-1 p-2 text-xs font-medium", mobileTab === "edit" ? "text-black dark:text-white" : "text-black/40 dark:text-white/40")}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            Редактировать
          </button>
        </div>
      </div>

      {/* Mobile Drawers */}
      {/* Add Block Drawer */}
      {mobileTab === "add" && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-sm lg:hidden animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setMobileTab("preview")} />
          <div className="relative max-h-[80vh] w-full overflow-y-auto rounded-t-xl bg-white p-6 shadow-2xl dark:bg-black animate-in slide-in-from-bottom duration-300">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold dark:text-white">Добавить блок</h3>
              <button onClick={() => setMobileTab("preview")} className="rounded-full bg-black/5 p-1 dark:bg-white/10"><svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2" strokeLinecap="round" /></svg></button>
            </div>
            <BlockPalette
              onAddBlock={(type) => {
                const block = createBlock(type);
                setSchema((prev) => ({
                  ...prev,
                  blocks: [...prev.blocks, block],
                }));
                setSelectedBlockId(block.id);
                setMobileTab("edit");
              }}
            />
          </div>
        </div>
      )}

      {/* Edit/Inspector Drawer */}
      {mobileTab === "edit" && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-sm lg:hidden animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setMobileTab("preview")} />
          <div className="relative max-h-[85vh] w-full overflow-y-auto rounded-t-xl bg-white p-6 shadow-2xl dark:bg-black animate-in slide-in-from-bottom duration-300">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold dark:text-white">Редактировать попап</h3>
              <button onClick={() => setMobileTab("preview")} className="rounded-full bg-black/5 p-1 dark:bg-white/10"><svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2" strokeLinecap="round" /></svg></button>
            </div>
            <InspectorTabs
              schema={schema}
              selectedBlock={selectedBlock}
              onUpdateBlock={updateBlock}
              onUpdateLayout={updateLayout}
              onUpdateTriggers={(triggers) =>
                setSchema((prev) => ({ ...prev, triggers }))
              }
              onUpdateTargeting={(targeting) =>
                setSchema((prev) => ({ ...prev, targeting }))
              }
              onUpdateFrequency={(frequency) =>
                setSchema((prev) => ({ ...prev, frequency }))
              }
            />
            <div className="mt-8 border-t pt-6" style={{ borderColor: "var(--border)" }}>
              <h4 className="mb-3 text-sm font-semibold dark:text-white">Слои</h4>
              <BlockList
                blocks={schema.blocks}
                selectedBlockId={selectedBlockId}
                onSelectBlock={setSelectedBlockId}
                onDeleteBlock={(id) => {
                  setSchema((prev) => ({
                    ...prev,
                    blocks: prev.blocks.filter((block) => block.id !== id),
                  }));
                  if (selectedBlockId === id) {
                    setSelectedBlockId(null);
                  }
                }}
                onReorder={(next) =>
                  setSchema((prev) => ({
                    ...prev,
                    blocks: next,
                  }))
                }
              />
            </div>
          </div>
        </div>
      )}

      {showPresetModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-black animate-slide-up" style={{ border: "1px solid var(--border)" }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-black dark:text-white">
                  Сохранить пресет
                </h2>
                <p className="mt-1 text-sm text-black/50 dark:text-white/50">
                  Сохранить дизайн и правила этого попапа как пресет.
                </p>
              </div>
              <button
                className="rounded-md p-1.5 text-black/40 hover:bg-black/[.04] dark:text-white/40 dark:hover:bg-white/[.08] transition-colors"
                type="button"
                onClick={() => setShowPresetModal(false)}
                aria-label="Close modal"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" /></svg>
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <div>
                <label className="text-xs font-medium text-black/60 dark:text-white/60">
                  Название пресета
                </label>
                <input
                  className="mt-1.5 w-full rounded-md px-3 py-2 text-sm text-black outline-none transition-colors dark:text-white"
                  style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
                  value={presetName}
                  onChange={(event) => setPresetName(event.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-black/60 dark:text-white/60">
                  Описание (необязательно)
                </label>
                <textarea
                  className="mt-1.5 w-full rounded-md px-3 py-2 text-sm text-black outline-none transition-colors dark:text-white"
                  style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
                  rows={3}
                  value={presetDescription}
                  onChange={(event) => setPresetDescription(event.target.value)}
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                className="rounded-md px-4 py-2 text-sm font-medium text-black/70 hover:bg-black/[.04] dark:text-white/70 dark:hover:bg-white/[.06] transition-colors"
                type="button"
                onClick={() => setShowPresetModal(false)}
              >
                Отмена
              </button>
              <button
                className="rounded-md bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/90 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/90 transition-colors"
                type="button"
                disabled={presetSaving || !presetName}
                onClick={savePreset}
              >
                {presetSaving ? "Сохранение..." : "Сохранить пресет"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Manage Languages Modal */}
      <ManageLanguagesModal
        isOpen={showManageLanguages}
        baseLang={schema.localization?.baseLang || "en"}
        enabledLangs={schema.localization?.enabledLangs || ["en"]}
        onClose={() => setShowManageLanguages(false)}
        onSave={handleLanguagesUpdate}
      />
    </div>
  );
}

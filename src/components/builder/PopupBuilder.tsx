"use client";

import { useMemo, useState } from "react";
import { nanoid } from "nanoid";
import clsx from "clsx";

import BlockList from "@/components/builder/BlockList";
import BlockPalette from "@/components/builder/BlockPalette";
import InspectorPanel from "@/components/builder/InspectorPanel";
import PreviewCanvas from "@/components/builder/PreviewCanvas";
import LanguageSelector from "@/components/builder/LanguageSelector";
import ManageLanguagesModal from "@/components/builder/ManageLanguagesModal";
import {
  BlockType,
  PopupBlock,
  PopupSchemaV2,
  createEmptySchema,
} from "@/lib/builder/schema";
import { DEFAULT_LOCALIZATION } from "@/lib/builder/localization";

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
  const [showJson, setShowJson] = useState(false);
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

  const selectedBlock = schema.blocks.find((block) => block.id === selectedBlockId) ?? null;

  const updateBlock = (id: string, nextProps: Record<string, unknown>) => {
    setSchema((prev) => ({
      ...prev,
      blocks: prev.blocks.map((block) =>
        block.id === id ? { ...block, props: nextProps } : block
      ),
    }));
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
      setMessage("Failed to save changes.");
      return;
    }

    setMessage(publish ? "Popup published." : "Draft saved.");
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
      setMessage(data?.error ?? "Failed to save preset.");
      return;
    }

    setPresetName("");
    setPresetDescription("");
    setShowPresetModal(false);
    setMessage("Preset saved.");
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-black dark:text-white lg:text-2xl">
            {popupName}
          </h1>
          <div className="flex items-center gap-2 text-xs text-black/60 dark:text-white/60">
            <span className="hidden sm:inline">Version {versionId.slice(0, 6)}</span>
            <span className="hidden sm:inline">·</span>
            <span className="capitalize">{popupStatus.toLowerCase()}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 lg:gap-3">
          {message ? (
            <span className="hidden text-xs text-black/60 dark:text-white/60 sm:inline">
              {message}
            </span>
          ) : null}
          <div className="flex rounded-lg border border-black/10 bg-white p-1 dark:border-white/10 dark:bg-black">
            <button
              onClick={() => setPreviewDevice("desktop")}
              className={clsx(
                "rounded px-2 py-1 text-xs font-medium transition-colors",
                previewDevice === "desktop" ? "bg-black text-white dark:bg-white dark:text-black" : "text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
              )}
            >
              Desktop
            </button>
            <button
              onClick={() => setPreviewDevice("mobile")}
              className={clsx(
                "rounded px-2 py-1 text-xs font-medium transition-colors",
                previewDevice === "mobile" ? "bg-black text-white dark:bg-white dark:text-black" : "text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
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
          <button
            className="hidden rounded border border-black/10 px-3 py-1.5 text-xs font-medium text-black/80 hover:bg-black/[.04] disabled:opacity-60 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/[.06] sm:block lg:px-4 lg:py-2 lg:text-sm"
            type="button"
            onClick={() => setShowPresetModal(true)}
          >
            Save preset
          </button>
          <button
            className="rounded border border-black/10 px-3 py-1.5 text-xs font-medium text-black/80 hover:bg-black/[.04] disabled:opacity-60 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/[.06] lg:px-4 lg:py-2 lg:text-sm"
            type="button"
            disabled={saving}
            onClick={() => save(false)}
          >
            {saving ? "..." : "Save"}
          </button>
          <button
            className="rounded bg-black px-3 py-1.5 text-xs font-medium text-white hover:bg-black/90 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-white/90 lg:px-4 lg:py-2 lg:text-sm"
            type="button"
            disabled={saving}
            onClick={() => save(true)}
          >
            Publish
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)_320px]">
        {/* Left Panel: Block Palette (Desktop) */}
        <div className="hidden space-y-6 lg:block">
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
          <div className={clsx("flex flex-col items-start justify-center rounded-xl border border-black/5 bg-black/5 dark:border-white/5 dark:bg-white/5", previewDevice === "mobile" ? "pt-8 pb-12 px-4" : "pt-6 pb-8 px-4")}>
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

        {/* Right Panel: Inspector (Desktop) */}
        <div className="hidden space-y-6 lg:block">
          <InspectorPanel
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
            showJson={showJson}
            onToggleJson={() => setShowJson((prev) => !prev)}
          />

          {showJson ? (
            <div className="rounded-lg border border-black/10 bg-white p-4 text-xs text-black/70 dark:border-white/10 dark:bg-black dark:text-white/70">
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(schema, null, 2)}
              </pre>
            </div>
          ) : null}
        </div>
      </div>

      {/* Mobile Bottom Toolbar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-black/10 bg-white px-4 pb-safe pt-2 dark:border-white/10 dark:bg-black lg:hidden">
        <div className="flex items-center justify-around">
          <button
            onClick={() => setMobileTab("preview")}
            className={clsx("flex flex-col items-center gap-1 p-2 text-xs font-medium", mobileTab === "preview" ? "text-black dark:text-white" : "text-black/50 dark:text-white/50")}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            Preview
          </button>
          <button
            onClick={() => setMobileTab("add")}
            className={clsx("flex flex-col items-center gap-1 p-2 text-xs font-medium", mobileTab === "add" ? "text-black dark:text-white" : "text-black/50 dark:text-white/50")}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Add
          </button>
          <button
            onClick={() => setMobileTab("edit")}
            className={clsx("flex flex-col items-center gap-1 p-2 text-xs font-medium", mobileTab === "edit" ? "text-black dark:text-white" : "text-black/50 dark:text-white/50")}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            Edit
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
              <h3 className="text-lg font-semibold dark:text-white">Add Block</h3>
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
              <h3 className="text-lg font-semibold dark:text-white">Edit Popup</h3>
              <button onClick={() => setMobileTab("preview")} className="rounded-full bg-black/5 p-1 dark:bg-white/10"><svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2" strokeLinecap="round" /></svg></button>
            </div>
            <InspectorPanel
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
              showJson={false}
              onToggleJson={() => { }}
            />
            <div className="mt-8 border-t border-black/10 pt-6 dark:border-white/10">
              <h4 className="mb-3 text-sm font-semibold dark:text-white">Layers</h4>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-xl border border-black/10 bg-white p-6 shadow-lg dark:border-white/10 dark:bg-black">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-black dark:text-white">
                  Save preset
                </h2>
                <p className="mt-1 text-sm text-black/60 dark:text-white/60">
                  Save this popup design and rules as a preset.
                </p>
              </div>
              <button
                className="rounded p-1 text-black/60 hover:bg-black/[.04] dark:text-white/60 dark:hover:bg-white/[.08]"
                type="button"
                onClick={() => setShowPresetModal(false)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-black/70 dark:text-white/70">
                  Preset name
                </label>
                <input
                  className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-black outline-none focus:border-black/40 dark:border-white/10 dark:bg-black dark:text-white"
                  value={presetName}
                  onChange={(event) => setPresetName(event.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-black/70 dark:text-white/70">
                  Description (optional)
                </label>
                <textarea
                  className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-black outline-none focus:border-black/40 dark:border-white/10 dark:bg-black dark:text-white"
                  rows={3}
                  value={presetDescription}
                  onChange={(event) => setPresetDescription(event.target.value)}
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                className="rounded border border-black/10 px-4 py-2 text-sm text-black/80 hover:bg-black/[.04] dark:border-white/10 dark:text-white/80 dark:hover:bg-white/[.06]"
                type="button"
                onClick={() => setShowPresetModal(false)}
              >
                Cancel
              </button>
              <button
                className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-white/90"
                type="button"
                disabled={presetSaving || !presetName}
                onClick={savePreset}
              >
                {presetSaving ? "Saving..." : "Save preset"}
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

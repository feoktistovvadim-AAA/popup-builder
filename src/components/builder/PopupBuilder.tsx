"use client";

import { useMemo, useState } from "react";
import { nanoid } from "nanoid";

import BlockList from "@/components/builder/BlockList";
import BlockPalette from "@/components/builder/BlockPalette";
import InspectorPanel from "@/components/builder/InspectorPanel";
import PreviewCanvas from "@/components/builder/PreviewCanvas";
import {
  BlockType,
  PopupBlock,
  PopupSchemaV2,
  createEmptySchema,
} from "@/lib/builder/schema";

type PopupBuilderProps = {
  popupId: string;
  popupName: string;
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-black dark:text-white">
            {popupName}
          </h1>
          <p className="text-sm text-black/60 dark:text-white/60">
            Version {versionId.slice(0, 6)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {message ? (
            <span className="text-xs text-black/60 dark:text-white/60">
              {message}
            </span>
          ) : null}
          <button
            className="rounded border border-black/10 px-4 py-2 text-sm text-black/80 hover:bg-black/[.04] disabled:opacity-60 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/[.06]"
            type="button"
            onClick={() => setShowPresetModal(true)}
          >
            Save as preset
          </button>
          <button
            className="rounded border border-black/10 px-4 py-2 text-sm text-black/80 hover:bg-black/[.04] disabled:opacity-60 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/[.06]"
            type="button"
            disabled={saving}
            onClick={() => save(false)}
          >
            {saving ? "Saving..." : "Save draft"}
          </button>
          <button
            className="rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-white/90"
            type="button"
            disabled={saving}
            onClick={() => save(true)}
          >
            Publish
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)_320px]">
        <div className="space-y-6">
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

        <PreviewCanvas
          schema={schema}
          selectedBlockId={selectedBlockId}
          onSelectBlock={setSelectedBlockId}
        />

        <div className="space-y-6">
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
    </div>
  );
}

"use client";

import { useState } from "react";

import {
  FrequencyConfig,
  PopupBlock,
  PopupSchemaV2,
  TargetingRule,
  Trigger,
} from "@/lib/builder/schema";

const triggerOptions: Trigger["type"][] = [
  "after_seconds",
  "scroll_percent",
  "exit_intent_desktop",
  "smart_exit_intent",
  "custom_event",
  "inactivity",
  "pageview_count",
  "url_match",
  "device_is",
];

const targetingOptions: TargetingRule["type"][] = [
  "vip_level_is",
  "balance_lt",
  "device_is",
  "url_contains",
  "new_vs_returning",
  "sessions_count",
  "referrer_contains",
];

export default function InspectorPanel({
  schema,
  selectedBlock,
  onUpdateBlock,
  onUpdateLayout,
  onUpdateTriggers,
  onUpdateTargeting,
  onUpdateFrequency,
  showJson,
  onToggleJson,
}: {
  schema: PopupSchemaV2;
  selectedBlock: PopupBlock | null;
  onUpdateBlock: (id: string, nextProps: Record<string, unknown>) => void;
  onUpdateLayout: (next: PopupSchemaV2["template"]["layout"]) => void;
  onUpdateTriggers: (triggers: Trigger[]) => void;
  onUpdateTargeting: (targeting: TargetingRule[]) => void;
  onUpdateFrequency: (frequency: FrequencyConfig) => void;
  showJson: boolean;
  onToggleJson: () => void;
}) {
  const layout = schema.template.layout;
  const [uploading, setUploading] = useState(false);

  const getTriggerParam = <T,>(
    trigger: Trigger,
    key: string,
    fallback: T
  ): T => {
    if (trigger.params && key in trigger.params) {
      return (trigger.params as Record<string, unknown>)[key] as T;
    }
    if (key in trigger) {
      return (trigger as Record<string, unknown>)[key] as T;
    }
    return fallback;
  };

  const setTriggerParam = (trigger: Trigger, key: string, value: unknown) => ({
    ...trigger,
    params: { ...(trigger.params ?? {}), [key]: value },
  });

  const handleImageUpload = async (file: File) => {
    if (!selectedBlock || selectedBlock.type !== "image") return;
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/v1/upload", {
      method: "POST",
      body: formData,
    });

    setUploading(false);

    if (response.ok) {
      const data = await response.json();
      onUpdateBlock(selectedBlock.id, {
        ...selectedBlock.props,
        src: data.url,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-black">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-black dark:text-white">
            Layout
          </h3>
          <button
            className="text-xs text-black/60 underline dark:text-white/60"
            type="button"
            onClick={onToggleJson}
          >
            {showJson ? "Hide JSON" : "Show JSON"}
          </button>
        </div>
        <div className="mt-3 space-y-3 text-xs text-black/60 dark:text-white/60">
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              Padding (Desktop)
              <input
                className="w-full rounded border border-black/10 bg-white px-2 py-1 text-sm text-black dark:border-white/10 dark:bg-black dark:text-white"
                type="number"
                value={layout.paddingDesktop ?? 24}
                onChange={(event) =>
                  onUpdateLayout({
                    ...layout,
                    paddingDesktop: Number(event.target.value),
                  })
                }
              />
            </label>
            <label className="space-y-1">
              Padding (Mobile)
              <input
                className="w-full rounded border border-black/10 bg-white px-2 py-1 text-sm text-black dark:border-white/10 dark:bg-black dark:text-white"
                type="number"
                value={layout.paddingMobile ?? 16}
                onChange={(event) =>
                  onUpdateLayout({
                    ...layout,
                    paddingMobile: Number(event.target.value),
                  })
                }
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              Max Width (Desktop)
              <input
                className="w-full rounded border border-black/10 bg-white px-2 py-1 text-sm text-black dark:border-white/10 dark:bg-black dark:text-white"
                type="number"
                value={layout.maxWidthDesktop ?? 420}
                onChange={(event) =>
                  onUpdateLayout({
                    ...layout,
                    maxWidthDesktop: Number(event.target.value),
                  })
                }
              />
            </label>
            <label className="space-y-1">
              Max Width (Mobile)
              <input
                className="w-full rounded border border-black/10 bg-white px-2 py-1 text-sm text-black dark:border-white/10 dark:bg-black dark:text-white"
                type="number"
                value={layout.maxWidthMobile ?? 340}
                onChange={(event) =>
                  onUpdateLayout({
                    ...layout,
                    maxWidthMobile: Number(event.target.value),
                  })
                }
              />
            </label>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-black">
        <h3 className="text-sm font-semibold text-black dark:text-white">
          Style & Position
        </h3>
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-black/60 dark:text-white/60">
          <label className="space-y-1">
            Radius
            <input
              className="w-full rounded border border-black/10 bg-white px-2 py-1 text-sm text-black dark:border-white/10 dark:bg-black dark:text-white"
              type="number"
              value={layout.borderRadius}
              onChange={(event) =>
                onUpdateLayout({
                  ...layout,
                  borderRadius: Number(event.target.value),
                })
              }
            />
          </label>
          <label className="space-y-1">
            Shadow
            <select
              className="w-full rounded border border-black/10 bg-white px-2 py-1 text-sm text-black dark:border-white/10 dark:bg-black dark:text-white"
              value={layout.shadow ?? "medium"}
              onChange={(event) =>
                onUpdateLayout({
                  ...layout,
                  shadow: event.target.value as typeof layout.shadow,
                })
              }
            >
              <option value="none">None</option>
              <option value="soft">Soft</option>
              <option value="medium">Medium</option>
              <option value="strong">Strong</option>
            </select>
          </label>
          <label className="space-y-1">
            Background
            <input
              className="h-8 w-full rounded border border-black/10 bg-white px-2 py-1 text-sm text-black dark:border-white/10 dark:bg-black dark:text-white"
              type="color"
              value={layout.backgroundColor}
              onChange={(event) =>
                onUpdateLayout({
                  ...layout,
                  backgroundColor: event.target.value,
                })
              }
            />
          </label>
          <label className="space-y-1">
            Overlay Color
            <input
              className="w-full rounded border border-black/10 bg-white px-2 py-1 text-sm text-black dark:border-white/10 dark:bg-black dark:text-white"
              type="text"
              value={layout.overlayColor}
              onChange={(event) =>
                onUpdateLayout({
                  ...layout,
                  overlayColor: event.target.value,
                })
              }
            />
          </label>
          <label className="space-y-1">
            Overlay Blur (px)
            <input
              className="w-full rounded border border-black/10 bg-white px-2 py-1 text-sm text-black dark:border-white/10 dark:bg-black dark:text-white"
              type="number"
              value={layout.overlayBlur ?? 0}
              onChange={(event) =>
                onUpdateLayout({
                  ...layout,
                  overlayBlur: Number(event.target.value),
                })
              }
            />
          </label>
          <label className="space-y-1">
            Position
            <select
              className="w-full rounded border border-black/10 bg-white px-2 py-1 text-sm text-black dark:border-white/10 dark:bg-black dark:text-white"
              value={layout.position}
              onChange={(event) =>
                onUpdateLayout({
                  ...layout,
                  position: event.target.value as typeof layout.position,
                })
              }
            >
              <option value="center">Center</option>
              <option value="top-left">Top Left</option>
              <option value="top-center">Top Center</option>
              <option value="top-right">Top Right</option>
              <option value="bottom-left">Bottom Left</option>
              <option value="bottom-center">Bottom Center</option>
              <option value="bottom-right">Bottom Right</option>
            </select>
          </label>
        </div>

        <div className="mt-3 space-y-2 text-xs text-black/60 dark:text-white/60">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={layout.borderEnabled ?? false}
              onChange={(event) =>
                onUpdateLayout({ ...layout, borderEnabled: event.target.checked })
              }
            />
            Enable Border
          </label>
          {layout.borderEnabled && (
            <div className="grid grid-cols-2 gap-3 pl-5">
              <label className="space-y-1">
                Width
                <input
                  className="w-full rounded border border-black/10 bg-white px-2 py-1 text-sm text-black dark:border-white/10 dark:bg-black dark:text-white"
                  type="number"
                  value={layout.borderWidth ?? 1}
                  onChange={(event) =>
                    onUpdateLayout({
                      ...layout,
                      borderWidth: Number(event.target.value),
                    })
                  }
                />
              </label>
              <label className="space-y-1">
                Color
                <input
                  className="h-8 w-full rounded border border-black/10 bg-white px-2 py-1 text-sm text-black dark:border-white/10 dark:bg-black dark:text-white"
                  type="color"
                  value={layout.borderColor ?? "#ffffff"}
                  onChange={(event) =>
                    onUpdateLayout({
                      ...layout,
                      borderColor: event.target.value,
                    })
                  }
                />
              </label>
            </div>
          )}
        </div>
        <label className="space-y-1">
          Animation
          <select
            className="w-full rounded border border-black/10 bg-white px-2 py-1 text-sm text-black dark:border-white/10 dark:bg-black dark:text-white"
            value={layout.animation}
            onChange={(event) =>
              onUpdateLayout({
                ...layout,
                animation: event.target.value as typeof layout.animation,
              })
            }
          >
            <option value="fade">Fade</option>
            <option value="slide">Slide</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-black/70 dark:text-white/70">
          <input
            type="checkbox"
            checked={layout.showClose}
            onChange={(event) =>
              onUpdateLayout({ ...layout, showClose: event.target.checked })
            }
          />
          Show close button
        </label>
      </div>

      <div className="rounded-lg border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-black">
        <h3 className="text-sm font-semibold text-black dark:text-white">
          Block settings
        </h3>
        {!selectedBlock ? (
          <p className="mt-3 text-xs text-black/60 dark:text-white/60">
            Select a block to edit its properties.
          </p>
        ) : (
          <div className="mt-3 space-y-3 text-xs text-black/70 dark:text-white/70">
            {selectedBlock.type === "headline" ||
              selectedBlock.type === "text" ? (
              <>
                <label className="space-y-1">
                  Text
                  <textarea
                    className="w-full rounded border border-black/10 bg-white px-2 py-1 text-sm text-black dark:border-white/10 dark:bg-black dark:text-white"
                    value={(selectedBlock.props.text as string) ?? ""}
                    onChange={(event) =>
                      onUpdateBlock(selectedBlock.id, {
                        ...selectedBlock.props,
                        text: event.target.value,
                      })
                    }
                  />
                </label>
                <label className="space-y-1">
                  Alignment
                  <select
                    className="w-full rounded border border-black/10 bg-white px-2 py-1 text-sm text-black dark:border-white/10 dark:bg-black dark:text-white"
                    value={(selectedBlock.props.align as string) ?? "left"}
                    onChange={(event) =>
                      onUpdateBlock(selectedBlock.id, {
                        ...selectedBlock.props,
                        align: event.target.value,
                      })
                    }
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </label>
                <label className="space-y-1">
                  Color
                  <input
                    className="h-8 w-full rounded border border-black/10 bg-white px-2 py-1 text-sm text-black dark:border-white/10 dark:bg-black dark:text-white"
                    type="color"
                    value={
                      (selectedBlock.props.color as string) ??
                      (selectedBlock.type === "headline" ? "#ffffff" : "#d1d5db")
                    }
                    onChange={(event) =>
                      onUpdateBlock(selectedBlock.id, {
                        ...selectedBlock.props,
                        color: event.target.value,
                      })
                    }
                  />
                </label>
              </>
            ) : null}

            {selectedBlock.type === "button" ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-1">
                    Label
                    <input
                      className="w-full rounded border border-black/10 bg-white px-2 py-1 text-sm text-black dark:border-white/10 dark:bg-black dark:text-white"
                      value={(selectedBlock.props.label as string) ?? ""}
                      onChange={(event) =>
                        onUpdateBlock(selectedBlock.id, {
                          ...selectedBlock.props,
                          label: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="space-y-1">
                    URL
                    <input
                      className="w-full rounded border border-black/10 bg-white px-2 py-1 text-sm text-black dark:border-white/10 dark:bg-black dark:text-white"
                      value={(selectedBlock.props.url as string) ?? ""}
                      onChange={(event) =>
                        onUpdateBlock(selectedBlock.id, {
                          ...selectedBlock.props,
                          url: event.target.value,
                        })
                      }
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-1">
                    Text color
                    <input
                      className="h-8 w-full rounded border border-black/10 bg-white px-2 py-1 text-sm text-black dark:border-white/10 dark:bg-black dark:text-white"
                      type="color"
                      value={(selectedBlock.props.textColor as string) ?? "#ffffff"}
                      onChange={(event) =>
                        onUpdateBlock(selectedBlock.id, {
                          ...selectedBlock.props,
                          textColor: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="space-y-1">
                    Background
                    <input
                      className="h-8 w-full rounded border border-black/10 bg-white px-2 py-1 text-sm text-black dark:border-white/10 dark:bg-black dark:text-white"
                      type="color"
                      value={
                        (selectedBlock.props.backgroundColor as string) ?? "#7c3aed"
                      }
                      onChange={(event) =>
                        onUpdateBlock(selectedBlock.id, {
                          ...selectedBlock.props,
                          backgroundColor: event.target.value,
                        })
                      }
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-1">
                    Font Size (px)
                    <input
                      className="w-full rounded border border-black/10 bg-white px-2 py-1 text-sm text-black dark:border-white/10 dark:bg-black dark:text-white"
                      type="number"
                      value={(selectedBlock.props.fontSize as number) ?? 16}
                      onChange={(event) =>
                        onUpdateBlock(selectedBlock.id, {
                          ...selectedBlock.props,
                          fontSize: Number(event.target.value),
                        })
                      }
                    />
                  </label>
                  <label className="space-y-1">
                    Radius
                    <input
                      className="w-full rounded border border-black/10 bg-white px-2 py-1 text-sm text-black dark:border-white/10 dark:bg-black dark:text-white"
                      type="number"
                      value={(selectedBlock.props.borderRadius as number) ?? 10}
                      onChange={(event) =>
                        onUpdateBlock(selectedBlock.id, {
                          ...selectedBlock.props,
                          borderRadius: Number(event.target.value),
                        })
                      }
                    />
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={(selectedBlock.props.fullWidth as boolean) ?? false}
                      onChange={(event) =>
                        onUpdateBlock(selectedBlock.id, {
                          ...selectedBlock.props,
                          fullWidth: event.target.checked,
                        })
                      }
                    />
                    Full Width
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={(selectedBlock.props.borderEnabled as boolean) ?? false}
                      onChange={(event) =>
                        onUpdateBlock(selectedBlock.id, {
                          ...selectedBlock.props,
                          borderEnabled: event.target.checked,
                        })
                      }
                    />
                    Enable Border
                  </label>

                  {(selectedBlock.props.borderEnabled as boolean) && (
                    <div className="grid grid-cols-2 gap-3 pl-5">
                      <label className="space-y-1">
                        Width
                        <input
                          className="w-full rounded border border-black/10 bg-white px-2 py-1 text-sm text-black dark:border-white/10 dark:bg-black dark:text-white"
                          type="number"
                          value={(selectedBlock.props.borderWidth as number) ?? 1}
                          onChange={(event) =>
                            onUpdateBlock(selectedBlock.id, {
                              ...selectedBlock.props,
                              borderWidth: Number(event.target.value),
                            })
                          }
                        />
                      </label>
                      <label className="space-y-1">
                        Color
                        <input
                          className="h-8 w-full rounded border border-black/10 bg-white px-2 py-1 text-sm text-black dark:border-white/10 dark:bg-black dark:text-white"
                          type="color"
                          value={(selectedBlock.props.borderColor as string) ?? "#ffffff"}
                          onChange={(event) =>
                            onUpdateBlock(selectedBlock.id, {
                              ...selectedBlock.props,
                              borderColor: event.target.value,
                            })
                          }
                        />
                      </label>
                    </div>
                  )}
                </div>
              </>
            ) : null}

            {selectedBlock.type === "image" ? (
              <>
                <label className="space-y-1">
                  Image URL
                  <input
                    className="w-full rounded border border-black/10 bg-white px-2 py-1 text-sm text-black dark:border-white/10 dark:bg-black dark:text-white"
                    value={(selectedBlock.props.src as string) ?? ""}
                    onChange={(event) =>
                      onUpdateBlock(selectedBlock.id, {
                        ...selectedBlock.props,
                        src: event.target.value,
                      })
                    }
                  />
                </label>
                <label className="space-y-1">
                  Alt text
                  <input
                    className="w-full rounded border border-black/10 bg-white px-2 py-1 text-sm text-black dark:border-white/10 dark:bg-black dark:text-white"
                    value={(selectedBlock.props.alt as string) ?? ""}
                    onChange={(event) =>
                      onUpdateBlock(selectedBlock.id, {
                        ...selectedBlock.props,
                        alt: event.target.value,
                      })
                    }
                  />
                </label>
                <label className="space-y-1">
                  Width (%)
                  <input
                    className="w-full rounded border border-black/10 bg-white px-2 py-1 text-sm text-black dark:border-white/10 dark:bg-black dark:text-white"
                    type="number"
                    value={(selectedBlock.props.width as number) ?? 100}
                    onChange={(event) =>
                      onUpdateBlock(selectedBlock.id, {
                        ...selectedBlock.props,
                        width: Number(event.target.value),
                      })
                    }
                  />
                </label>
                <label className="space-y-1">
                  Radius
                  <input
                    className="w-full rounded border border-black/10 bg-white px-2 py-1 text-sm text-black dark:border-white/10 dark:bg-black dark:text-white"
                    type="number"
                    value={(selectedBlock.props.borderRadius as number) ?? 12}
                    onChange={(event) =>
                      onUpdateBlock(selectedBlock.id, {
                        ...selectedBlock.props,
                        borderRadius: Number(event.target.value),
                      })
                    }
                  />
                </label>
                <label className="space-y-1">
                  Upload image
                  <input
                    className="block w-full text-xs text-black/60 file:mr-3 file:rounded file:border-0 file:bg-black file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white dark:text-white/60 dark:file:bg-white dark:file:text-black"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                    disabled={uploading}
                  />
                </label>
              </>
            ) : null}

            {selectedBlock.type === "spacer" ? (
              <label className="space-y-1">
                Height
                <input
                  className="w-full rounded border border-black/10 bg-white px-2 py-1 text-sm text-black dark:border-white/10 dark:bg-black dark:text-white"
                  type="number"
                  value={(selectedBlock.props.height as number) ?? 16}
                  onChange={(event) =>
                    onUpdateBlock(selectedBlock.id, {
                      ...selectedBlock.props,
                      height: Number(event.target.value),
                    })
                  }
                />
              </label>
            ) : null}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-black">
        <h3 className="text-sm font-semibold text-black dark:text-white">
          Triggers
        </h3>
        <div className="mt-3 space-y-3 text-xs text-black/70 dark:text-white/70">
          {schema.triggers.map((trigger, index) => (
            <div key={`${trigger.type}-${index}`} className="space-y-2">
              <select
                className="w-full rounded border border-black/10 bg-white px-2 py-1 text-sm text-black dark:border-white/10 dark:bg-black dark:text-white"
                value={trigger.type}
                onChange={(event) => {
                  const next = [...schema.triggers];
                  next[index] = { type: event.target.value as Trigger["type"] } as Trigger;
                  onUpdateTriggers(next);
                }}
              >
                {triggerOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              {trigger.type === "after_seconds" ||
                trigger.type === "inactivity" ? (
                <input
                  className="w-full rounded border border-black/10 bg-white px-2 py-1 text-sm text-black dark:border-white/10 dark:bg-black dark:text-white"
                  type="number"
                  value={getTriggerParam(trigger, "seconds", 5)}
                  onChange={(event) => {
                    const next = [...schema.triggers];
                    next[index] = setTriggerParam(
                      trigger,
                      "seconds",
                      Number(event.target.value)
                    ) as Trigger;
                    onUpdateTriggers(next);
                  }}
                />
              ) : null}

              {trigger.type === "scroll_percent" ? (
                <input
                  className="w-full rounded border border-black/10 bg-white px-2 py-1 text-sm text-black dark:border-white/10 dark:bg-black dark:text-white"
                  type="number"
                  value={getTriggerParam(trigger, "percent", 10)}
                  onChange={(event) => {
                    const next = [...schema.triggers];
                    next[index] = setTriggerParam(
                      trigger,
                      "percent",
                      Number(event.target.value)
                    ) as Trigger;
                    onUpdateTriggers(next);
                  }}
                />
              ) : null}

              {trigger.type === "custom_event" ? (
                <input
                  className="w-full rounded border border-black/10 bg-white px-2 py-1 text-sm text-black dark:border-white/10 dark:bg-black dark:text-white"
                  value={getTriggerParam(trigger, "name", trigger.eventName ?? "")}
                  onChange={(event) => {
                    const next = [...schema.triggers];
                    next[index] = setTriggerParam(
                      trigger,
                      "name",
                      event.target.value
                    ) as Trigger;
                    onUpdateTriggers(next);
                  }}
                />
              ) : null}

              {trigger.type === "url_match" ? (
                <div className="space-y-2">
                  <input
                    className="w-full rounded border border-black/10 bg-white px-2 py-1 text-sm text-black dark:border-white/10 dark:bg-black dark:text-white"
                    value={getTriggerParam(trigger, "pattern", "")}
                    onChange={(event) => {
                      const next = [...schema.triggers];
                      next[index] = setTriggerParam(
                        trigger,
                        "pattern",
                        event.target.value
                      ) as Trigger;
                      onUpdateTriggers(next);
                    }}
                  />
                  <select
                    className="w-full rounded border border-black/10 bg-white px-2 py-1 text-sm text-black dark:border-white/10 dark:bg-black dark:text-white"
                    value={getTriggerParam(trigger, "match", "contains")}
                    onChange={(event) => {
                      const next = [...schema.triggers];
                      next[index] = setTriggerParam(
                        trigger,
                        "match",
                        event.target.value
                      ) as Trigger;
                      onUpdateTriggers(next);
                    }}
                  >
                    <option value="contains">contains</option>
                    <option value="equals">equals</option>
                    <option value="regex">regex</option>
                  </select>
                </div>
              ) : null}

              {trigger.type === "pageview_count" ? (
                <input
                  className="w-full rounded border border-black/10 bg-white px-2 py-1 text-sm text-black dark:border-white/10 dark:bg-black dark:text-white"
                  type="number"
                  value={getTriggerParam(trigger, "count", 1)}
                  onChange={(event) => {
                    const next = [...schema.triggers];
                    next[index] = setTriggerParam(
                      trigger,
                      "count",
                      Number(event.target.value)
                    ) as Trigger;
                    onUpdateTriggers(next);
                  }}
                />
              ) : null}

              {trigger.type === "device_is" ? (
                <select
                  className="w-full rounded border border-black/10 bg-white px-2 py-1 text-sm text-black dark:border-white/10 dark:bg-black dark:text-white"
                  value={getTriggerParam(trigger, "device", "desktop")}
                  onChange={(event) => {
                    const next = [...schema.triggers];
                    next[index] = setTriggerParam(
                      trigger,
                      "device",
                      event.target.value as "desktop" | "mobile"
                    ) as Trigger;
                    onUpdateTriggers(next);
                  }}
                >
                  <option value="desktop">desktop</option>
                  <option value="mobile">mobile</option>
                </select>
              ) : null}

              {trigger.type === "exit_intent_desktop" ? (
                <input
                  className="w-full rounded border border-black/10 bg-white px-2 py-1 text-sm text-black dark:border-white/10 dark:bg-black dark:text-white"
                  type="number"
                  placeholder="Sensitivity (px from top)"
                  value={getTriggerParam(trigger, "sensitivity", 10)}
                  onChange={(event) => {
                    const next = [...schema.triggers];
                    next[index] = setTriggerParam(
                      trigger,
                      "sensitivity",
                      Number(event.target.value)
                    ) as Trigger;
                    onUpdateTriggers(next);
                  }}
                />
              ) : null}

              {trigger.type === "smart_exit_intent" ? (
                <div className="space-y-2">
                  <input
                    className="w-full rounded border border-black/10 bg-white px-2 py-1 text-sm text-black dark:border-white/10 dark:bg-black dark:text-white"
                    type="number"
                    placeholder="Desktop sensitivity (px from top)"
                    value={getTriggerParam(trigger, "sensitivity", 10)}
                    onChange={(event) => {
                      const next = [...schema.triggers];
                      next[index] = setTriggerParam(
                        trigger,
                        "sensitivity",
                        Number(event.target.value)
                      ) as Trigger;
                      onUpdateTriggers(next);
                    }}
                  />
                  <input
                    className="w-full rounded border border-black/10 bg-white px-2 py-1 text-sm text-black dark:border-white/10 dark:bg-black dark:text-white"
                    type="number"
                    placeholder="Mobile scroll velocity (px/s)"
                    value={getTriggerParam(trigger, "scrollVelocityThreshold", 800)}
                    onChange={(event) => {
                      const next = [...schema.triggers];
                      next[index] = setTriggerParam(
                        trigger,
                        "scrollVelocityThreshold",
                        Number(event.target.value)
                      ) as Trigger;
                      onUpdateTriggers(next);
                    }}
                  />
                  <input
                    className="w-full rounded border border-black/10 bg-white px-2 py-1 text-sm text-black dark:border-white/10 dark:bg-black dark:text-white"
                    type="number"
                    placeholder="Mobile top scroll threshold (px)"
                    value={getTriggerParam(trigger, "topScrollThreshold", 120)}
                    onChange={(event) => {
                      const next = [...schema.triggers];
                      next[index] = setTriggerParam(
                        trigger,
                        "topScrollThreshold",
                        Number(event.target.value)
                      ) as Trigger;
                      onUpdateTriggers(next);
                    }}
                  />
                </div>
              ) : null}

              <button
                className="text-xs text-red-600 dark:text-red-400"
                type="button"
                onClick={() => {
                  const next = schema.triggers.filter((_, idx) => idx !== index);
                  onUpdateTriggers(next);
                }}
              >
                Remove trigger
              </button>
            </div>
          ))}
          <button
            className="rounded border border-black/10 px-2 py-1 text-xs text-black/70 dark:border-white/10 dark:text-white/70"
            type="button"
            onClick={() =>
              onUpdateTriggers([...schema.triggers, { type: "after_seconds", seconds: 5 }])
            }
          >
            Add trigger
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-black">
        <h3 className="text-sm font-semibold text-black dark:text-white">
          Targeting
        </h3>
        <div className="mt-3 space-y-3 text-xs text-black/70 dark:text-white/70">
          {schema.targeting.map((rule, index) => (
            <div key={`${rule.type}-${index}`} className="space-y-2">
              <select
                className="w-full rounded border border-black/10 bg-white px-2 py-1 text-sm text-black dark:border-white/10 dark:bg-black dark:text-white"
                value={rule.type}
                onChange={(event) => {
                  const next = [...schema.targeting];
                  next[index] = { type: event.target.value as TargetingRule["type"] } as TargetingRule;
                  onUpdateTargeting(next);
                }}
              >
                {targetingOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              {"value" in rule ? (
                <input
                  className="w-full rounded border border-black/10 bg-white px-2 py-1 text-sm text-black dark:border-white/10 dark:bg-black dark:text-white"
                  value={rule.value}
                  onChange={(event) => {
                    const next = [...schema.targeting];
                    next[index] = { ...rule, value: event.target.value } as TargetingRule;
                    onUpdateTargeting(next);
                  }}
                />
              ) : null}

              {"amount" in rule ? (
                <input
                  className="w-full rounded border border-black/10 bg-white px-2 py-1 text-sm text-black dark:border-white/10 dark:bg-black dark:text-white"
                  type="number"
                  value={rule.amount}
                  onChange={(event) => {
                    const next = [...schema.targeting];
                    next[index] = { ...rule, amount: Number(event.target.value) } as TargetingRule;
                    onUpdateTargeting(next);
                  }}
                />
              ) : null}

              {"device" in rule ? (
                <select
                  className="w-full rounded border border-black/10 bg-white px-2 py-1 text-sm text-black dark:border-white/10 dark:bg-black dark:text-white"
                  value={rule.device}
                  onChange={(event) => {
                    const next = [...schema.targeting];
                    next[index] = { ...rule, device: event.target.value as "desktop" | "mobile" } as TargetingRule;
                    onUpdateTargeting(next);
                  }}
                >
                  <option value="desktop">desktop</option>
                  <option value="mobile">mobile</option>
                </select>
              ) : null}

              {"count" in rule ? (
                <input
                  className="w-full rounded border border-black/10 bg-white px-2 py-1 text-sm text-black dark:border-white/10 dark:bg-black dark:text-white"
                  type="number"
                  value={rule.count}
                  onChange={(event) => {
                    const next = [...schema.targeting];
                    next[index] = { ...rule, count: Number(event.target.value) } as TargetingRule;
                    onUpdateTargeting(next);
                  }}
                />
              ) : null}

              {"value" in rule && rule.type === "new_vs_returning" ? (
                <select
                  className="w-full rounded border border-black/10 bg-white px-2 py-1 text-sm text-black dark:border-white/10 dark:bg-black dark:text-white"
                  value={rule.value}
                  onChange={(event) => {
                    const next = [...schema.targeting];
                    next[index] = { ...rule, value: event.target.value as "new" | "returning" } as TargetingRule;
                    onUpdateTargeting(next);
                  }}
                >
                  <option value="new">new</option>
                  <option value="returning">returning</option>
                </select>
              ) : null}

              <button
                className="text-xs text-red-600 dark:text-red-400"
                type="button"
                onClick={() => {
                  const next = schema.targeting.filter((_, idx) => idx !== index);
                  onUpdateTargeting(next);
                }}
              >
                Remove rule
              </button>
            </div>
          ))}
          <button
            className="rounded border border-black/10 px-2 py-1 text-xs text-black/70 dark:border-white/10 dark:text-white/70"
            type="button"
            onClick={() =>
              onUpdateTargeting([...schema.targeting, { type: "url_contains", value: "" }])
            }
          >
            Add rule
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-black">
        <h3 className="text-sm font-semibold text-black dark:text-white">
          Frequency
        </h3>
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-black/70 dark:text-white/70">
          <label className="space-y-1">
            Max per session
            <input
              className="w-full rounded border border-black/10 bg-white px-2 py-1 text-sm text-black dark:border-white/10 dark:bg-black dark:text-white"
              type="number"
              value={schema.frequency.maxPerSession ?? ""}
              onChange={(event) =>
                onUpdateFrequency({
                  ...schema.frequency,
                  maxPerSession: event.target.value
                    ? Number(event.target.value)
                    : null,
                })
              }
            />
          </label>
          <label className="space-y-1">
            Max per 24h
            <input
              className="w-full rounded border border-black/10 bg-white px-2 py-1 text-sm text-black dark:border-white/10 dark:bg-black dark:text-white"
              type="number"
              value={schema.frequency.maxPer24h ?? ""}
              onChange={(event) =>
                onUpdateFrequency({
                  ...schema.frequency,
                  maxPer24h: event.target.value ? Number(event.target.value) : null,
                })
              }
            />
          </label>
          <label className="space-y-1">
            Cooldown after close (h)
            <input
              className="w-full rounded border border-black/10 bg-white px-2 py-1 text-sm text-black dark:border-white/10 dark:bg-black dark:text-white"
              type="number"
              value={schema.frequency.cooldownAfterCloseHours ?? ""}
              onChange={(event) =>
                onUpdateFrequency({
                  ...schema.frequency,
                  cooldownAfterCloseHours: event.target.value
                    ? Number(event.target.value)
                    : null,
                })
              }
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-black/70 dark:text-white/70">
            <input
              type="checkbox"
              checked={schema.frequency.showOnce}
              onChange={(event) =>
                onUpdateFrequency({
                  ...schema.frequency,
                  showOnce: event.target.checked,
                })
              }
            />
            Show once
          </label>
          <label className="flex items-center gap-2 text-sm text-black/70 dark:text-white/70">
            <input
              type="checkbox"
              checked={schema.frequency.perCampaign}
              onChange={(event) =>
                onUpdateFrequency({
                  ...schema.frequency,
                  perCampaign: event.target.checked,
                })
              }
            />
            Per campaign
          </label>
        </div>
      </div>
    </div >
  );
}

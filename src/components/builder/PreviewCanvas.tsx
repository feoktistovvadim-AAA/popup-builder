"use client";

import { CSSProperties } from "react";
import clsx from "clsx";

import { PopupBlock, PopupSchemaV2 } from "@/lib/builder/schema";
import { applyTranslations } from "@/lib/builder/localization";

function renderBlock(block: PopupBlock, isSelected: boolean) {
  const commonClass = clsx(
    isSelected && "ring-2 ring-purple-500 ring-offset-2 ring-offset-transparent"
  );

  switch (block.type) {
    case "headline": {
      const props = block.props as {
        text?: string;
        align?: string;
        color?: string;
      };
      return (
        <h2
          className={clsx("font-semibold leading-tight", commonClass, "w-full")}
          style={{
            fontSize: "24px",
            textAlign: (props.align ?? "left") as CSSProperties["textAlign"],
            color: props.color ?? "#fff",
            margin: 0,
          }}
        >
          {props.text ?? "Headline"}
        </h2>
      );
    }
    case "text": {
      const props = block.props as {
        text?: string;
        align?: string;
        color?: string;
      };
      return (
        <p
          className={clsx("leading-snug", commonClass, "w-full")}
          style={{
            fontSize: "14px",
            textAlign: (props.align ?? "left") as CSSProperties["textAlign"],
            color: props.color ?? "#d1d5db",
            margin: 0,
          }}
        >
          {props.text ?? "Supporting text goes here."}
        </p>
      );
    }
    case "button": {
      const props = block.props as {
        label?: string;
        backgroundColor?: string;
        textColor?: string;
        borderRadius?: number;
        fontSize?: number;
        fullWidth?: boolean;
        borderEnabled?: boolean;
        borderWidth?: number;
        borderColor?: string;
      };
      return (
        <button
          className={clsx("py-2 font-semibold transition-opacity hover:opacity-90", commonClass)}
          style={{
            backgroundColor: props.backgroundColor ?? "#7c3aed",
            color: props.textColor ?? "#fff",
            borderRadius: props.borderRadius ?? 10,
            fontSize: props.fontSize ? `${props.fontSize}px` : "16px",
            width: props.fullWidth ? "100%" : "auto",
            display: props.fullWidth ? "block" : "inline-block",
            border: props.borderEnabled
              ? `${props.borderWidth ?? 1}px solid ${props.borderColor ?? "#fff"}`
              : "none",
            cursor: "pointer",
          }}
          type="button"
        >
          {props.label ?? "Button"}
        </button>
      );
    }
    case "image": {
      const props = block.props as {
        src?: string;
        alt?: string;
        borderRadius?: number;
        width?: number;
      };
      return props.src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className={clsx(commonClass, "block")}
          src={props.src}
          alt={props.alt ?? "Popup image"}
          style={{
            borderRadius: props.borderRadius ?? 12,
            width: props.width ? `${props.width}%` : "100%",
          }}
        />
      ) : (
        <div
          className={clsx(
            "flex h-24 w-full items-center justify-center rounded border border-dashed border-white/30 text-xs text-white/50",
            commonClass
          )}
        >
          Image placeholder
        </div>
      );
    }
    case "spacer": {
      const props = block.props as { height?: number };
      return (
        <div
          className={clsx(commonClass, "w-full")}
          style={{ height: props.height ?? 16 }}
        />
      );
    }
    default:
      return null;
  }
}

export default function PreviewCanvas({
  schema,
  selectedBlockId,
  onSelectBlock,
  currentLang = "en",
}: {
  schema: PopupSchemaV2;
  selectedBlockId: string | null;
  onSelectBlock: (id: string) => void;
  currentLang?: string;
}) {
  // Apply translations for the current language
  const translatedSchema = applyTranslations(schema, currentLang);

  const layout = translatedSchema.template.layout;
  const closeButtonPlacement = layout.closeButtonPlacement || "card";

  const containerStyle: CSSProperties = {
    maxWidth: layout.maxWidthDesktop ? `${layout.maxWidthDesktop}px` : "420px",
    width: "100%",
    padding: layout.paddingDesktop ? `${layout.paddingDesktop}px` : "24px",
    borderRadius: layout.borderRadius ? `${layout.borderRadius}px` : "16px",
    backgroundColor: layout.backgroundColor ?? "#0b0b0f",
    boxShadow:
      layout.shadow === "none"
        ? "none"
        : layout.shadow === "soft"
          ? "0 4px 12px rgba(0,0,0,0.1)" // soft
          : layout.shadow === "strong"
            ? "0 25px 80px rgba(0,0,0,0.5)" // strong
            : "0 20px 60px rgba(0,0,0,0.35)", // medium (default)
    border: layout.borderEnabled
      ? `${layout.borderWidth ?? 1}px solid ${layout.borderColor ?? "#fff"}`
      : "none",
  };

  return (
    <div className="flex h-full min-h-[60vh] max-h-[70vh] items-start justify-center rounded-lg border border-black/10 bg-white pt-8 pb-6 px-6 dark:border-white/10 dark:bg-black">
      <div
        className="relative flex w-full h-full items-center justify-center rounded-lg p-8 transition-all"
        style={{
          backgroundColor: layout.overlayColor ?? "rgba(0,0,0,0.6)",
          backdropFilter: layout.overlayBlur ? `blur(${layout.overlayBlur}px)` : "none",
        }}
      >
        {/* Close button on overlay/screen */}
        {layout.showClose && closeButtonPlacement === "screen" ? (
          <button
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white text-2xl leading-none cursor-pointer border-0"
            style={{ fontSize: "24px" }}
            type="button"
          >
            ×
          </button>
        ) : null}

        <div
          className={clsx(
            "relative transition-all",
            layout.position === "center" && "mx-auto my-auto",
            layout.position === "top-left" && "mr-auto mb-auto",
            layout.position === "top-center" && "mx-auto mb-auto",
            layout.position === "top-right" && "ml-auto mb-auto",
            layout.position === "bottom-left" && "mr-auto mt-auto",
            layout.position === "bottom-center" && "mx-auto mt-auto",
            layout.position === "bottom-right" && "ml-auto mt-auto"
          )}
          style={containerStyle}
        >
          {/* Close button on card */}
          {layout.showClose && closeButtonPlacement === "card" ? (
            <button
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white text-2xl leading-none cursor-pointer border-0"
              style={{ fontSize: "24px" }}
              type="button"
            >
              ×
            </button>
          ) : null}

          <div className="space-y-4">
            {translatedSchema.blocks.map((block) => (
              <div
                key={block.id}
                onClick={() => onSelectBlock(block.id)}
                className="cursor-pointer"
              >
                {renderBlock(block, block.id === selectedBlockId)}
              </div>
            ))}
            {translatedSchema.blocks.length === 0 ? (
              <p className="text-sm text-white/60">
                Add blocks to see a live preview.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { CSSProperties } from "react";
import clsx from "clsx";

import { PopupBlock, PopupSchemaV2 } from "@/lib/builder/schema";

function renderBlock(block: PopupBlock, isSelected: boolean) {
  const commonClass = clsx(
    "w-full",
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
          className={clsx("text-2xl font-semibold", commonClass)}
          style={{
            textAlign: (props.align ?? "left") as CSSProperties["textAlign"],
            color: props.color ?? "#fff",
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
          className={clsx("text-sm leading-6", commonClass)}
          style={{
            textAlign: (props.align ?? "left") as CSSProperties["textAlign"],
            color: props.color ?? "#d1d5db",
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
      };
      return (
        <button
          className={clsx("w-full py-2 text-sm font-semibold", commonClass)}
          style={{
            backgroundColor: props.backgroundColor ?? "#7c3aed",
            color: props.textColor ?? "#fff",
            borderRadius: props.borderRadius ?? 10,
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
          className={commonClass}
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
            "flex h-24 items-center justify-center rounded border border-dashed border-white/30 text-xs text-white/50",
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
          className={commonClass}
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
}: {
  schema: PopupSchemaV2;
  selectedBlockId: string | null;
  onSelectBlock: (id: string) => void;
}) {
  const layout = schema.template.layout;
  const containerStyle: CSSProperties = {
    maxWidth: layout.maxWidthDesktop ?? 420,
    width: "100%",
    padding: layout.paddingDesktop ?? 24,
    borderRadius: layout.borderRadius ?? 16,
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
    <div className="flex h-full min-h-[480px] items-center justify-center rounded-lg border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-black">
      <div
        className="relative flex w-full h-full items-center justify-center rounded-lg p-8 transition-all"
        style={{
          backgroundColor: layout.overlayColor ?? "rgba(0,0,0,0.6)",
          backdropFilter: layout.overlayBlur ? `blur(${layout.overlayBlur}px)` : "none",
        }}
      >
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
          {layout.showClose ? (
            <div className="mb-4 flex justify-end">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white/60">
                ×
              </div>
            </div>
          ) : null}
          <div className="space-y-4">
            {schema.blocks.map((block) => (
              <div
                key={block.id}
                onClick={() => onSelectBlock(block.id)}
                className="cursor-pointer"
              >
                {renderBlock(block, block.id === selectedBlockId)}
              </div>
            ))}
            {schema.blocks.length === 0 ? (
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

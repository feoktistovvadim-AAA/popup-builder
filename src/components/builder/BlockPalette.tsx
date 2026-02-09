"use client";

import { BlockType } from "@/lib/builder/schema";

const blockOptions: { type: BlockType; label: string }[] = [
  { type: "headline", label: "Headline" },
  { type: "text", label: "Text" },
  { type: "button", label: "Button" },
  { type: "image", label: "Image" },
  { type: "spacer", label: "Spacer" },
];

export default function BlockPalette({
  onAddBlock,
}: {
  onAddBlock: (type: BlockType) => void;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-black/60 dark:text-white/60">
        Add blocks
      </h3>
      <div className="space-y-2">
        {blockOptions.map((option) => (
          <button
            key={option.type}
            className="w-full rounded border border-black/10 px-3 py-2 text-left text-sm text-black/80 hover:bg-black/[.04] dark:border-white/10 dark:text-white/80 dark:hover:bg-white/[.06]"
            type="button"
            onClick={() => onAddBlock(option.type)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

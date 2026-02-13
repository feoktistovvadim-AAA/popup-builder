"use client";

import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";

import { PopupBlock } from "@/lib/builder/schema";

function BlockListItem({
  block,
  isSelected,
  onSelect,
  onDelete,
}: {
  block: PopupBlock;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        "flex items-center justify-between gap-2 rounded border px-3 py-2 text-sm",
        isSelected
          ? "border-black bg-black/[.04] text-black dark:border-white dark:bg-white/[.08] dark:text-white"
          : "border-black/10 text-black/70 dark:border-white/10 dark:text-white/70"
      )}
    >
      <button
        className="flex-1 text-left"
        type="button"
        onClick={onSelect}
      >
        <span className="text-xs uppercase tracking-wide">
          {block.type}
        </span>
      </button>
      <button
        className="rounded p-1 text-black/50 hover:bg-black/[.08] dark:text-white/50 dark:hover:bg-white/[.12]"
        type="button"
        onClick={onDelete}
        aria-label="Удалить блок"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
          <path
            d="M6 7h12M9 7V5h6v2m-7 3v7m4-7v7m4-7v7M7 7l1 12h8l1-12"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      </button>
      <button
        className="cursor-grab rounded p-1 text-black/50 hover:bg-black/[.08] dark:text-white/50 dark:hover:bg-white/[.12]"
        type="button"
        aria-label="Переместить блок"
        {...attributes}
        {...listeners}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
          <path
            d="M9 7h.01M9 12h.01M9 17h.01M15 7h.01M15 12h.01M15 17h.01"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}

export default function BlockList({
  blocks,
  selectedBlockId,
  onSelectBlock,
  onDeleteBlock,
  onReorder,
}: {
  blocks: PopupBlock[];
  selectedBlockId: string | null;
  onSelectBlock: (id: string) => void;
  onDeleteBlock: (id: string) => void;
  onReorder: (next: PopupBlock[]) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-black/60 dark:text-white/60">
        Список блоков
      </h3>
      <DndContext
        sensors={sensors}
        onDragEnd={({ active, over }) => {
          if (!over || active.id === over.id) return;
          const oldIndex = blocks.findIndex((block) => block.id === active.id);
          const newIndex = blocks.findIndex((block) => block.id === over.id);
          onReorder(arrayMove(blocks, oldIndex, newIndex));
        }}
      >
        <SortableContext items={blocks.map((block) => block.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {blocks.map((block) => (
              <BlockListItem
                key={block.id}
                block={block}
                isSelected={block.id === selectedBlockId}
                onSelect={() => onSelectBlock(block.id)}
                onDelete={() => onDeleteBlock(block.id)}
              />
            ))}
            {blocks.length === 0 ? (
              <p className="rounded border border-dashed border-black/20 p-3 text-xs text-black/50 dark:border-white/20 dark:text-white/50">
                Добавьте блоки для создания попапа.
              </p>
            ) : null}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

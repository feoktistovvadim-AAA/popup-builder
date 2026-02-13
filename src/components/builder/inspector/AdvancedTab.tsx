"use client";

import { useState } from "react";
import { PopupSchemaV2 } from "@/lib/builder/schema";

const inputCls = "w-full rounded-md border px-2.5 py-1.5 text-sm text-black outline-none transition-colors focus:border-black/30 dark:text-white dark:focus:border-white/30";
const inputStyle = { borderColor: "var(--border)", background: "var(--surface)" };
const labelCls = "space-y-1.5 text-xs font-medium text-black/60 dark:text-white/60";

export default function AdvancedTab({
    schema,
    onUpdateLayout,
}: {
    schema: PopupSchemaV2;
    onUpdateLayout: (next: PopupSchemaV2["template"]["layout"]) => void;
}) {
    const layout = schema.template.layout;
    const [showJson, setShowJson] = useState(false);

    return (
        <div className="space-y-4">
            {/* Animation */}
            <section className="rounded-lg p-4 space-y-3" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-black/40 dark:text-white/40">
                    Animation
                </h3>
                <label className={labelCls}>
                    Entry Animation
                    <select className={inputCls} style={inputStyle}
                        value={layout.animation}
                        onChange={(e) => onUpdateLayout({ ...layout, animation: e.target.value as typeof layout.animation })}>
                        <option value="fade">Fade</option>
                        <option value="slide">Slide</option>
                    </select>
                </label>
            </section>

            {/* Close Behavior */}
            <section className="rounded-lg p-4 space-y-3" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-black/40 dark:text-white/40">
                    Close Behavior
                </h3>
                <label className="flex items-center gap-3 text-sm text-black/70 dark:text-white/70 cursor-pointer">
                    <div className="relative">
                        <input type="checkbox" className="peer sr-only"
                            checked={layout.showClose}
                            onChange={(e) => onUpdateLayout({ ...layout, showClose: e.target.checked })} />
                        <div className="h-5 w-9 rounded-full bg-black/10 peer-checked:bg-black dark:bg-white/10 dark:peer-checked:bg-white transition-colors" />
                        <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm peer-checked:translate-x-4 dark:bg-black transition-transform" />
                    </div>
                    <span className="text-xs font-medium">Show close button</span>
                </label>

                <label className={labelCls}>
                    Close Button Placement
                    <select className={inputCls} style={inputStyle}
                        value={layout.closeButtonPlacement ?? "card"}
                        onChange={(e) => onUpdateLayout({ ...layout, closeButtonPlacement: e.target.value as "card" | "screen" })}>
                        <option value="card">Inside Card (Recommended)</option>
                        <option value="screen">Screen Corner (Legacy)</option>
                    </select>
                </label>

                <label className="flex items-center gap-3 text-sm text-black/70 dark:text-white/70 cursor-pointer">
                    <div className="relative">
                        <input type="checkbox" className="peer sr-only"
                            checked={layout.overlayClickToClose ?? true}
                            onChange={(e) => onUpdateLayout({ ...layout, overlayClickToClose: e.target.checked })} />
                        <div className="h-5 w-9 rounded-full bg-black/10 peer-checked:bg-black dark:bg-white/10 dark:peer-checked:bg-white transition-colors" />
                        <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm peer-checked:translate-x-4 dark:bg-black transition-transform" />
                    </div>
                    <span className="text-xs font-medium">Overlay click closes popup</span>
                </label>
            </section>

            {/* Debug / JSON */}
            <section className="rounded-lg p-4 space-y-3" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
                <button
                    type="button"
                    className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wider text-black/40 dark:text-white/40 hover:text-black/60 dark:hover:text-white/60 transition-colors"
                    onClick={() => setShowJson(!showJson)}
                >
                    <span>Debug / JSON</span>
                    <svg
                        viewBox="0 0 24 24"
                        className={`h-4 w-4 transition-transform ${showJson ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                    >
                        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
                {showJson && (
                    <div className="rounded-md p-3 text-[11px] font-mono text-black/60 dark:text-white/60 overflow-x-auto animate-fade-in" style={{ background: "var(--surface-secondary)" }}>
                        <pre className="whitespace-pre-wrap">
                            {JSON.stringify(schema, null, 2)}
                        </pre>
                    </div>
                )}
            </section>
        </div>
    );
}

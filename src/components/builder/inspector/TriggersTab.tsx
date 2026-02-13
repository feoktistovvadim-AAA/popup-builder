"use client";

import { Trigger } from "@/lib/builder/schema";

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

const triggerLabels: Record<string, string> = {
    after_seconds: "After Seconds",
    scroll_percent: "Scroll Percentage",
    exit_intent_desktop: "Exit Intent (Desktop)",
    smart_exit_intent: "Smart Exit Intent",
    custom_event: "Custom JS Event",
    inactivity: "User Inactivity",
    pageview_count: "Pageview Count",
    url_match: "URL Match",
    device_is: "Device Type",
};

const triggerDescriptions: Record<string, string> = {
    after_seconds: "Show after a specified time delay",
    scroll_percent: "Show when user scrolls to a percentage",
    exit_intent_desktop: "Detect cursor leaving the viewport",
    smart_exit_intent: "Multi-signal exit intent detection",
    custom_event: "Trigger via JavaScript custom event",
    inactivity: "Show after user goes idle",
    pageview_count: "Show after N page views",
    url_match: "Show on matching URLs only",
    device_is: "Show on specific device type",
};

const inputCls = "w-full rounded-md border px-2.5 py-1.5 text-sm text-black outline-none transition-colors focus:border-black/30 dark:text-white dark:focus:border-white/30";
const inputStyle = { borderColor: "var(--border)", background: "var(--surface)" };

function getTriggerParam<T>(trigger: Trigger, key: string, fallback: T): T {
    if (trigger.params && key in trigger.params) {
        return (trigger.params as Record<string, unknown>)[key] as T;
    }
    if (key in trigger) {
        return (trigger as Record<string, unknown>)[key] as T;
    }
    return fallback;
}

function setTriggerParam(trigger: Trigger, key: string, value: unknown) {
    return {
        ...trigger,
        params: { ...(trigger.params ?? {}), [key]: value },
    };
}

export default function TriggersTab({
    triggers,
    onUpdateTriggers,
}: {
    triggers: Trigger[];
    onUpdateTriggers: (triggers: Trigger[]) => void;
}) {
    return (
        <div className="space-y-3">
            {triggers.length === 0 && (
                <p className="text-xs text-black/40 dark:text-white/40 py-4 text-center">
                    No triggers configured. Add one to control when the popup appears.
                </p>
            )}

            {triggers.map((trigger, index) => (
                <div
                    key={`${trigger.type}-${index}`}
                    className="rounded-lg p-4 space-y-3 card-hover"
                    style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
                >
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                            <select
                                className={`${inputCls} font-medium`}
                                style={inputStyle}
                                value={trigger.type}
                                onChange={(e) => {
                                    const next = [...triggers];
                                    next[index] = { type: e.target.value as Trigger["type"] } as Trigger;
                                    onUpdateTriggers(next);
                                }}
                            >
                                {triggerOptions.map((option) => (
                                    <option key={option} value={option}>
                                        {triggerLabels[option] ?? option}
                                    </option>
                                ))}
                            </select>
                            <p className="mt-1 text-[11px] text-black/40 dark:text-white/40">
                                {triggerDescriptions[trigger.type] ?? ""}
                            </p>
                        </div>
                        <button
                            className="shrink-0 rounded-md p-1.5 text-black/30 hover:bg-red-50 hover:text-red-600 dark:text-white/30 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors"
                            type="button"
                            title="Remove trigger"
                            onClick={() => {
                                const next = triggers.filter((_, idx) => idx !== index);
                                onUpdateTriggers(next);
                            }}
                        >
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>

                    {/* Parameter inputs */}
                    <div className="space-y-2">
                        {(trigger.type === "after_seconds" || trigger.type === "inactivity") && (
                            <label className="space-y-1 text-xs font-medium text-black/60 dark:text-white/60">
                                Seconds
                                <input className={inputCls} style={inputStyle} type="number"
                                    value={getTriggerParam(trigger, "seconds", 5)}
                                    onChange={(e) => {
                                        const next = [...triggers];
                                        next[index] = setTriggerParam(trigger, "seconds", Number(e.target.value)) as Trigger;
                                        onUpdateTriggers(next);
                                    }} />
                            </label>
                        )}

                        {trigger.type === "scroll_percent" && (
                            <label className="space-y-1 text-xs font-medium text-black/60 dark:text-white/60">
                                Scroll Percentage
                                <input className={inputCls} style={inputStyle} type="number"
                                    value={getTriggerParam(trigger, "percent", 10)}
                                    onChange={(e) => {
                                        const next = [...triggers];
                                        next[index] = setTriggerParam(trigger, "percent", Number(e.target.value)) as Trigger;
                                        onUpdateTriggers(next);
                                    }} />
                            </label>
                        )}

                        {trigger.type === "custom_event" && (
                            <label className="space-y-1 text-xs font-medium text-black/60 dark:text-white/60">
                                Event Name
                                <input className={inputCls} style={inputStyle}
                                    placeholder="e.g. show_bonus_popup"
                                    value={getTriggerParam(trigger, "name", trigger.eventName ?? "")}
                                    onChange={(e) => {
                                        const next = [...triggers];
                                        next[index] = setTriggerParam(trigger, "name", e.target.value) as Trigger;
                                        onUpdateTriggers(next);
                                    }} />
                            </label>
                        )}

                        {trigger.type === "url_match" && (
                            <div className="space-y-2">
                                <label className="space-y-1 text-xs font-medium text-black/60 dark:text-white/60">
                                    URL Pattern
                                    <input className={inputCls} style={inputStyle}
                                        placeholder="/cashier, /deposit/*"
                                        value={getTriggerParam(trigger, "pattern", "")}
                                        onChange={(e) => {
                                            const next = [...triggers];
                                            next[index] = setTriggerParam(trigger, "pattern", e.target.value) as Trigger;
                                            onUpdateTriggers(next);
                                        }} />
                                </label>
                                <label className="space-y-1 text-xs font-medium text-black/60 dark:text-white/60">
                                    Match Mode
                                    <select className={inputCls} style={inputStyle}
                                        value={getTriggerParam(trigger, "match", "contains")}
                                        onChange={(e) => {
                                            const next = [...triggers];
                                            next[index] = setTriggerParam(trigger, "match", e.target.value) as Trigger;
                                            onUpdateTriggers(next);
                                        }}>
                                        <option value="contains">Contains</option>
                                        <option value="equals">Equals</option>
                                        <option value="regex">Regex</option>
                                    </select>
                                </label>
                            </div>
                        )}

                        {trigger.type === "pageview_count" && (
                            <label className="space-y-1 text-xs font-medium text-black/60 dark:text-white/60">
                                Page View Count
                                <input className={inputCls} style={inputStyle} type="number"
                                    value={getTriggerParam(trigger, "count", 1)}
                                    onChange={(e) => {
                                        const next = [...triggers];
                                        next[index] = setTriggerParam(trigger, "count", Number(e.target.value)) as Trigger;
                                        onUpdateTriggers(next);
                                    }} />
                            </label>
                        )}

                        {trigger.type === "device_is" && (
                            <label className="space-y-1 text-xs font-medium text-black/60 dark:text-white/60">
                                Device
                                <select className={inputCls} style={inputStyle}
                                    value={getTriggerParam(trigger, "device", "desktop")}
                                    onChange={(e) => {
                                        const next = [...triggers];
                                        next[index] = setTriggerParam(trigger, "device", e.target.value as "desktop" | "mobile") as Trigger;
                                        onUpdateTriggers(next);
                                    }}>
                                    <option value="desktop">Desktop</option>
                                    <option value="mobile">Mobile</option>
                                </select>
                            </label>
                        )}

                        {trigger.type === "exit_intent_desktop" && (
                            <label className="space-y-1 text-xs font-medium text-black/60 dark:text-white/60">
                                Sensitivity (px from top)
                                <input className={inputCls} style={inputStyle} type="number"
                                    value={getTriggerParam(trigger, "sensitivity", 10)}
                                    onChange={(e) => {
                                        const next = [...triggers];
                                        next[index] = setTriggerParam(trigger, "sensitivity", Number(e.target.value)) as Trigger;
                                        onUpdateTriggers(next);
                                    }} />
                            </label>
                        )}

                        {trigger.type === "smart_exit_intent" && (
                            <>
                                <label className="space-y-1 text-xs font-medium text-black/60 dark:text-white/60">
                                    Desktop Sensitivity (px)
                                    <input className={inputCls} style={inputStyle} type="number"
                                        value={getTriggerParam(trigger, "sensitivity", 10)}
                                        onChange={(e) => {
                                            const next = [...triggers];
                                            next[index] = setTriggerParam(trigger, "sensitivity", Number(e.target.value)) as Trigger;
                                            onUpdateTriggers(next);
                                        }} />
                                </label>
                                <label className="space-y-1 text-xs font-medium text-black/60 dark:text-white/60">
                                    Mobile Scroll Velocity (px/s)
                                    <input className={inputCls} style={inputStyle} type="number"
                                        value={getTriggerParam(trigger, "scrollVelocityThreshold", 800)}
                                        onChange={(e) => {
                                            const next = [...triggers];
                                            next[index] = setTriggerParam(trigger, "scrollVelocityThreshold", Number(e.target.value)) as Trigger;
                                            onUpdateTriggers(next);
                                        }} />
                                </label>
                                <label className="space-y-1 text-xs font-medium text-black/60 dark:text-white/60">
                                    Mobile Top Scroll (px)
                                    <input className={inputCls} style={inputStyle} type="number"
                                        value={getTriggerParam(trigger, "topScrollThreshold", 120)}
                                        onChange={(e) => {
                                            const next = [...triggers];
                                            next[index] = setTriggerParam(trigger, "topScrollThreshold", Number(e.target.value)) as Trigger;
                                            onUpdateTriggers(next);
                                        }} />
                                </label>
                            </>
                        )}
                    </div>
                </div>
            ))}

            <button
                className="w-full rounded-lg border border-dashed px-3 py-2.5 text-xs font-medium text-black/50 hover:border-black/20 hover:text-black/70 dark:text-white/50 dark:hover:border-white/20 dark:hover:text-white/70 transition-colors"
                style={{ borderColor: "var(--border)" }}
                type="button"
                onClick={() => onUpdateTriggers([...triggers, { type: "after_seconds", seconds: 5 }])}
            >
                + Add trigger
            </button>
        </div>
    );
}

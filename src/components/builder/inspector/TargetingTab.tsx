"use client";

import { TargetingRule } from "@/lib/builder/schema";

const targetingOptions: TargetingRule["type"][] = [
    "vip_level_is",
    "balance_lt",
    "device_is",
    "url_contains",
    "new_vs_returning",
    "sessions_count",
    "referrer_contains",
];

const targetingLabels: Record<string, string> = {
    vip_level_is: "VIP Level",
    balance_lt: "Balance Less Than",
    device_is: "Device Type",
    url_contains: "URL Contains",
    new_vs_returning: "New vs Returning",
    sessions_count: "Sessions Count",
    referrer_contains: "Referrer Contains",
};

const targetingDescriptions: Record<string, string> = {
    vip_level_is: "Target users with a specific VIP level",
    balance_lt: "Target users with balance below a threshold",
    device_is: "Target desktop or mobile users",
    url_contains: "Target users on pages matching a URL pattern",
    new_vs_returning: "Target new or returning visitors",
    sessions_count: "Target users based on session count",
    referrer_contains: "Target users from specific referrer",
};

const inputCls = "w-full rounded-md border px-2.5 py-1.5 text-sm text-black outline-none transition-colors focus:border-black/30 dark:text-white dark:focus:border-white/30";
const inputStyle = { borderColor: "var(--border)", background: "var(--surface)" };

export default function TargetingTab({
    targeting,
    onUpdateTargeting,
}: {
    targeting: TargetingRule[];
    onUpdateTargeting: (targeting: TargetingRule[]) => void;
}) {
    return (
        <div className="space-y-3">
            {targeting.length === 0 && (
                <p className="text-xs text-black/40 dark:text-white/40 py-4 text-center">
                    No targeting rules. Add one to control who sees this popup.
                </p>
            )}

            {targeting.map((rule, index) => (
                <div
                    key={`${rule.type}-${index}`}
                    className="rounded-lg p-4 space-y-3 card-hover"
                    style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
                >
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                            <select
                                className={`${inputCls} font-medium`}
                                style={inputStyle}
                                value={rule.type}
                                onChange={(e) => {
                                    const next = [...targeting];
                                    next[index] = { type: e.target.value as TargetingRule["type"] } as TargetingRule;
                                    onUpdateTargeting(next);
                                }}
                            >
                                {targetingOptions.map((option) => (
                                    <option key={option} value={option}>
                                        {targetingLabels[option] ?? option}
                                    </option>
                                ))}
                            </select>
                            <p className="mt-1 text-[11px] text-black/40 dark:text-white/40">
                                {targetingDescriptions[rule.type] ?? ""}
                            </p>
                        </div>
                        <button
                            className="shrink-0 rounded-md p-1.5 text-black/30 hover:bg-red-50 hover:text-red-600 dark:text-white/30 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors"
                            type="button"
                            title="Remove rule"
                            onClick={() => {
                                const next = targeting.filter((_, idx) => idx !== index);
                                onUpdateTargeting(next);
                            }}
                        >
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>

                    {/* Value inputs */}
                    <div className="space-y-2">
                        {"value" in rule && rule.type === "new_vs_returning" && (
                            <label className="space-y-1 text-xs font-medium text-black/60 dark:text-white/60">
                                Visitor Type
                                <select className={inputCls} style={inputStyle}
                                    value={rule.value}
                                    onChange={(e) => {
                                        const next = [...targeting];
                                        next[index] = { ...rule, value: e.target.value as "new" | "returning" } as TargetingRule;
                                        onUpdateTargeting(next);
                                    }}>
                                    <option value="new">New</option>
                                    <option value="returning">Returning</option>
                                </select>
                            </label>
                        )}

                        {"value" in rule && rule.type !== "new_vs_returning" && (
                            <label className="space-y-1 text-xs font-medium text-black/60 dark:text-white/60">
                                Value
                                <input className={inputCls} style={inputStyle}
                                    value={rule.value}
                                    onChange={(e) => {
                                        const next = [...targeting];
                                        next[index] = { ...rule, value: e.target.value } as TargetingRule;
                                        onUpdateTargeting(next);
                                    }} />
                            </label>
                        )}

                        {"amount" in rule && (
                            <label className="space-y-1 text-xs font-medium text-black/60 dark:text-white/60">
                                Amount
                                <input className={inputCls} style={inputStyle} type="number"
                                    value={rule.amount}
                                    onChange={(e) => {
                                        const next = [...targeting];
                                        next[index] = { ...rule, amount: Number(e.target.value) } as TargetingRule;
                                        onUpdateTargeting(next);
                                    }} />
                            </label>
                        )}

                        {"device" in rule && (
                            <label className="space-y-1 text-xs font-medium text-black/60 dark:text-white/60">
                                Device
                                <select className={inputCls} style={inputStyle}
                                    value={rule.device}
                                    onChange={(e) => {
                                        const next = [...targeting];
                                        next[index] = { ...rule, device: e.target.value as "desktop" | "mobile" } as TargetingRule;
                                        onUpdateTargeting(next);
                                    }}>
                                    <option value="desktop">Desktop</option>
                                    <option value="mobile">Mobile</option>
                                </select>
                            </label>
                        )}

                        {"count" in rule && (
                            <label className="space-y-1 text-xs font-medium text-black/60 dark:text-white/60">
                                Count
                                <input className={inputCls} style={inputStyle} type="number"
                                    value={rule.count}
                                    onChange={(e) => {
                                        const next = [...targeting];
                                        next[index] = { ...rule, count: Number(e.target.value) } as TargetingRule;
                                        onUpdateTargeting(next);
                                    }} />
                            </label>
                        )}
                    </div>
                </div>
            ))}

            <button
                className="w-full rounded-lg border border-dashed px-3 py-2.5 text-xs font-medium text-black/50 hover:border-black/20 hover:text-black/70 dark:text-white/50 dark:hover:border-white/20 dark:hover:text-white/70 transition-colors"
                style={{ borderColor: "var(--border)" }}
                type="button"
                onClick={() => onUpdateTargeting([...targeting, { type: "url_contains", value: "" }])}
            >
                + Add targeting rule
            </button>
        </div>
    );
}

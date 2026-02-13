"use client";

import { useState } from "react";
import clsx from "clsx";

import {
    FrequencyConfig,
    PopupBlock,
    PopupSchemaV2,
    TargetingRule,
    Trigger,
} from "@/lib/builder/schema";

import DesignTab from "./DesignTab";
import TriggersTab from "./TriggersTab";
import TargetingTab from "./TargetingTab";
import FrequencyTab from "./FrequencyTab";
import AdvancedTab from "./AdvancedTab";

const tabs = [
    { id: "design", label: "Дизайн" },
    { id: "triggers", label: "Триггеры" },
    { id: "targeting", label: "Таргетинг" },
    { id: "frequency", label: "Частота" },
    { id: "advanced", label: "Ещё" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function InspectorTabs({
    schema,
    selectedBlock,
    onUpdateBlock,
    onUpdateLayout,
    onUpdateTriggers,
    onUpdateTargeting,
    onUpdateFrequency,
}: {
    schema: PopupSchemaV2;
    selectedBlock: PopupBlock | null;
    onUpdateBlock: (id: string, nextProps: Record<string, unknown>) => void;
    onUpdateLayout: (next: PopupSchemaV2["template"]["layout"]) => void;
    onUpdateTriggers: (triggers: Trigger[]) => void;
    onUpdateTargeting: (targeting: TargetingRule[]) => void;
    onUpdateFrequency: (frequency: FrequencyConfig) => void;
}) {
    const [activeTab, setActiveTab] = useState<TabId>("design");

    return (
        <div className="space-y-4">
            {/* Tab Switcher */}
            <div className="flex gap-1 rounded-lg p-1" style={{ background: "var(--surface-secondary)", border: "1px solid var(--border)" }}>
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={clsx(
                            "inspector-tab flex-1 rounded-md px-2 py-1.5 text-[11px] font-semibold leading-none tracking-wide uppercase transition-all",
                            activeTab === tab.id
                                ? "bg-black text-white shadow-sm dark:bg-white dark:text-black"
                                : "text-black/50 hover:text-black/80 dark:text-white/50 dark:hover:text-white/80"
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Active Tab Content */}
            <div className="animate-fade-in">
                {activeTab === "design" && (
                    <DesignTab
                        schema={schema}
                        selectedBlock={selectedBlock}
                        onUpdateBlock={onUpdateBlock}
                        onUpdateLayout={onUpdateLayout}
                    />
                )}
                {activeTab === "triggers" && (
                    <TriggersTab
                        triggers={schema.triggers}
                        onUpdateTriggers={onUpdateTriggers}
                    />
                )}
                {activeTab === "targeting" && (
                    <TargetingTab
                        targeting={schema.targeting}
                        onUpdateTargeting={onUpdateTargeting}
                    />
                )}
                {activeTab === "frequency" && (
                    <FrequencyTab
                        frequency={schema.frequency}
                        onUpdateFrequency={onUpdateFrequency}
                    />
                )}
                {activeTab === "advanced" && (
                    <AdvancedTab
                        schema={schema}
                        onUpdateLayout={onUpdateLayout}
                    />
                )}
            </div>
        </div>
    );
}

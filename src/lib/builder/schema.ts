import { nanoid } from "nanoid";

export type BlockType = "headline" | "text" | "button" | "image" | "spacer";

export type PopupBlock = {
  id: string;
  type: BlockType;
  props: Record<string, unknown>;
};

export type LayoutSettings = {
  padding: number;
  maxWidth: number;
  borderRadius: number;
  backgroundColor: string;
  overlayColor: string;
  animation: "fade" | "slide";
  position: "center" | "bottom" | "side";
  showClose: boolean;
};

export type Trigger =
  | {
      type: "after_seconds";
      enabled?: boolean;
      params?: { seconds: number };
      seconds?: number;
    }
  | {
      type: "scroll_percent";
      enabled?: boolean;
      params?: { percent: number };
      percent?: number;
    }
  | {
      type: "exit_intent_desktop";
      enabled?: boolean;
      params?: { sensitivity?: number };
      sensitivity?: number;
    }
  | {
      type: "custom_event";
      enabled?: boolean;
      params?: { name: string };
      eventName?: string;
    }
  | {
      type: "inactivity";
      enabled?: boolean;
      params?: { seconds: number };
      seconds?: number;
    }
  | {
      type: "pageview_count";
      enabled?: boolean;
      params?: { count: number };
      count?: number;
    }
  | {
      type: "url_match";
      enabled?: boolean;
      params?: { pattern: string; match?: "contains" | "equals" | "regex" };
      pattern?: string;
      match?: "contains" | "equals" | "regex";
    }
  | {
      type: "device_is";
      enabled?: boolean;
      params?: { device: "desktop" | "mobile" };
      device?: "desktop" | "mobile";
    };

export type TargetingRule =
  | { type: "vip_level_is"; value: string }
  | { type: "balance_lt"; amount: number }
  | { type: "device_is"; device: "desktop" | "mobile" }
  | { type: "url_contains"; value: string }
  | { type: "new_vs_returning"; value: "new" | "returning" }
  | { type: "sessions_count"; count: number }
  | { type: "referrer_contains"; value: string };

export type FrequencyConfig = {
  maxPerSession: number | null;
  maxPer24h: number | null;
  cooldownAfterCloseHours: number | null;
  showOnce: boolean;
  perCampaign: boolean;
};

export type PopupSchemaV2 = {
  schemaVersion: 2;
  blocks: PopupBlock[];
  template: {
    layout: LayoutSettings;
  };
  triggers: Trigger[];
  triggersMode?: "any" | "all";
  frequency: FrequencyConfig;
  targeting: TargetingRule[];
};

export type PresetKey =
  | "welcome"
  | "vip"
  | "deposit_failed"
  | "responsible_gaming";

const baseLayout: LayoutSettings = {
  padding: 24,
  maxWidth: 420,
  borderRadius: 16,
  backgroundColor: "#0b0b0f",
  overlayColor: "rgba(0,0,0,0.6)",
  animation: "fade",
  position: "center",
  showClose: true,
};

function createBlock(type: BlockType, props: Record<string, unknown>) {
  return {
    id: nanoid(8),
    type,
    props,
  } satisfies PopupBlock;
}

const presets: Record<PresetKey, PopupSchemaV2> = {
  welcome: {
    schemaVersion: 2,
    template: { layout: { ...baseLayout, backgroundColor: "#0f172a" } },
    blocks: [
      createBlock("headline", {
        text: "Welcome Bonus",
        align: "center",
        color: "#ffffff",
      }),
      createBlock("text", {
        text: "Claim your 100% deposit match and start playing instantly.",
        align: "center",
        color: "#cbd5f5",
      }),
      createBlock("button", {
        label: "Go to Cashier",
        url: "/cashier",
        backgroundColor: "#7c3aed",
        textColor: "#ffffff",
      }),
    ],
    triggers: [{ type: "after_seconds", seconds: 6 }],
    frequency: {
      maxPerSession: 1,
      maxPer24h: 2,
      cooldownAfterCloseHours: 6,
      showOnce: false,
      perCampaign: true,
    },
    targeting: [],
  },
  vip: {
    schemaVersion: 2,
    template: { layout: { ...baseLayout, backgroundColor: "#111827" } },
    blocks: [
      createBlock("headline", {
        text: "VIP Bonus Unlocked",
        align: "center",
        color: "#fbbf24",
      }),
      createBlock("text", {
        text: "Exclusive reload bonus for VIP players. Limited time only.",
        align: "center",
        color: "#e5e7eb",
      }),
      createBlock("button", {
        label: "Claim VIP Bonus",
        url: "/vip",
        backgroundColor: "#f59e0b",
        textColor: "#0f172a",
      }),
    ],
    triggers: [{ type: "after_seconds", seconds: 8 }],
    frequency: {
      maxPerSession: 1,
      maxPer24h: 1,
      cooldownAfterCloseHours: 12,
      showOnce: false,
      perCampaign: true,
    },
    targeting: [{ type: "vip_level_is", value: "gold" }],
  },
  deposit_failed: {
    schemaVersion: 2,
    template: { layout: { ...baseLayout, backgroundColor: "#111827" } },
    blocks: [
      createBlock("headline", {
        text: "Deposit Failed",
        align: "center",
        color: "#f87171",
      }),
      createBlock("text", {
        text: "We could not process your last deposit. Please retry.",
        align: "center",
        color: "#e5e7eb",
      }),
      createBlock("button", {
        label: "Retry Deposit",
        url: "/cashier",
        backgroundColor: "#ef4444",
        textColor: "#ffffff",
      }),
    ],
    triggers: [{ type: "custom_event", eventName: "deposit_failed" }],
    frequency: {
      maxPerSession: 2,
      maxPer24h: 4,
      cooldownAfterCloseHours: 1,
      showOnce: false,
      perCampaign: false,
    },
    targeting: [],
  },
  responsible_gaming: {
    schemaVersion: 2,
    template: { layout: { ...baseLayout, backgroundColor: "#0f172a" } },
    blocks: [
      createBlock("headline", {
        text: "Play Responsibly",
        align: "center",
        color: "#38bdf8",
      }),
      createBlock("text", {
        text: "Need a break? Set your limits or take a timeout.",
        align: "center",
        color: "#cbd5f5",
      }),
      createBlock("button", {
        label: "Manage Limits",
        url: "/responsible-gaming",
        backgroundColor: "#38bdf8",
        textColor: "#0f172a",
      }),
    ],
    triggers: [{ type: "after_seconds", seconds: 12 }],
    frequency: {
      maxPerSession: 1,
      maxPer24h: 1,
      cooldownAfterCloseHours: 24,
      showOnce: false,
      perCampaign: true,
    },
    targeting: [],
  },
};

export function createDefaultSchema(preset: PresetKey = "welcome"): PopupSchemaV2 {
  return JSON.parse(JSON.stringify(presets[preset])) as PopupSchemaV2;
}

export function createEmptySchema(): PopupSchemaV2 {
  return {
    schemaVersion: 2,
    blocks: [],
    template: { layout: { ...baseLayout } },
    triggers: [{ type: "after_seconds", seconds: 5 }],
    frequency: {
      maxPerSession: 1,
      maxPer24h: 2,
      cooldownAfterCloseHours: 6,
      showOnce: false,
      perCampaign: true,
    },
    targeting: [],
  };
}

export const presetOptions = [
  { key: "welcome", label: "Welcome Bonus" },
  { key: "vip", label: "VIP Bonus" },
  { key: "deposit_failed", label: "Deposit Failed" },
  { key: "responsible_gaming", label: "Responsible Gaming" },
] as const;

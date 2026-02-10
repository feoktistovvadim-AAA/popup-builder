import { nanoid } from "nanoid";

export type BlockType = "headline" | "text" | "button" | "image" | "spacer";

export type PopupBlock = {
  id: string;
  type: BlockType;
  props: Record<string, unknown>;
};

export type LayoutSettings = {
  // Dimensions
  maxWidthDesktop: number;
  maxWidthMobile: number;
  paddingDesktop: number;
  paddingMobile: number;

  // Style
  borderRadius: number;
  backgroundColor: string; // Hex or gradient
  overlayColor: string; // rgba
  overlayBlur: number; // px

  // Border & Shadow
  borderEnabled: boolean;
  borderWidth: number;
  borderColor: string;
  shadow: "none" | "soft" | "medium" | "strong";

  // Behavior & Position
  animation: "fade" | "slide";
  position:
  | "center"
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";
  showClose: boolean;
};

// ... Triggers ...

const baseLayout: LayoutSettings = {
  maxWidthDesktop: 420,
  maxWidthMobile: 340,
  paddingDesktop: 24,
  paddingMobile: 16,
  borderRadius: 16,
  backgroundColor: "#0b0b0f",
  overlayColor: "rgba(0,0,0,0.6)",
  overlayBlur: 0,
  borderEnabled: false,
  borderWidth: 1,
  borderColor: "#ffffff",
  shadow: "medium",
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

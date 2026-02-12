import { PopupSchemaV2, LocalizationSettings } from "./schema";

/**
 * Apply translations to a schema for a target language
 * @param schema - The popup schema
 * @param targetLang - The target language code (e.g., "ru", "es")
 * @returns Schema with translations applied
 */
export function applyTranslations(
    schema: PopupSchemaV2,
    targetLang: string
): PopupSchemaV2 {
    if (!schema.localization) {
        return schema;
    }

    const loc = schema.localization;
    const baseLang = loc.baseLang || "en";

    // If target is base language or no translations exist, return as-is
    if (targetLang === baseLang || !loc.translations[targetLang]) {
        return schema;
    }

    // Clone schema to avoid mutations
    const translated: PopupSchemaV2 = JSON.parse(JSON.stringify(schema));
    const langTranslations = loc.translations[targetLang].blocks || {};

    // Apply translations to blocks
    translated.blocks = translated.blocks.map((block) => {
        const blockTrans = langTranslations[block.id];
        if (blockTrans) {
            return {
                ...block,
                props: {
                    ...block.props,
                    ...blockTrans,
                },
            };
        }
        return block;
    });

    return translated;
}

/**
 * Get translatable field names for a block type
 */
export function getTranslatableFields(blockType: string): string[] {
    switch (blockType) {
        case "headline":
            return ["text"];
        case "text":
            return ["text"];
        case "button":
            return ["label"];
        case "image":
            return ["alt"];
        default:
            return [];
    }
}

/**
 * Check if a block has missing translations for a language
 */
export function hasMissingTranslations(
    block: { id: string; type: string; props: Record<string, unknown> },
    targetLang: string,
    localization?: LocalizationSettings
): boolean {
    if (!localization || targetLang === localization.baseLang) {
        return false;
    }

    const translatableFields = getTranslatableFields(block.type);
    if (translatableFields.length === 0) {
        return false;
    }

    const blockTranslations = localization.translations[targetLang]?.blocks[block.id];
    if (!blockTranslations) {
        return true;
    }

    // Check if any translatable field is missing
    return translatableFields.some(
        (field) => !(blockTranslations as Record<string, unknown>)[field]
    );
}

/**
 * Default localization settings
 */
export const DEFAULT_LOCALIZATION: LocalizationSettings = {
    baseLang: "en",
    enabledLangs: ["en"],
    translations: {},
};

/**
 * Common language options for the UI
 */
export const COMMON_LANGUAGES = [
    { code: "en", name: "English", flag: "🇬🇧" },
    { code: "es", name: "Spanish", flag: "🇪🇸" },
    { code: "fr", name: "French", flag: "🇫🇷" },
    { code: "de", name: "German", flag: "🇩🇪" },
    { code: "ru", name: "Russian", flag: "🇷🇺" },
    { code: "pt", name: "Portuguese", flag: "🇵🇹" },
    { code: "it", name: "Italian", flag: "🇮🇹" },
    { code: "ja", name: "Japanese", flag: "🇯🇵" },
    { code: "zh", name: "Chinese", flag: "🇨🇳" },
    { code: "ar", name: "Arabic", flag: "🇸🇦" },
    { code: "tr", name: "Turkish", flag: "🇹🇷" },
    { code: "pl", name: "Polish", flag: "🇵🇱" },
    { code: "nl", name: "Dutch", flag: "🇳🇱" },
    { code: "sv", name: "Swedish", flag: "🇸🇪" },
    { code: "ko", name: "Korean", flag: "🇰🇷" },
];

/**
 * Get language name and flag by code
 */
export function getLanguageInfo(code: string) {
    return COMMON_LANGUAGES.find((lang) => lang.code === code) || {
        code,
        name: code.toUpperCase(),
        flag: "🌐",
    };
}

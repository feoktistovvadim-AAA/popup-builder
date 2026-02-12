"use client";

import { useState } from "react";
import { getLanguageInfo, COMMON_LANGUAGES } from "@/lib/builder/localization";

interface ManageLanguagesModalProps {
    isOpen: boolean;
    baseLang: string;
    enabledLangs: string[];
    onClose: () => void;
    onSave: (enabledLangs: string[]) => void;
}

export default function ManageLanguagesModal({
    isOpen,
    baseLang,
    enabledLangs,
    onClose,
    onSave,
}: ManageLanguagesModalProps) {
    const [selectedLangs, setSelectedLangs] = useState<string[]>(enabledLangs);
    const [showAddDropdown, setShowAddDropdown] = useState(false);

    if (!isOpen) return null;

    const availableToAdd = COMMON_LANGUAGES.filter(
        (lang) => !selectedLangs.includes(lang.code)
    );

    const handleAddLanguage = (langCode: string) => {
        setSelectedLangs([...selectedLangs, langCode]);
        setShowAddDropdown(false);
    };

    const handleRemoveLanguage = (langCode: string) => {
        if (langCode === baseLang) return; // Cannot remove base language
        setSelectedLangs(selectedLangs.filter((l) => l !== langCode));
    };

    const handleSave = () => {
        onSave(selectedLangs);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md rounded-lg border border-black/10 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-black">
                <h2 className="mb-4 text-xl font-semibold">Manage Languages</h2>

                {/* Enabled languages list */}
                <div className="mb-4 space-y-2">
                    {selectedLangs.map((lang) => {
                        const langInfo = getLanguageInfo(lang);
                        const isBase = lang === baseLang;
                        return (
                            <div
                                key={lang}
                                className="flex items-center justify-between rounded-md border border-black/10 bg-black/5 px-3 py-2 dark:border-white/10 dark:bg-white/5"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">{langInfo.flag}</span>
                                    <span className="font-medium">{langInfo.name}</span>
                                    {isBase && (
                                        <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                                            Base
                                        </span>
                                    )}
                                </div>
                                {!isBase && (
                                    <button
                                        onClick={() => handleRemoveLanguage(lang)}
                                        className="text-red-600 transition-colors hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                        type="button"
                                    >
                                        <svg
                                            className="h-5 w-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                            />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Add language dropdown */}
                {availableToAdd.length > 0 && (
                    <div className="relative mb-4">
                        <button
                            onClick={() => setShowAddDropdown(!showAddDropdown)}
                            className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-black/20 px-3 py-2 text-sm font-medium transition-colors hover:border-purple-500 hover:bg-purple-50 hover:text-purple-600 dark:border-white/20 dark:hover:border-purple-500 dark:hover:bg-purple-950 dark:hover:text-purple-400"
                            type="button"
                        >
                            <svg
                                className="h-5 w-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 4v16m8-8H4"
                                />
                            </svg>
                            Add Language
                        </button>

                        {showAddDropdown && (
                            <>
                                <div
                                    className="fixed inset-0"
                                    onClick={() => setShowAddDropdown(false)}
                                />
                                <div className="absolute left-0 top-full z-10 mt-2 max-h-60 w-full overflow-y-auto rounded-md border border-black/10 bg-white shadow-lg dark:border-white/10 dark:bg-black">
                                    {availableToAdd.map((lang) => (
                                        <button
                                            key={lang.code}
                                            onClick={() => handleAddLanguage(lang.code)}
                                            className="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                                            type="button"
                                        >
                                            <span className="text-lg">{lang.flag}</span>
                                            <span>{lang.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-md border border-black/10 px-4 py-2 font-medium transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
                        type="button"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-1 rounded-md bg-purple-600 px-4 py-2 font-medium text-white transition-colors hover:bg-purple-700"
                        type="button"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}

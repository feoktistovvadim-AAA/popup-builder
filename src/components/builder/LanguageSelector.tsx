"use client";

import { useState } from "react";
import { getLanguageInfo, COMMON_LANGUAGES } from "@/lib/builder/localization";

interface LanguageSelectorProps {
    currentLang: string;
    enabledLangs: string[];
    onLanguageChange: (lang: string) => void;
    onManageLanguages: () => void;
}

export default function LanguageSelector({
    currentLang,
    enabledLangs,
    onLanguageChange,
    onManageLanguages,
}: LanguageSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const currentLangInfo = getLanguageInfo(currentLang);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/10 dark:bg-black dark:hover:bg-white/5"
                type="button"
            >
                <span className="text-lg">{currentLangInfo.flag}</span>
                <span>{currentLangInfo.name}</span>
                <svg
                    className="h-4 w-4 text-black/60 dark:text-white/60"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                    />
                </svg>
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown */}
                    <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-lg border border-black/10 bg-white shadow-lg dark:border-white/10 dark:bg-black">
                        <div className="p-2">
                            {/* Enabled languages */}
                            <div className="mb-2 space-y-1">
                                {enabledLangs.map((lang) => {
                                    const langInfo = getLanguageInfo(lang);
                                    return (
                                        <button
                                            key={lang}
                                            onClick={() => {
                                                onLanguageChange(lang);
                                                setIsOpen(false);
                                            }}
                                            className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${lang === currentLang
                                                    ? "bg-purple-500 text-white"
                                                    : "hover:bg-black/5 dark:hover:bg-white/5"
                                                }`}
                                            type="button"
                                        >
                                            <span className="text-lg">{langInfo.flag}</span>
                                            <span className="flex-1 text-left">{langInfo.name}</span>
                                            {lang === currentLang && (
                                                <svg
                                                    className="h-4 w-4"
                                                    fill="currentColor"
                                                    viewBox="0 0 20 20"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Manage languages button */}
                            <div className="border-t border-black/10 pt-2 dark:border-white/10">
                                <button
                                    onClick={() => {
                                        onManageLanguages();
                                        setIsOpen(false);
                                    }}
                                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-purple-600 transition-colors hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-950"
                                    type="button"
                                >
                                    <svg
                                        className="h-4 w-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                        />
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                    </svg>
                                    Manage Languages
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

"use client";

import { FrequencyConfig } from "@/lib/builder/schema";

const inputCls = "w-full rounded-md border px-2.5 py-1.5 text-sm text-black outline-none transition-colors focus:border-black/30 dark:text-white dark:focus:border-white/30";
const inputStyle = { borderColor: "var(--border)", background: "var(--surface)" };
const labelCls = "space-y-1.5 text-xs font-medium text-black/60 dark:text-white/60";

export default function FrequencyTab({
    frequency,
    onUpdateFrequency,
}: {
    frequency: FrequencyConfig;
    onUpdateFrequency: (frequency: FrequencyConfig) => void;
}) {
    return (
        <div className="space-y-4">
            <section className="rounded-lg p-4 space-y-4" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-black/40 dark:text-white/40">
                    Лимиты показов
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    <label className={labelCls}>
                        Макс. за сессию
                        <input className={inputCls} style={inputStyle} type="number"
                            placeholder="Без ограничений"
                            value={frequency.maxPerSession ?? ""}
                            onChange={(e) => onUpdateFrequency({
                                ...frequency,
                                maxPerSession: e.target.value ? Number(e.target.value) : null,
                            })} />
                    </label>
                    <label className={labelCls}>
                        Макс. за 24ч
                        <input className={inputCls} style={inputStyle} type="number"
                            placeholder="Без ограничений"
                            value={frequency.maxPer24h ?? ""}
                            onChange={(e) => onUpdateFrequency({
                                ...frequency,
                                maxPer24h: e.target.value ? Number(e.target.value) : null,
                            })} />
                    </label>
                </div>
            </section>

            <section className="rounded-lg p-4 space-y-4" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-black/40 dark:text-white/40">
                    Пауза
                </h3>
                <label className={labelCls}>
                    Пауза после закрытия (часы)
                    <input className={inputCls} style={inputStyle} type="number"
                        placeholder="Без паузы"
                        value={frequency.cooldownAfterCloseHours ?? ""}
                        onChange={(e) => onUpdateFrequency({
                            ...frequency,
                            cooldownAfterCloseHours: e.target.value ? Number(e.target.value) : null,
                        })} />
                </label>
            </section>

            <section className="rounded-lg p-4 space-y-3" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-black/40 dark:text-white/40">
                    Поведение
                </h3>
                <label className="flex items-center gap-3 text-sm text-black/70 dark:text-white/70 cursor-pointer group">
                    <div className="relative">
                        <input type="checkbox" className="peer sr-only"
                            checked={frequency.showOnce}
                            onChange={(e) => onUpdateFrequency({ ...frequency, showOnce: e.target.checked })} />
                        <div className="h-5 w-9 rounded-full bg-black/10 peer-checked:bg-black dark:bg-white/10 dark:peer-checked:bg-white transition-colors" />
                        <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm peer-checked:translate-x-4 dark:bg-black transition-transform" />
                    </div>
                    <span className="text-xs font-medium">Показывать один раз на посетителя</span>
                </label>
                <label className="flex items-center gap-3 text-sm text-black/70 dark:text-white/70 cursor-pointer group">
                    <div className="relative">
                        <input type="checkbox" className="peer sr-only"
                            checked={frequency.perCampaign}
                            onChange={(e) => onUpdateFrequency({ ...frequency, perCampaign: e.target.checked })} />
                        <div className="h-5 w-9 rounded-full bg-black/10 peer-checked:bg-black dark:bg-white/10 dark:peer-checked:bg-white transition-colors" />
                        <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm peer-checked:translate-x-4 dark:bg-black transition-transform" />
                    </div>
                    <span className="text-xs font-medium">На кампанию (не глобально)</span>
                </label>
            </section>
        </div>
    );
}

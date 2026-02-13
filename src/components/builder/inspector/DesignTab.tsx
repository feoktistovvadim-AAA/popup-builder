"use client";

import { useState } from "react";

import {
    PopupBlock,
    PopupSchemaV2,
} from "@/lib/builder/schema";

const inputCls = "w-full rounded-md border px-2.5 py-1.5 text-sm text-black outline-none transition-colors focus:border-black/30 dark:text-white dark:focus:border-white/30";
const inputStyle = { borderColor: "var(--border)", background: "var(--surface)" };
const labelCls = "space-y-1.5 text-xs font-medium text-black/60 dark:text-white/60";

export default function DesignTab({
    schema,
    selectedBlock,
    onUpdateBlock,
    onUpdateLayout,
}: {
    schema: PopupSchemaV2;
    selectedBlock: PopupBlock | null;
    onUpdateBlock: (id: string, nextProps: Record<string, unknown>) => void;
    onUpdateLayout: (next: PopupSchemaV2["template"]["layout"]) => void;
}) {
    const layout = schema.template.layout;
    const [uploading, setUploading] = useState(false);

    const handleImageUpload = async (file: File) => {
        if (!selectedBlock || selectedBlock.type !== "image") return;
        setUploading(true);

        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/v1/upload", {
            method: "POST",
            body: formData,
        });

        setUploading(false);

        if (response.ok) {
            const data = await response.json();
            onUpdateBlock(selectedBlock.id, {
                ...selectedBlock.props,
                src: data.url,
            });
        }
    };

    return (
        <div className="space-y-4">
            {/* Layout Section */}
            <section className="rounded-lg p-4 space-y-3" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-black/40 dark:text-white/40">
                    Макет
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    <label className={labelCls}>
                        Отступ (Десктоп)
                        <input className={inputCls} style={inputStyle} type="number"
                            value={layout.paddingDesktop ?? 24}
                            onChange={(e) => onUpdateLayout({ ...layout, paddingDesktop: Number(e.target.value) })} />
                    </label>
                    <label className={labelCls}>
                        Отступ (Мобайл)
                        <input className={inputCls} style={inputStyle} type="number"
                            value={layout.paddingMobile ?? 16}
                            onChange={(e) => onUpdateLayout({ ...layout, paddingMobile: Number(e.target.value) })} />
                    </label>
                    <label className={labelCls}>
                        Макс. ширина (Десктоп)
                        <input className={inputCls} style={inputStyle} type="number"
                            value={layout.maxWidthDesktop ?? 420}
                            onChange={(e) => onUpdateLayout({ ...layout, maxWidthDesktop: Number(e.target.value) })} />
                    </label>
                    <label className={labelCls}>
                        Макс. ширина (Мобайл)
                        <input className={inputCls} style={inputStyle} type="number"
                            value={layout.maxWidthMobile ?? 340}
                            onChange={(e) => onUpdateLayout({ ...layout, maxWidthMobile: Number(e.target.value) })} />
                    </label>
                </div>
            </section>

            {/* Style & Position */}
            <section className="rounded-lg p-4 space-y-3" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-black/40 dark:text-white/40">
                    Стиль и позиция
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    <label className={labelCls}>
                        Радиус
                        <input className={inputCls} style={inputStyle} type="number"
                            value={layout.borderRadius}
                            onChange={(e) => onUpdateLayout({ ...layout, borderRadius: Number(e.target.value) })} />
                    </label>
                    <label className={labelCls}>
                        Тень
                        <select className={inputCls} style={inputStyle}
                            value={layout.shadow ?? "medium"}
                            onChange={(e) => onUpdateLayout({ ...layout, shadow: e.target.value as typeof layout.shadow })}>
                            <option value="none">Нет</option>
                            <option value="soft">Мягкая</option>
                            <option value="medium">Средняя</option>
                            <option value="strong">Сильная</option>
                        </select>
                    </label>
                    <label className={labelCls}>
                        Фон
                        <input className={`${inputCls} h-9`} style={inputStyle} type="color"
                            value={layout.backgroundColor}
                            onChange={(e) => onUpdateLayout({ ...layout, backgroundColor: e.target.value })} />
                    </label>
                    <label className={labelCls}>
                        Позиция
                        <select className={inputCls} style={inputStyle}
                            value={layout.position}
                            onChange={(e) => onUpdateLayout({ ...layout, position: e.target.value as typeof layout.position })}>
                            <option value="center">Центр</option>
                            <option value="top-left">Вверху слева</option>
                            <option value="top-center">Вверху по центру</option>
                            <option value="top-right">Вверху справа</option>
                            <option value="bottom-left">Внизу слева</option>
                            <option value="bottom-center">Внизу по центру</option>
                            <option value="bottom-right">Внизу справа</option>
                        </select>
                    </label>
                </div>

                <div className="space-y-2">
                    <label className={labelCls}>
                        Цвет оверлея
                        <input className={inputCls} style={inputStyle} type="text"
                            value={layout.overlayColor}
                            onChange={(e) => onUpdateLayout({ ...layout, overlayColor: e.target.value })} />
                    </label>
                    <label className={labelCls}>
                        Размытие оверлея (px)
                        <input className={inputCls} style={inputStyle} type="number"
                            value={layout.overlayBlur ?? 0}
                            onChange={(e) => onUpdateLayout({ ...layout, overlayBlur: Number(e.target.value) })} />
                    </label>
                </div>

                {/* Border */}
                <div className="space-y-2 border-t pt-3" style={{ borderColor: "var(--border)" }}>
                    <label className="flex items-center gap-2 text-xs font-medium text-black/60 dark:text-white/60 cursor-pointer">
                        <input type="checkbox" className="rounded"
                            checked={layout.borderEnabled ?? false}
                            onChange={(e) => onUpdateLayout({ ...layout, borderEnabled: e.target.checked })} />
                        Обводка
                    </label>
                    {layout.borderEnabled && (
                        <div className="grid grid-cols-2 gap-3 pl-5">
                            <label className={labelCls}>
                                Толщина
                                <input className={inputCls} style={inputStyle} type="number"
                                    value={layout.borderWidth ?? 1}
                                    onChange={(e) => onUpdateLayout({ ...layout, borderWidth: Number(e.target.value) })} />
                            </label>
                            <label className={labelCls}>
                                Цвет
                                <input className={`${inputCls} h-9`} style={inputStyle} type="color"
                                    value={layout.borderColor ?? "#ffffff"}
                                    onChange={(e) => onUpdateLayout({ ...layout, borderColor: e.target.value })} />
                            </label>
                        </div>
                    )}
                </div>
            </section>

            {/* Block Settings */}
            <section className="rounded-lg p-4 space-y-3" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-black/40 dark:text-white/40">
                    Настройки блока
                </h3>
                {!selectedBlock ? (
                    <p className="text-xs text-black/40 dark:text-white/40">
                        Выберите блок для редактирования.
                    </p>
                ) : (
                    <div className="space-y-3">
                        {/* Headline / Text */}
                        {(selectedBlock.type === "headline" || selectedBlock.type === "text") && (
                            <>
                                <label className={labelCls}>
                                    Текст
                                    <textarea className={inputCls} style={inputStyle}
                                        value={(selectedBlock.props.text as string) ?? ""}
                                        onChange={(e) => onUpdateBlock(selectedBlock.id, { ...selectedBlock.props, text: e.target.value })} />
                                </label>
                                <label className={labelCls}>
                                    Выравнивание
                                    <select className={inputCls} style={inputStyle}
                                        value={(selectedBlock.props.align as string) ?? "left"}
                                        onChange={(e) => onUpdateBlock(selectedBlock.id, { ...selectedBlock.props, align: e.target.value })}>
                                        <option value="left">Лево</option>
                                        <option value="center">Центр</option>
                                        <option value="right">Право</option>
                                    </select>
                                </label>
                                <label className={labelCls}>
                                    Цвет
                                    <input className={`${inputCls} h-9`} style={inputStyle} type="color"
                                        value={(selectedBlock.props.color as string) ?? (selectedBlock.type === "headline" ? "#ffffff" : "#d1d5db")}
                                        onChange={(e) => onUpdateBlock(selectedBlock.id, { ...selectedBlock.props, color: e.target.value })} />
                                </label>
                            </>
                        )}

                        {/* Button */}
                        {selectedBlock.type === "button" && (
                            <>
                                <div className="grid grid-cols-2 gap-3">
                                    <label className={labelCls}>
                                        Надпись
                                        <input className={inputCls} style={inputStyle}
                                            value={(selectedBlock.props.label as string) ?? ""}
                                            onChange={(e) => onUpdateBlock(selectedBlock.id, { ...selectedBlock.props, label: e.target.value })} />
                                    </label>
                                    <label className={labelCls}>
                                        URL
                                        <input className={inputCls} style={inputStyle}
                                            value={(selectedBlock.props.url as string) ?? ""}
                                            onChange={(e) => onUpdateBlock(selectedBlock.id, { ...selectedBlock.props, url: e.target.value })} />
                                    </label>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <label className={labelCls}>
                                        Цвет текста
                                        <input className={`${inputCls} h-9`} style={inputStyle} type="color"
                                            value={(selectedBlock.props.textColor as string) ?? "#ffffff"}
                                            onChange={(e) => onUpdateBlock(selectedBlock.id, { ...selectedBlock.props, textColor: e.target.value })} />
                                    </label>
                                    <label className={labelCls}>
                                        Фон
                                        <input className={`${inputCls} h-9`} style={inputStyle} type="color"
                                            value={(selectedBlock.props.backgroundColor as string) ?? "#7c3aed"}
                                            onChange={(e) => onUpdateBlock(selectedBlock.id, { ...selectedBlock.props, backgroundColor: e.target.value })} />
                                    </label>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <label className={labelCls}>
                                        Размер шрифта (px)
                                        <input className={inputCls} style={inputStyle} type="number"
                                            value={(selectedBlock.props.fontSize as number) ?? 16}
                                            onChange={(e) => onUpdateBlock(selectedBlock.id, { ...selectedBlock.props, fontSize: Number(e.target.value) })} />
                                    </label>
                                    <label className={labelCls}>
                                        Radius
                                        <input className={inputCls} style={inputStyle} type="number"
                                            value={(selectedBlock.props.borderRadius as number) ?? 10}
                                            onChange={(e) => onUpdateBlock(selectedBlock.id, { ...selectedBlock.props, borderRadius: Number(e.target.value) })} />
                                    </label>
                                </div>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-xs font-medium text-black/60 dark:text-white/60 cursor-pointer">
                                        <input type="checkbox" className="rounded"
                                            checked={(selectedBlock.props.fullWidth as boolean) ?? false}
                                            onChange={(e) => onUpdateBlock(selectedBlock.id, { ...selectedBlock.props, fullWidth: e.target.checked })} />
                                        Полная ширина
                                    </label>
                                    <label className="flex items-center gap-2 text-xs font-medium text-black/60 dark:text-white/60 cursor-pointer">
                                        <input type="checkbox" className="rounded"
                                            checked={(selectedBlock.props.borderEnabled as boolean) ?? false}
                                            onChange={(e) => onUpdateBlock(selectedBlock.id, { ...selectedBlock.props, borderEnabled: e.target.checked })} />
                                        Обводка
                                    </label>
                                    {(selectedBlock.props.borderEnabled as boolean) && (
                                        <div className="grid grid-cols-2 gap-3 pl-5">
                                            <label className={labelCls}>
                                                Width
                                                <input className={inputCls} style={inputStyle} type="number"
                                                    value={(selectedBlock.props.borderWidth as number) ?? 1}
                                                    onChange={(e) => onUpdateBlock(selectedBlock.id, { ...selectedBlock.props, borderWidth: Number(e.target.value) })} />
                                            </label>
                                            <label className={labelCls}>
                                                Color
                                                <input className={`${inputCls} h-9`} style={inputStyle} type="color"
                                                    value={(selectedBlock.props.borderColor as string) ?? "#ffffff"}
                                                    onChange={(e) => onUpdateBlock(selectedBlock.id, { ...selectedBlock.props, borderColor: e.target.value })} />
                                            </label>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {/* Image */}
                        {selectedBlock.type === "image" && (
                            <>
                                <label className={labelCls}>
                                    URL изображения
                                    <input className={inputCls} style={inputStyle}
                                        value={(selectedBlock.props.src as string) ?? ""}
                                        onChange={(e) => onUpdateBlock(selectedBlock.id, { ...selectedBlock.props, src: e.target.value })} />
                                </label>
                                <label className={labelCls}>
                                    Альт. текст
                                    <input className={inputCls} style={inputStyle}
                                        value={(selectedBlock.props.alt as string) ?? ""}
                                        onChange={(e) => onUpdateBlock(selectedBlock.id, { ...selectedBlock.props, alt: e.target.value })} />
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <label className={labelCls}>
                                        Ширина (%)
                                        <input className={inputCls} style={inputStyle} type="number"
                                            value={(selectedBlock.props.width as number) ?? 100}
                                            onChange={(e) => onUpdateBlock(selectedBlock.id, { ...selectedBlock.props, width: Number(e.target.value) })} />
                                    </label>
                                    <label className={labelCls}>
                                        Radius
                                        <input className={inputCls} style={inputStyle} type="number"
                                            value={(selectedBlock.props.borderRadius as number) ?? 12}
                                            onChange={(e) => onUpdateBlock(selectedBlock.id, { ...selectedBlock.props, borderRadius: Number(e.target.value) })} />
                                    </label>
                                </div>
                                <label className={labelCls}>
                                    Загрузить изображение
                                    <input
                                        className="block w-full text-xs text-black/60 file:mr-3 file:rounded-md file:border-0 file:bg-black file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white dark:text-white/60 dark:file:bg-white dark:file:text-black file:cursor-pointer"
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleImageUpload(file);
                                        }}
                                        disabled={uploading}
                                    />
                                </label>
                            </>
                        )}

                        {/* Spacer */}
                        {selectedBlock.type === "spacer" && (
                            <label className={labelCls}>
                                Высота
                                <input className={inputCls} style={inputStyle} type="number"
                                    value={(selectedBlock.props.height as number) ?? 16}
                                    onChange={(e) => onUpdateBlock(selectedBlock.id, { ...selectedBlock.props, height: Number(e.target.value) })} />
                            </label>
                        )}
                    </div>
                )}
            </section>
        </div>
    );
}

import { test, expect } from "@playwright/test";

test.describe("Multi-Language Support", () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to test page
        await page.goto("http://localhost:3000/test-popup.html");
    });

    test("should render Russian translation when html lang is ru", async ({ page }) => {
        // Set HTML lang to Russian
        await page.evaluate(() => {
            document.documentElement.lang = "ru";
        });

        // Trigger the multi-lang popup
        await page.evaluate(() => {
            window.PB.trigger("multilang-popup");
        });

        // Wait for popup to appear
        const popup = page.locator("text=Приветственный бонус"); // Russian translation
        await expect(popup).toBeVisible({ timeout: 5000 });

        // Verify button label is also in Russian
        const button = page.locator("text=Получить сейчас");
        await expect(button).toBeVisible();

        // Check debug info
        const debugInfo = await page.evaluate(() => window.PB.getDebugInfo());
        expect(debugInfo.resolvedLang).toBe("ru");
        expect(debugInfo.baseLang).toBe("en");
        expect(debugInfo.usedFallback).toBe(false);
    });

    test("should fallback to English when translation is missing", async ({ page }) => {
        // Set HTML lang to Turkish (no translation available)
        await page.evaluate(() => {
            document.documentElement.lang = "tr";
        });

        // Trigger the multi-lang popup
        await page.evaluate(() => {
            window.PB.trigger("multilang-popup");
        });

        // Wait for popup to appear with English text (fallback)
        const popup = page.locator("text=Welcome Bonus"); // English fallback
        await expect(popup).toBeVisible({ timeout: 5000 });

        // Verify button label is also in English
        const button = page.locator("text=Claim Now");
        await expect(button).toBeVisible();

        // Check debug info
        const debugInfo = await page.evaluate(() => window.PB.getDebugInfo());
        expect(debugInfo.resolvedLang).toBe("tr");
        expect(debugInfo.baseLang).toBe("en");
        expect(debugInfo.usedFallback).toBe(true);
    });

    test("should use explicit language from pbSettings", async ({ page }) => {
        // Set pbSettings.lang to Spanish
        await page.evaluate(() => {
            window.pbSettings = { lang: "es" };
            document.documentElement.lang = "ru"; // HTML lang should be ignored
        });

        // Trigger the multi-lang popup
        await page.evaluate(() => {
            window.PB.trigger("multilang-popup");
        });

        // Wait for popup to appear with Spanish text
        const popup = page.locator("text=Bono de bienvenida"); // Spanish translation
        await expect(popup).toBeVisible({ timeout: 5000 });

        // Verify button label is also in Spanish
        const button = page.locator("text=Reclamar ahora");
        await expect(button).toBeVisible();

        // Check debug info
        const debugInfo = await page.evaluate(() => window.PB.getDebugInfo());
        expect(debugInfo.resolvedLang).toBe("es");
        expect(debugInfo.baseLang).toBe("en");
        expect(debugInfo.usedFallback).toBe(false);
    });

    test("should normalize language codes (ru-RU -> ru)", async ({ page }) => {
        // Set HTML lang to ru-RU (should normalize to ru)
        await page.evaluate(() => {
            document.documentElement.lang = "ru-RU";
        });

        // Trigger the multi-lang popup
        await page.evaluate(() => {
            window.PB.trigger("multilang-popup");
        });

        // Wait for popup to appear with Russian text
        const popup = page.locator("text=Приветственный бонус");
        await expect(popup).toBeVisible({ timeout: 5000 });

        // Check debug info shows normalized language
        const debugInfo = await page.evaluate(() => window.PB.getDebugInfo());
        expect(debugInfo.resolvedLang).toBe("ru");
    });
});

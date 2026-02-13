import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

let siteId: string;

test.beforeAll(async () => {
    const site = await prisma.site.findFirst({ where: { domain: 'localhost:3000' } });
    if (!site) throw new Error('Test site not found. Seed failed?');
    siteId = site.id;
});

test.afterAll(async () => {
    await prisma.$disconnect();
});

test.describe("Multi-Language Support", () => {
    const initAndTrigger = async (page: any, langSetup: () => void | Promise<void>) => {
        await page.goto("http://localhost:3000/test-popup.html");

        // Set up language before init
        await page.evaluate(langSetup);

        // Init PB
        await page.evaluate((id: string) => {
            // @ts-ignore
            window.pbSettings = { siteId: id, debug: true };
            // @ts-ignore
            if (window.PB) window.PB.init(window.pbSettings);
        }, siteId);

        // Wait for boot to complete
        await page.waitForSelector('#pb-debug-hud');

        // Remove any auto-rendered popup so our manual trigger can render
        await page.evaluate(() => {
            const existing = document.getElementById('pb-root');
            if (existing) existing.remove();
        });

        // Trigger the multilang popup manually
        await page.evaluate(() => {
            // @ts-ignore
            window.PB.trigger("multilang-popup");
        });
    };

    test("should render Russian translation when html lang is ru", async ({ page }) => {
        await initAndTrigger(page, () => {
            document.documentElement.lang = "ru";
        });

        const popup = page.locator("text=Приветственный бонус");
        await expect(popup).toBeVisible({ timeout: 5000 });

        const button = page.locator("text=Получить сейчас");
        await expect(button).toBeVisible();

        // @ts-ignore
        const debugInfo = await page.evaluate(() => window.PB.getDebugInfo());
        expect(debugInfo.resolvedLang).toBe("ru");
        expect(debugInfo.baseLang).toBe("en");
        expect(debugInfo.usedFallback).toBe(false);
    });

    test("should fallback to English when translation is missing", async ({ page }) => {
        await initAndTrigger(page, () => {
            document.documentElement.lang = "tr";
        });

        const popup = page.locator("text=Welcome Bonus");
        await expect(popup).toBeVisible({ timeout: 5000 });

        const button = page.locator("text=Claim Now");
        await expect(button).toBeVisible();

        // @ts-ignore
        const debugInfo = await page.evaluate(() => window.PB.getDebugInfo());
        expect(debugInfo.resolvedLang).toBe("tr");
        expect(debugInfo.baseLang).toBe("en");
        expect(debugInfo.usedFallback).toBe(true);
    });

    test("should use explicit language from pbSettings", async ({ page }) => {
        await page.goto("http://localhost:3000/test-popup.html");

        // Set pbSettings.lang to Spanish before init
        await page.evaluate((id: string) => {
            // @ts-ignore
            window.pbSettings = { siteId: id, lang: "es", debug: true };
            document.documentElement.lang = "ru"; // HTML lang should be ignored
            // @ts-ignore
            if (window.PB) window.PB.init(window.pbSettings);
        }, siteId);

        await page.waitForSelector('#pb-debug-hud');

        // Remove any auto-rendered popup
        await page.evaluate(() => {
            const existing = document.getElementById('pb-root');
            if (existing) existing.remove();
        });

        await page.evaluate(() => {
            // @ts-ignore
            window.PB.trigger("multilang-popup");
        });

        const popup = page.locator("text=Bono de bienvenida");
        await expect(popup).toBeVisible({ timeout: 5000 });

        const button = page.locator("text=Reclamar ahora");
        await expect(button).toBeVisible();

        // @ts-ignore
        const debugInfo = await page.evaluate(() => window.PB.getDebugInfo());
        expect(debugInfo.resolvedLang).toBe("es");
        expect(debugInfo.baseLang).toBe("en");
        expect(debugInfo.usedFallback).toBe(false);
    });

    test("should normalize language codes (ru-RU -> ru)", async ({ page }) => {
        await initAndTrigger(page, () => {
            document.documentElement.lang = "ru-RU";
        });

        const popup = page.locator("text=Приветственный бонус");
        await expect(popup).toBeVisible({ timeout: 5000 });

        // @ts-ignore
        const debugInfo = await page.evaluate(() => window.PB.getDebugInfo());
        expect(debugInfo.resolvedLang).toBe("ru");
    });
});

import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

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

test.describe('Close Button Behavior', () => {
    const initPB = async (page: any, query: string = '') => {
        await page.goto('/test-popup.html' + query);
        await page.evaluate((id: string) => {
            // @ts-ignore
            window.pbSettings = { siteId: id, debug: true };
            // @ts-ignore
            if (window.PB) window.PB.init(window.pbSettings);
        }, siteId);
        await page.waitForSelector('#pb-debug-hud');
    };

    test('close button should be inside card by default', async ({ page }) => {
        await initPB(page, '?timer=true');

        // Wait for popup to appear
        await page.waitForTimeout(2500);

        // Get close button and modal elements from shadow DOM
        const closeButtonInCard = await page.evaluate(() => {
            const root = document.querySelector('#pb-root');
            if (!root || !root.shadowRoot) return false;

            const modal = root.shadowRoot.querySelector('.pb-modal');
            const closeBtn = root.shadowRoot.querySelector('.pb-close');

            if (!modal || !closeBtn) return false;

            // Check if close button is child of modal (card placement)
            return modal.contains(closeBtn) && closeBtn.classList.contains('pb-close-card');
        });

        expect(closeButtonInCard).toBe(true);
    });

    test('close button should have adequate touch target on mobile', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await initPB(page, '?timer=true');

        await page.waitForTimeout(2500);

        const buttonSize = await page.evaluate(() => {
            const root = document.querySelector('#pb-root');
            if (!root || !root.shadowRoot) return null;

            const closeBtn = root.shadowRoot.querySelector('.pb-close') as HTMLElement;
            if (!closeBtn) return null;

            const style = window.getComputedStyle(closeBtn);
            return {
                width: parseInt(style.width),
                height: parseInt(style.height),
            };
        });

        expect(buttonSize).not.toBeNull();
        expect(buttonSize!.width).toBeGreaterThanOrEqual(36);
        expect(buttonSize!.height).toBeGreaterThanOrEqual(36);
    });

    test('overlay click should close popup when enabled', async ({ page }) => {
        await initPB(page, '?timer=true');
        await page.waitForTimeout(2500);

        // Verify popup is visible
        const popupVisible = await page.evaluate(() => {
            return !!document.querySelector('#pb-root');
        });
        expect(popupVisible).toBe(true);

        // Click overlay (outside modal)
        await page.evaluate(() => {
            const root = document.querySelector('#pb-root');
            if (!root || !root.shadowRoot) return;

            const overlay = root.shadowRoot.querySelector('.pb-overlay') as HTMLElement;
            if (overlay) {
                overlay.click();
            }
        });

        // Wait a bit for removal
        await page.waitForTimeout(100);

        // Verify popup is removed
        const popupRemoved = await page.evaluate(() => {
            return !document.querySelector('#pb-root');
        });
        expect(popupRemoved).toBe(true);
    });

    test('close button click should emit close event', async ({ page }) => {
        // Intercept event API calls
        const events: any[] = [];
        await page.route('**/api/v1/event', route => {
            const postData = route.request().postDataJSON();
            events.push(postData);
            route.fulfill({ status: 200, body: '{}' });
        });

        await initPB(page, '?timer=true');
        await page.waitForTimeout(2500);

        // Click close button
        await page.evaluate(() => {
            const root = document.querySelector('#pb-root');
            if (!root || !root.shadowRoot) return;

            const closeBtn = root.shadowRoot.querySelector('.pb-close') as HTMLButtonElement;
            if (closeBtn) closeBtn.click();
        });

        await page.waitForTimeout(200);

        // Verify close event was sent
        const closeEvent = events.find(e => e.eventType === 'close');
        expect(closeEvent).toBeDefined();
        expect(closeEvent.closeMethod).toBe('button');
        expect(closeEvent.siteId).toBe(siteId);
        expect(closeEvent.deviceType).toBeDefined();
    });
});

test.describe('Event Tracking', () => {
    const initPB = async (page: any, query: string = '') => {
        await page.goto('/test-popup.html' + query);
        await page.evaluate((id: string) => {
            // @ts-ignore
            window.pbSettings = { siteId: id, debug: true };
            // @ts-ignore
            if (window.PB) window.PB.init(window.pbSettings);
        }, siteId);
        await page.waitForSelector('#pb-debug-hud');
    };

    test('should emit impression event when popup shows', async ({ page }) => {
        const events: any[] = [];
        await page.route('**/api/v1/event', route => {
            const postData = route.request().postDataJSON();
            events.push(postData);
            route.fulfill({ status: 200, body: '{}' });
        });

        await initPB(page, '?timer=true');
        await page.waitForTimeout(2500);

        // Verify impression event was sent
        const impressionEvent = events.find(e => e.eventType === 'impression');
        expect(impressionEvent).toBeDefined();
        expect(impressionEvent.siteId).toBe(siteId);
        expect(impressionEvent.popupId).toBeDefined();
        expect(impressionEvent.popupVersion).toBeDefined();
        expect(impressionEvent.timestamp).toBeDefined();
        expect(impressionEvent.pageUrl).toBeDefined();
        expect(impressionEvent.deviceType).toBeDefined();
        expect(impressionEvent.triggerType).toBeDefined();
    });

    test('should emit click event when button is clicked', async ({ page }) => {
        const events: any[] = [];
        let clickEventPromise: Promise<any> | null = null;

        await page.route('**/api/v1/event', route => {
            const postData = route.request().postDataJSON();
            events.push(postData);
            route.fulfill({ status: 200, body: '{}' });
        });

        await initPB(page, '?timer=true');
        await page.waitForTimeout(2500);

        // Check if button exists
        const hasButton = await page.evaluate(() => {
            const root = document.querySelector('#pb-root');
            if (!root || !root.shadowRoot) return false;
            return !!root.shadowRoot.querySelector('.pb-button');
        });

        // Skip test if no button exists in this popup
        if (!hasButton) {
            test.skip();
            return;
        }

        // Wait for click event request
        clickEventPromise = page.waitForRequest(
            req => req.url().includes('/api/v1/event') &&
                req.method() === 'POST' &&
                req.postDataJSON()?.eventType === 'click',
            { timeout: 2000 }
        );

        // Click button
        await page.evaluate(() => {
            const root = document.querySelector('#pb-root');
            if (!root || !root.shadowRoot) return;

            const button = root.shadowRoot.querySelector('.pb-button') as HTMLAnchorElement;
            if (button) button.click();
        });

        // Wait for the click event request
        await clickEventPromise;

        // Verify click event was sent
        const clickEvent = events.find(e => e.eventType === 'click');
        expect(clickEvent).toBeDefined();
        expect(clickEvent.buttonLabel).toBeDefined();
        expect(clickEvent.buttonUrl).toBeDefined();
    });
});

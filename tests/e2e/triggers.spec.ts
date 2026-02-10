
import { test, expect } from '@playwright/test';

// Define the popup site ID created in seed-test.ts
// We will retrieve it dynamically ideally, but for now we know the org/site creation order 
// or simple queries. In seed-test.ts we created one site.
// Let's rely on finding the site ID via a data attribute or just hardcoding if deterministic?
// IDs are CUIDs so not deterministic.
// We can expose the siteId via a test endpoint or just checking the DOM if we inject it?
// Or we can just use the fact that the seed script runs before this and we can read the DB?
// Better: The test page should accept a siteId? No, the boot API takes it.
// We need to know the site ID to pass to `PB.init`.
// Let's create a test page that fetches the site ID or we hardcode a reliable one in seed?
// Prisma CUIDs are standard.
// Let's modify seed-test.ts to use a fixed ID or write the ID to a temp file.
// For now, let's query the DB from the test? SQLite is available.
// Actually, `pb.js` initialization is usually done with a snippet.
// We can inject a script into a blank page that inits PB.

import { PrismaClient } from '@prisma/client';
import path from 'path';

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

test.describe('Popup Triggers', () => {



    // Helper to init PB
    const initPB = async (page: any, query: string = '') => {
        await page.goto('/test-popup.html' + query); // We'll create this simple file
        await page.evaluate((id: string) => {
            // @ts-ignore
            window.pbSettings = { siteId: id, debug: true };
            // @ts-ignore
            if (window.PB) window.PB.init(window.pbSettings);
        }, siteId);
        await page.waitForSelector('#pb-debug-hud');
    };

    test('should fire after_seconds trigger', async ({ page }) => {
        await initPB(page, '?timer=true');
        // Popup name: 'timer-popup', 2 seconds
        const popup = page.locator('text=Timer Popup');
        await expect(popup).not.toBeVisible();
        await page.waitForTimeout(2500);
        await expect(popup).toBeVisible();

        // Verify debug overlay
        await expect(page.locator('#pb-debug-hud')).toContainText('lastTrigger: after_seconds');
    });

    test('should fire scroll_percent trigger', async ({ page }) => {
        await initPB(page, '?scroll=true');
        // Popup name: 'scroll-popup', 50%
        const popup = page.locator('text=Scroll Popup');

        // Ensure page is scrollable
        await page.evaluate(() => document.body.style.height = '3000px');

        await expect(popup).not.toBeVisible();
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.6));
        await page.dispatchEvent('body', 'scroll'); // Trigger scroll event manually just in case

        await expect(popup).toBeVisible();
        await expect(page.locator('#pb-debug-hud')).toContainText('lastTrigger: scroll_percent');
    });

    test('should fire exit_intent trigger', async ({ page }) => {
        await initPB(page, '?exit=true');
        // Popup name: 'exit-popup'
        const popup = page.locator('text=Exit Popup');

        await expect(popup).not.toBeVisible();
        // Move mouse out of viewport at top
        await page.mouse.move(500, 500);
        await page.mouse.move(500, 5); // Near top
        // Playwright doesn't strictly "leave" the window context easily, 
        // but generating a mouseout event on document works for our logic:
        // document.addEventListener("mouseout", onMouseOut);

        // Trigger manually if mouse move isn't enough (often flaky)
        await page.evaluate(() => {
            document.dispatchEvent(new MouseEvent('mouseout', { clientY: 0, bubbles: true }));
        });

        await expect(popup).toBeVisible();
        await expect(page.locator('#pb-debug-hud')).toContainText('lastTrigger: exit_intent_desktop');
    });

    test('should fire inactivity trigger', async ({ page }) => {
        await initPB(page, '?inactivity=true');
        // Popup name: 'inactivity-popup', 3s
        const popup = page.locator('text=Inactivity Popup');

        await expect(popup).not.toBeVisible();
        await page.waitForTimeout(3500); // Wait > 3s without input
        await expect(popup).toBeVisible();
        await expect(page.locator('#pb-debug-hud')).toContainText('lastTrigger: inactivity');
    });

    test('should fire pageview_count trigger', async ({ page }) => {
        // Popup name: 'pageview-popup', count 3

        // View 1
        await initPB(page, '?pageview=true');
        await expect(page.locator('text=Pageview Popup')).not.toBeVisible();

        // View 2 (reload)
        await page.reload();
        await page.evaluate((id: string) => {
            // @ts-ignore
            window.PB.init({ siteId: id, debug: true });
        }, siteId);
        await expect(page.locator('text=Pageview Popup')).not.toBeVisible();

        // View 3 (reload)
        await page.reload();
        await page.evaluate((id: string) => {
            // @ts-ignore
            window.PB.init({ siteId: id, debug: true });
        }, siteId);

        await expect(page.locator('text=Pageview Popup')).toBeVisible();
    });

    test('should fire custom_event trigger', async ({ page }) => {
        await initPB(page, '?custom=true');
        // Popup: 'custom-popup', event: 'deposit_failed'
        const popup = page.locator('text=Custom Event Popup');

        await expect(popup).not.toBeVisible();

        // Dispatch event
        await page.evaluate(() => {
            // @ts-ignore
            window.pbTrack('deposit_failed', { amount: 100 });
        });

        await expect(popup).toBeVisible();
        await expect(page.locator('#pb-debug-hud')).toContainText('lastTrigger: custom_event');
    });

    test('should respect targeting (url_match)', async ({ page }) => {
        // We'll stub the URL in the test environment if possible, 
        // or just rely on the test page URL.
        // Our test page is /test-popup.html
        // We seeded a popup for 'test-page' contains.

        // Go to a URL that matches (test-popup.html contains 'test-popup', close enough to 'test-page'? No.)
        // Seeded pattern: 'test-page'
        // Let's create a route that matches, or change seed to 'test-popup'.
        // Changing expectation to match current setup: seed uses 'test-page'.
        // URL is 'test-popup.html' -> does NOT contain 'test-page'.

        // Let's update the seed to match our actual test URL or vice versa.
        // I'll update seed in next step if this fails, but better to plan ahead.
        // Actually, let's just use `history.pushState` to change the URL client-side before init.

        await page.goto('/test-popup.html');
        await page.evaluate(() => history.pushState({}, '', '/products/test-page-123'));

        await page.evaluate((id: string) => {
            // @ts-ignore
            window.pbSettings = { siteId: id, debug: true };
            // @ts-ignore
            if (window.PB) window.PB.init(window.pbSettings);
        }, siteId);

        const popup = page.locator('text=URL Popup');
        await expect(popup).toBeVisible();
    });
});

test.describe('Race Conditions', () => {
    // Helper to init PB (copied from above, or moving it to top level scope would be better but copy is fine for now)
    const initPB = async (page: any) => {
        // We need to re-fetch siteId if this runs in isolation? No, siteId is global.
        await page.goto('/test-popup.html?race=true');
        await page.evaluate((id: string) => {
            // @ts-ignore
            window.pbSettings = { siteId: id, debug: true };
            // @ts-ignore
            if (window.PB) window.PB.init(window.pbSettings);
        }, siteId);
        await page.waitForSelector('#pb-debug-hud');
    };

    test('should only render one popup when multiple triggers fire (race-popup)', async ({ page }) => {
        // initPB helper doesn't support query params easily, so manually call it or update helper?
        // Let's manually do it for this specific test case or assume initPB takes a path?
        // initPB hardcodes '/test-popup.html'.
        // Let's just modify the goto in this test.

        await initPB(page);

        // race-popup has after_seconds(1) and scroll_percent(0).
        // scroll_percent(0) fires immediately on init/scroll.
        // after_seconds(1) fires shortly after.

        const popup = page.locator('text=Race Popup');
        await expect(popup).toBeVisible();

        // Wait for potential second firing
        await page.waitForTimeout(1500);

        // Check how many popups are in the DOM. 
        // Note: they are in Shadow Roots.
        // But renderPopup uses `document.body.appendChild(host);` with `host.id = "pb-root"`.
        // If it renders twice, we might have multiple #pb-root elements.

        const count = await page.locator('#pb-root').count();
        expect(count).toBe(1);
    });

    test('should not render twice if event fired twice', async ({ page }) => {
        // Use custom-popup with query param
        await page.goto('/test-popup.html?custom=true');
        await page.evaluate((id: string) => {
            // @ts-ignore
            window.pbSettings = { siteId: id, debug: true };
            // @ts-ignore
            if (window.PB) window.PB.init(window.pbSettings);
        }, siteId);
        await page.waitForSelector('#pb-debug-hud');

        const popup = page.locator('text=Custom Event Popup');

        // Fire once
        await page.evaluate(() => {
            // @ts-ignore
            window.pbTrack('deposit_failed', { amount: 100 });
        });
        await expect(popup).toBeVisible();

        // Fire again immediately
        await page.evaluate(() => {
            // @ts-ignore
            window.pbTrack('deposit_failed', { amount: 100 });
        });

        // Wait a bit
        await page.waitForTimeout(500);

        // Check count of #pb-root
        const roots = await page.locator('#pb-root').count();
        expect(roots).toBe(1);
    });
});

test.describe('Configuration', () => {
    test('should respect apiBase setting', async ({ page }) => {
        const customApiBase = 'https://api.custom-domain.com';

        // Intercept requests to the custom domain
        // We expect a boot request to this domain
        let requestMade = false;
        await page.route(customApiBase + '/**', route => {
            requestMade = true;
            route.abort(); // Abort since we don't have a real server there
        });

        await page.goto('/test-popup.html');
        await page.evaluate((opts: any) => {
            // @ts-ignore
            window.pbSettings = { siteId: opts.siteId, apiBase: opts.apiBase, debug: true };
            // @ts-ignore
            if (window.PB) window.PB.init(window.pbSettings);
        }, { siteId, apiBase: customApiBase });

        // Wait a bit for the request to fire
        await page.waitForTimeout(1000);

        expect(requestMade).toBe(true);
    });

    test('should have correct isolation styles', async ({ page }) => {
        // Use timer popup which appears automatically
        await page.goto('/test-popup.html?timer=true');
        await page.evaluate((opts: any) => {
            // @ts-ignore
            window.pbSettings = { siteId: opts.siteId, debug: true };
            // @ts-ignore
            if (window.PB) window.PB.init(window.pbSettings);
        }, { siteId });

        await page.waitForSelector('#pb-root', { state: 'attached' });

        // Check styles in Shadow DOM
        const styles = await page.evaluate(() => {
            const root = document.querySelector('#pb-root');
            if (!root || !root.shadowRoot) return null;
            const overlay = root.shadowRoot.querySelector('.pb-overlay');
            if (!overlay) return null;
            const style = window.getComputedStyle(overlay);
            return {
                position: style.position,
                zIndex: style.zIndex,
                boxSizing: style.boxSizing
            };
        });

        expect(styles).toEqual({
            position: 'fixed',
            zIndex: '2147483647',
            boxSizing: 'border-box'
        });
    });
});



import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: 'file:./test.db',
        },
    },
});

async function main() {
    console.log('🌱 Seeding test data...');

    // 1. Create Organization
    const org = await prisma.organization.create({
        data: {
            name: 'E2E Test Org',
            slug: 'e2e-org',
        },
    });

    // 2. Create Site
    const site = await prisma.site.create({
        data: {
            name: 'E2E Test Site',
            domain: 'localhost:3000', // Matches locahost test env
            organizationId: org.id,
        },
    });

    // 3. Create Popups

    // Timer Popup (2 seconds)
    await createPopup(site.id, 'timer-popup', {
        targeting: [{ type: 'url_contains', value: 'timer=true' }],
        triggers: [{ type: 'after_seconds', enabled: true, params: { seconds: 2 } }],
        blocks: [{ type: 'text', props: { text: 'Timer Popup' } }],
    });

    // Scroll Popup (50%)
    await createPopup(site.id, 'scroll-popup', {
        targeting: [{ type: 'url_contains', value: 'scroll=true' }],
        triggers: [{ type: 'scroll_percent', enabled: true, params: { percent: 50 } }],
        blocks: [{ type: 'text', props: { text: 'Scroll Popup' } }],
    });

    // Exit Intent
    await createPopup(site.id, 'exit-popup', {
        targeting: [{ type: 'url_contains', value: 'exit_intent=true' }],
        triggers: [{ type: 'exit_intent_desktop', enabled: true, params: { sensitivity: 10 } }],
        blocks: [{ type: 'text', props: { text: 'Exit Popup' } }],
    });

    // Inactivity (3 seconds)
    await createPopup(site.id, 'inactivity-popup', {
        targeting: [{ type: 'url_contains', value: 'inactivity=true' }],
        triggers: [{ type: 'inactivity', enabled: true, params: { seconds: 3 } }],
        blocks: [{ type: 'text', props: { text: 'Inactivity Popup' } }],
    });

    // Pageview Count (3rd view)
    await createPopup(site.id, 'pageview-popup', {
        targeting: [{ type: 'url_contains', value: 'pageview=true' }],
        triggers: [{ type: 'pageview_count', enabled: true, params: { count: 3 } }],
        blocks: [{ type: 'text', props: { text: 'Pageview Popup' } }],
    });

    // URL Match (contains /test-page)
    await createPopup(site.id, 'url-popup', {
        triggers: [{ type: 'url_match', enabled: true, params: { pattern: 'test-page', match: 'contains' } }],
        blocks: [{ type: 'text', props: { text: 'URL Popup' } }],
    });

    // Device Match (desktop)
    await createPopup(site.id, 'device-popup', {
        targeting: [{ type: 'url_contains', value: 'device=desktop' }],
        triggers: [{ type: 'device_is', enabled: true, params: { device: 'desktop' } }],
        blocks: [{ type: 'text', props: { text: 'Device Popup' } }],
    });

    // Device Match (mobile - should not show on desktop tests)
    await createPopup(site.id, 'mobile-popup', {
        targeting: [{ type: 'url_contains', value: 'mobile=true' }],
        triggers: [{ type: 'device_is', enabled: true, params: { device: 'mobile' } }],
        blocks: [{ type: 'text', props: { text: 'Mobile Popup' } }],
    });

    // Custom Event (deposit_failed)
    await createPopup(site.id, 'custom-popup', {
        targeting: [{ type: 'url_contains', value: 'custom=true' }],
        triggers: [{ type: 'custom_event', enabled: true, params: { name: 'deposit_failed' } }],
        blocks: [{ type: 'text', props: { text: 'Custom Event Popup' } }],
    });

    // Smart Exit Intent (desktop + mobile)
    await createPopup(site.id, 'smart-exit-popup', {
        targeting: [{ type: 'url_contains', value: 'smart_exit=true' }],
        triggers: [{
            type: 'smart_exit_intent',
            enabled: true,
            params: {
                sensitivity: 10,
                scrollVelocityThreshold: 800,
                topScrollThreshold: 120
            }
        }],
        blocks: [{ type: 'text', props: { text: 'Smart Exit Popup' } }],
    });

    // Multi-Language Popup (for localization tests)
    await createPopup(site.id, 'multilang-popup', {
        targeting: [{ type: 'url_contains', value: 'multilang=true' }],
        triggers: [{ type: 'after_seconds', enabled: true, params: { seconds: 9999 } }],
        blocks: [
            { type: 'text', id: 'heading', props: { text: 'Welcome Bonus' } },
            { type: 'button', id: 'cta', props: { label: 'Claim Now' } },
        ],
        localization: {
            baseLang: 'en',
            enabledLangs: ['en', 'ru', 'es'],
            translations: {
                ru: {
                    blocks: {
                        heading: { text: 'Приветственный бонус' },
                        cta: { label: 'Получить сейчас' },
                    },
                },
                es: {
                    blocks: {
                        heading: { text: 'Bono de bienvenida' },
                        cta: { label: 'Reclamar ahora' },
                    },
                },
            },
        },
    });

    // Click Event Test Popup (with button)
    await createPopup(site.id, 'click-popup', {
        targeting: [{ type: 'url_contains', value: 'click=true' }],
        triggers: [{ type: 'after_seconds', enabled: true, params: { seconds: 1 } }],
        blocks: [
            { type: 'text', props: { text: 'Click Test Popup' } },
            {
                type: 'button',
                props: {
                    label: 'Test CTA',
                    url: 'https://example.com',
                    backgroundColor: '#7c3aed',
                    textColor: '#ffffff',
                    fullWidth: true
                }
            }
        ],
    });

    // Race Condition Popup (Timer 1s + Scroll 0% - both should try to fire)
    await createPopup(site.id, 'race-popup', {
        targeting: [{ type: 'url_contains', value: 'race=true' }],
        triggers: [
            { type: 'after_seconds', enabled: true, params: { seconds: 1 } },
            { type: 'scroll_percent', enabled: true, params: { percent: 0 } }
        ],
        blocks: [{ type: 'text', props: { text: 'Race Popup' } }],
    });

    // Sample Analytics Events for testing
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    // Create events for timer-popup
    const timerPopup = await prisma.popup.findFirst({ where: { site: { id: site.id }, name: 'timer-popup' } });
    if (timerPopup) {
        // Impressions
        await prisma.event.createMany({
            data: [
                { popupId: timerPopup.id, eventType: 'impression', timestamp: new Date(now), pageUrl: 'http://localhost:3000/test', deviceType: 'desktop', triggerType: 'after_seconds' },
                { popupId: timerPopup.id, eventType: 'impression', timestamp: new Date(oneDayAgo), pageUrl: 'http://localhost:3000/test', deviceType: 'mobile', triggerType: 'after_seconds' },
                { popupId: timerPopup.id, eventType: 'impression', timestamp: new Date(threeDaysAgo), pageUrl: 'http://localhost:3000/page2', deviceType: 'desktop', triggerType: 'after_seconds' },
                { popupId: timerPopup.id, eventType: 'impression', timestamp: new Date(sevenDaysAgo), pageUrl: 'http://localhost:3000/test', deviceType: 'mobile', triggerType: 'after_seconds' },
            ]
        });
        // Closes
        await prisma.event.createMany({
            data: [
                { popupId: timerPopup.id, eventType: 'close', timestamp: new Date(now), pageUrl: 'http://localhost:3000/test', deviceType: 'desktop', triggerType: 'after_seconds', closeMethod: 'button' },
                { popupId: timerPopup.id, eventType: 'close', timestamp: new Date(threeDaysAgo), pageUrl: 'http://localhost:3000/page2', deviceType: 'desktop', triggerType: 'after_seconds', closeMethod: 'overlay' },
            ]
        });
    }

    // Create events for click-popup
    const clickPopup = await prisma.popup.findFirst({ where: { site: { id: site.id }, name: 'click-popup' } });
    if (clickPopup) {
        // Impressions
        await prisma.event.createMany({
            data: [
                { popupId: clickPopup.id, eventType: 'impression', timestamp: new Date(now), pageUrl: 'http://localhost:3000/click', deviceType: 'desktop', triggerType: 'after_seconds' },
                { popupId: clickPopup.id, eventType: 'impression', timestamp: new Date(oneDayAgo), pageUrl: 'http://localhost:3000/click', deviceType: 'desktop', triggerType: 'after_seconds' },
                { popupId: clickPopup.id, eventType: 'impression', timestamp: new Date(threeDaysAgo), pageUrl: 'http://localhost:3000/click', deviceType: 'mobile', triggerType: 'after_seconds' },
            ]
        });
        // Clicks
        await prisma.event.createMany({
            data: [
                { popupId: clickPopup.id, eventType: 'click', timestamp: new Date(now), pageUrl: 'http://localhost:3000/click', deviceType: 'desktop', triggerType: 'after_seconds', buttonLabel: 'Test CTA', buttonUrl: 'https://example.com' },
                { popupId: clickPopup.id, eventType: 'click', timestamp: new Date(oneDayAgo), pageUrl: 'http://localhost:3000/click', deviceType: 'desktop', triggerType: 'after_seconds', buttonLabel: 'Test CTA', buttonUrl: 'https://example.com' },
            ]
        });
        // Closes
        await prisma.event.createMany({
            data: [
                { popupId: clickPopup.id, eventType: 'close', timestamp: new Date(threeDaysAgo), pageUrl: 'http://localhost:3000/click', deviceType: 'mobile', triggerType: 'after_seconds', closeMethod: 'button' },
            ]
        });
    }

    console.log('✅ Seeding complete');
}

async function createPopup(siteId: string, name: string, schema: any) {
    const popup = await prisma.popup.create({
        data: {
            siteId,
            name,
            status: 'PUBLISHED',
            versions: {
                create: {
                    version: 1,
                    status: 'PUBLISHED',
                    publishedAt: new Date(),
                    schema: {
                        schemaVersion: 2,
                        template: { layout: { overlayColor: 'rgba(0,0,0,0.5)' } },
                        frequency: { perCampaign: true }, // Ensure independent frequency
                        targeting: [],
                        ...schema
                    },
                },
            },
        },
    });
    return popup;
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

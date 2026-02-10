
import { test, expect } from '@playwright/test';
import { prisma } from '../../src/lib/prisma';

test.describe('CORS Headers', () => {
    test.beforeAll(async () => {
        // Ensure at least one site exists for valid requests
        const site = await prisma.site.findFirst();
        if (!site) {
            // Create a dummy site if none exists (though seed should have handled this)
            const org = await prisma.organization.create({
                data: { name: 'CORS Test Org', slug: 'cors-test-org' }
            });
            await prisma.site.create({
                data: { name: 'CORS Test Site', domain: 'cors-test.com', organizationId: org.id }
            });
        }
    });

    test('OPTIONS /api/v1/event should return CORS headers', async ({ request }) => {
        const response = await request.fetch('/api/v1/event', {
            method: 'OPTIONS',
            headers: {
                'Origin': 'https://external-site.com',
                'Access-Control-Request-Method': 'POST',
            }
        });

        expect(response.status()).toBe(204);
        expect(response.headers()['access-control-allow-origin']).toBe('*');
        expect(response.headers()['access-control-allow-methods']).toContain('POST');
    });

    test('POST /api/v1/event should return CORS headers', async ({ request }) => {
        // Need a valid siteId to pass Zod validation so we get a 200/204, not 400
        const site = await prisma.site.findFirst();
        const popup = await prisma.popup.findFirst({ where: { siteId: site?.id } });

        const response = await request.post('/api/v1/event', {
            data: {
                siteId: site?.id,
                popupId: popup?.id,
                type: 'impression'
            },
            headers: {
                'Origin': 'https://external-site.com'
            }
        });

        // Even if 400 (invalid input), we want headers. 
        // But let's try to get 200 with valid input if possible.
        // Our controller returns 400 if validation fails, 
        // BUT `withCors` wrapper should arguably still be applied? 
        // Actually, looking at my code: 
        // if (!parsed.success) return NextResponse.json(..., { status: 400 }); 
        // I did NOT wrap the error response in `withCors` in my previous edit!
        // I need to fix that.

        expect(response.headers()['access-control-allow-origin']).toBe('*');
    });
});

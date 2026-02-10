
import { PrismaClient } from '@prisma/client';
import path from 'path';

const dbPath = path.join(process.cwd(), 'prisma/test.db');
console.log('Targeting DB at:', dbPath);

const prisma = new PrismaClient({
    datasources: { db: { url: `file:${dbPath}` } },
    log: ['query', 'info', 'warn', 'error'],
});

async function main() {
    console.log('🔍 Verifying test DB connection...');
    console.log('CWD:', process.cwd());
    try {
        const count = await prisma.site.count();
        console.log(`✅ Connection successful. Found ${count} sites.`);

        const popup = await prisma.popup.findFirst({
            where: { name: 'race-popup' },
            include: { versions: true }
        });

        if (popup) {
            console.log('Race Popup Found:', JSON.stringify(popup, null, 2));
            const version = popup.versions[0];
            console.log('Schema Targeting:', JSON.stringify((version.schema as any)?.targeting, null, 2));
        } else {
            console.log('Race Popup NOT FOUND');
        }

    } catch (e) {
        console.error('❌ Connection failed:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();

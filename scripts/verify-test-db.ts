
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
        const site = await prisma.site.findFirst();
        console.log('Site:', site);
    } catch (e) {
        console.error('❌ Connection failed:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();

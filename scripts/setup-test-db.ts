
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prismaSchemaPath = path.join(__dirname, '../prisma/schema.prisma');
const testSchemaPath = path.join(__dirname, '../prisma/test.schema.prisma');
const testDbPath = path.join(__dirname, '../prisma/test.db');

console.log('🔄 Setting up test database...');

// 1. Read original schema
let schema = fs.readFileSync(prismaSchemaPath, 'utf-8');

// 2. Modify datasource to use SQLite
schema = schema.replace(
    /datasource db \{[\s\S]*?\}/,
    `datasource db {
  provider = "sqlite"
  url      = "file:${testDbPath}"
}`
);

// 3. Write test schema
fs.writeFileSync(testSchemaPath, schema);
console.log('✅ Created prisma/test.schema.prisma');

// 4. Remove existing test db if any
if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
    console.log('🗑️  Removed existing test.db');
}

// 5. Push schema to test db
try {
    console.log('🚀 Pushing schema to test db...');
    console.log('🚀 Pushing schema to test db...');
    execSync(`npx prisma db push --schema=${testSchemaPath}`, { stdio: 'inherit' });

    console.log('🔄 Regenerating Prisma Client for SQLite...');
    execSync(`npx prisma generate --schema=${testSchemaPath}`, { stdio: 'inherit' });

    console.log('🌱 Seeding test database...');
    execSync(`npx ts-node prisma/seed-test.ts`, {
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: 'file:./test.db' }
    });

    console.log('✨ Test database ready!');
} catch (error) {
    console.error('❌ Failed to setup test database:', error);
    process.exit(1);
}

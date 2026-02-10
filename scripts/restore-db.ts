
import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const testSchemaPath = path.join(__dirname, '../prisma/test.schema.prisma');
const testDbPath = path.join(__dirname, '../prisma/test.db');

console.log('🧹 Cleaning up test database artifacts...');

if (fs.existsSync(testSchemaPath)) {
    fs.unlinkSync(testSchemaPath);
    console.log('✅ Removed prisma/test.schema.prisma');
}

if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
    console.log('✅ Removed prisma/test.db');
}

console.log('✨ Cleanup complete!');

// Quick script to clean up duplicate permission records
// Run with: npx tsx scripts/cleanup-permissions.ts

import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
    // Find all permissions grouped by email + subAccountId
    const allPermissions = await db.permissions.findMany({
        orderBy: { id: 'asc' },
    });

    const seen = new Map<string, string>(); // key -> first permission id
    const toDelete: string[] = [];

    for (const perm of allPermissions) {
        const key = `${perm.email}__${perm.subAccountId}`;
        if (seen.has(key)) {
            toDelete.push(perm.id); // duplicate — mark for deletion
        } else {
            seen.set(key, perm.id); // keep the first one
        }
    }

    if (toDelete.length === 0) {
        console.log('✅ No duplicate permissions found.');
    } else {
        console.log(`🗑️  Deleting ${toDelete.length} duplicate permission records...`);
        await db.permissions.deleteMany({
            where: { id: { in: toDelete } },
        });
        console.log('✅ Duplicates removed.');
    }

    await db.$disconnect();
}

main().catch(console.error);

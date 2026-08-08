const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Data Cleanup Script
 * Removed unwanted " text-slate-900" from Walkin Hub status entries
 */
async function cleanup() {
    console.log('🚀 Starting Data Cleanup...');
    
    try {
        // 1. Find all entries that contain the unwanted string
        const entries = await prisma.walkinHubEntry.findMany({
            where: {
                OR: [
                    { status: { contains: 'text-slate-900' } },
                    { status: { contains: 'slate-900' } }
                ]
            }
        });

        console.log(`🔍 Found ${entries.length} entries to fix.`);

        let fixCount = 0;
        for (const entry of entries) {
            // Clean the string: "COMPLETED text-slate-900" -> "COMPLETED"
            let cleanStatus = entry.status
                .replace(/text-slate-900/g, '')
                .replace(/slate-900/g, '')
                .trim();
            
            // Further normalization
            if (cleanStatus.includes('COMPLETED')) cleanStatus = 'COMPLETED';
            if (cleanStatus.includes('ACTIVE')) cleanStatus = 'ACTIVE';

            await prisma.walkinHubEntry.update({
                where: { id: entry.id },
                data: { status: cleanStatus }
            });
            fixCount++;
        }

        // 2. Find and Fix Dummy WhatsApp Statuses
        console.log('🔍 Checking for incorrectly marked dummy WhatsApp statuses...');
        const DUMMY_NUMBERS = ['0000000000', '1234567890', '9876543210'];
        
        const dummyEntries = await prisma.walkinHubEntry.findMany({
            where: {
                whatsappStatus: 'SENT',
                OR: DUMMY_NUMBERS.map(num => ({ contactNumber: { contains: num } }))
            }
        });

        console.log(`🔍 Found ${dummyEntries.length} dummy entries mistakenly marked as SENT.`);

        let waFixCount = 0;
        for (const entry of dummyEntries) {
            await prisma.walkinHubEntry.update({
                where: { id: entry.id },
                data: { 
                    whatsappStatus: 'FAILED',
                    whatsappError: 'Dummy Number Detected'
                }
            });
            waFixCount++;
        }

        console.log(`✅ Successfully cleaned ${fixCount} status labels.`);
        console.log(`✅ Successfully fixed ${waFixCount} WhatsApp dummy statuses!`);

    } catch (error) {
        console.error('❌ Error during cleanup:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanup();

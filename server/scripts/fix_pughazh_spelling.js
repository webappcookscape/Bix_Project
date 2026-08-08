const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixSpelling() {
    console.log('🚀 Starting spelling correction: Pughazh -> Pugazh...');
    
    try {
        // 1. Update Users
        const userUpdate = await prisma.user.updateMany({
            where: {
                OR: [
                    { name: 'Pughazh' },
                    { name: 'PUGHAZH' },
                    { name: 'pughazh' }
                ]
            },
            data: {
                name: 'Pugazh'
            }
        });
        console.log(`✅ Updated ${userUpdate.count} users.`);

        // 2. Update WalkinHubEntry (bhName field)
        const walkinUpdate = await prisma.walkinHubEntry.updateMany({
            where: {
                OR: [
                    { bhName: 'Pughazh' },
                    { bhName: 'PUGHAZH' },
                    { bhName: 'pughazh' }
                ]
            },
            data: {
                bhName: 'Pugazh'
            }
        });
        console.log(`✅ Updated ${walkinUpdate.count} walk-in entries.`);

        // 3. Update WorkReport (bhName field)
        const reportUpdate = await prisma.workReport.updateMany({
            where: {
                OR: [
                    { bhName: 'Pughazh' },
                    { bhName: 'PUGHAZH' },
                    { bhName: 'pughazh' }
                ]
            },
            data: {
                bhName: 'Pugazh'
            }
        });
        console.log(`✅ Updated ${reportUpdate.count} work reports.`);

        console.log('✨ Spelling correction completed successfully!');
    } catch (error) {
        console.error('❌ Error during spelling correction:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixSpelling();

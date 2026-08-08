const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPendingEntries() {
  console.log('--- Checking Pending Entries ---');
  
  try {
    const pendings = await prisma.walkinHubEntry.findMany({
      where: { whatsappStatus: 'PENDING' },
      select: { 
        id: true, 
        clientName: true, 
        inTime: true, 
        whatsappSent: true,
        createdAt: true 
      }
    });

    console.log(`Found ${pendings.length} pending entries.`);
    pendings.forEach(p => {
      console.log(`- [${p.id}] ${p.clientName} | InTime: ${p.inTime} | Created: ${p.createdAt}`);
    });

  } catch (error) {
    console.error('Check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPendingEntries();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeWhatsAppStatus() {
  console.log('--- WhatsApp Review Status Analysis ---');
  
  try {
    const stats = await prisma.walkinHubEntry.groupBy({
      by: ['whatsappStatus'],
      _count: {
        id: true
      }
    });

    console.log('\nStatus Breakdown:');
    stats.forEach(s => {
      console.log(`${s.whatsappStatus}: ${s._count.id}`);
    });

    const failedEntries = await prisma.walkinHubEntry.findMany({
      where: { whatsappStatus: 'FAILED' },
      select: { whatsappError: true },
      take: 20
    });

    if (failedEntries.length > 0) {
      console.log('\nRecent Errors (Sample):');
      const errorCounts = {};
      failedEntries.forEach(e => {
        const err = e.whatsappError || 'Unknown Error';
        errorCounts[err] = (errorCounts[err] || 0) + 1;
      });
      Object.entries(errorCounts).forEach(([err, count]) => {
        console.log(`- [${count}] ${err}`);
      });
    }

    const lastSent = await prisma.walkinHubEntry.findFirst({
      where: { whatsappStatus: 'SENT' },
      orderBy: { whatsappSentAt: 'desc' },
      select: { whatsappSentAt: true, clientName: true }
    });

    if (lastSent) {
      console.log(`\nLast Successful Sync: ${lastSent.whatsappSentAt} (Client: ${lastSent.clientName})`);
    } else {
      console.log('\nNo successful syncs found yet.');
    }

  } catch (error) {
    console.error('Diagnostic failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeWhatsAppStatus();

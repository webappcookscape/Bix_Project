const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up WalkinHubEntry records where WhatsApp was sent but no In-Time is marked...');
  
  const result = await prisma.walkinHubEntry.updateMany({
    where: {
      whatsappSent: true,
      OR: [
        { inTime: "" },
        { inTime: null }
      ]
    },
    data: {
      whatsappSent: false,
      whatsappStatus: 'PENDING',
      whatsappSentAt: null,
      whatsappError: null
    }
  });

  console.log(`Successfully cleaned ${result.count} records.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'WorkReport' AND table_schema = 'public'
    `;
    console.log('WorkReport Columns:', JSON.stringify(result, null, 2));
    
    const result2 = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'WalkinHubEntry' AND table_schema = 'public'
    `;
    console.log('WalkinHubEntry Columns:', JSON.stringify(result2, null, 2));

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

check();

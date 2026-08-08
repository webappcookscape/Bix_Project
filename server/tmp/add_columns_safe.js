const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addColumns() {
  try {
    console.log('Adding bhName to WalkinHubEntry...');
    await prisma.$executeRawUnsafe(`ALTER TABLE "WalkinHubEntry" ADD COLUMN IF NOT EXISTS "bhName" TEXT;`);
    console.log('Successfully added bhName to WalkinHubEntry.');

    console.log('Adding bhName to WorkReport...');
    await prisma.$executeRawUnsafe(`ALTER TABLE "WorkReport" ADD COLUMN IF NOT EXISTS "bhName" TEXT;`);
    console.log('Successfully added bhName to WorkReport.');

  } catch (e) {
    console.error('Error adding columns:', e);
  } finally {
    await prisma.$disconnect();
  }
}

addColumns();

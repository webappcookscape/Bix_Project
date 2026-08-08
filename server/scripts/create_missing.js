const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🛡️ Starting ZERO-DATA-LOSS schema initialization (v2)...');
  try {
    // 1. Create WalkinHubEntry Table
    console.log('🏗️ Creating WalkinHubEntry table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "WalkinHubEntry" (
        "id" TEXT NOT NULL,
        "creId" TEXT NOT NULL,
        "architect" TEXT,
        "bhId" TEXT,
        "bhName" TEXT,
        "clientName" TEXT NOT NULL,
        "contactNumber" TEXT NOT NULL,
        "project" TEXT,
        "status" TEXT DEFAULT 'ACTIVE',
        "dateOfVisit" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "dayOfVisit" TEXT,
        "tentativeTime" TEXT,
        "showroom" TEXT NOT NULL,
        "visitStatusMonday" TEXT,
        "remarks" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "WalkinHubEntry_pkey" PRIMARY KEY ("id")
      );
    `);

    // 2. Create WorkReport Table
    console.log('🏗️ Creating WorkReport table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "WorkReport" (
        "id" TEXT NOT NULL,
        "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "nextFD" TIMESTAMP(3),
        "clientName" TEXT NOT NULL,
        "contact" TEXT NOT NULL,
        "source" TEXT,
        "showroom" TEXT NOT NULL,
        "status" TEXT DEFAULT 'Y',
        "faName" TEXT,
        "bhId" TEXT,
        "bhName" TEXT,
        "creId" TEXT,
        "site" TEXT,
        "star" INTEGER NOT NULL DEFAULT 0,
        "remarks" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "WorkReport_pkey" PRIMARY KEY ("id")
      );
    `);

    // 3. Create CREMonthlyReport Table
    console.log('🏗️ Creating CREMonthlyReport table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "CREMonthlyReport" (
        "id" TEXT NOT NULL,
        "creId" TEXT NOT NULL,
        "month" INTEGER NOT NULL,
        "year" INTEGER NOT NULL,
        "calls" INTEGER NOT NULL DEFAULT 0,
        "srv" INTEGER NOT NULL DEFAULT 0,
        "proposals" INTEGER NOT NULL DEFAULT 0,
        "orders" INTEGER NOT NULL DEFAULT 0,
        "value" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "CREMonthlyReport_pkey" PRIMARY KEY ("id")
      );
    `);

    // Add unique constraint for CREMonthlyReport
    console.log('🏗️ Ensuring Monthly Report uniqueness...');
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "CREMonthlyReport_creId_month_year_key" 
      ON "CREMonthlyReport"("creId", "month", "year");
    `);

    console.log('✨ All missing CRE tables created/verified successfully!');
    console.log('🚀 Your critical data in User, Project, and other tables is UNTOUCHED.');

  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main();

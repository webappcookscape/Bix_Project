const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findTableName(baseName) {
  // Query to find the actual table name regardless of case in PostgreSQL
  const result = await prisma.$queryRaw`
    SELECT tablename 
    FROM pg_catalog.pg_tables 
    WHERE schemaname = 'public' 
    AND LOWER(tablename) = LOWER(${baseName})
    LIMIT 1;
  `;
  return result[0]?.tablename;
}

// Configuration for tables and their new columns
const SCHEMA_UPDATES = {
  'WalkinHubEntry': [
    'ADD COLUMN IF NOT EXISTS "bhName" TEXT',
    'ADD COLUMN IF NOT EXISTS "inTime" TEXT',
    'ADD COLUMN IF NOT EXISTS "outTime" TEXT',
    'ADD COLUMN IF NOT EXISTS "remarks" TEXT',
    'ADD COLUMN IF NOT EXISTS "status" TEXT',
    'ADD COLUMN IF NOT EXISTS "architectName" TEXT',
    'ADD COLUMN IF NOT EXISTS "architectId" TEXT',
    'ADD COLUMN IF NOT EXISTS "whatsappStatus" TEXT DEFAULT \'PENDING\'',
    'ADD COLUMN IF NOT EXISTS "whatsappError" TEXT',
    'ADD COLUMN IF NOT EXISTS "whatsappSentAt" TIMESTAMP',
    'ADD COLUMN IF NOT EXISTS "whatsappSent" BOOLEAN DEFAULT FALSE',
    'ADD COLUMN IF NOT EXISTS "outTimeMarkedAt" TIMESTAMP',
    'ADD COLUMN IF NOT EXISTS "source" TEXT',
    'ADD COLUMN IF NOT EXISTS "site" TEXT',
    'ADD COLUMN IF NOT EXISTS "star" INTEGER DEFAULT 0',
    'ADD COLUMN IF NOT EXISTS "dateOfVisit" TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
  ],
  'WorkReport': [
    'ADD COLUMN IF NOT EXISTS "bhName" TEXT',
    'ADD COLUMN IF NOT EXISTS "inTime" TEXT',
    'ADD COLUMN IF NOT EXISTS "outTime" TEXT',
    'ADD COLUMN IF NOT EXISTS "remarks" TEXT',
    'ADD COLUMN IF NOT EXISTS "status" TEXT',
    'ADD COLUMN IF NOT EXISTS "architectName" TEXT',
    'ADD COLUMN IF NOT EXISTS "architectId" TEXT',
    'ADD COLUMN IF NOT EXISTS "whatsappStatus" TEXT DEFAULT \'PENDING\'',
    'ADD COLUMN IF NOT EXISTS "whatsappError" TEXT',
    'ADD COLUMN IF NOT EXISTS "whatsappSentAt" TIMESTAMP',
    'ADD COLUMN IF NOT EXISTS "whatsappSent" BOOLEAN DEFAULT FALSE',
    'ADD COLUMN IF NOT EXISTS "outTimeMarkedAt" TIMESTAMP',
    'ADD COLUMN IF NOT EXISTS "source" TEXT',
    'ADD COLUMN IF NOT EXISTS "site" TEXT',
    'ADD COLUMN IF NOT EXISTS "star" INTEGER DEFAULT 0',
    'ADD COLUMN IF NOT EXISTS "dateOfVisit" TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
  ],
  'Project': [
    'ADD COLUMN IF NOT EXISTS "freezingAmount" DOUBLE PRECISION',
    'ADD COLUMN IF NOT EXISTS "variant" TEXT',
    'ADD COLUMN IF NOT EXISTS "woodworkAmount" DOUBLE PRECISION',
    'ADD COLUMN IF NOT EXISTS "addOnsAmount" DOUBLE PRECISION',
    'ADD COLUMN IF NOT EXISTS "quoteLink" TEXT',
    'ADD COLUMN IF NOT EXISTS "freezingMailNote" TEXT',
    'ADD COLUMN IF NOT EXISTS "billingName" TEXT',
    'ADD COLUMN IF NOT EXISTS "billingAddress" TEXT',
    'ADD COLUMN IF NOT EXISTS "billingPhone" TEXT',
    'ADD COLUMN IF NOT EXISTS "handingOverMonth" TEXT',
    'ADD COLUMN IF NOT EXISTS "handingOverYear" TEXT',
    'ADD COLUMN IF NOT EXISTS "cpNumber" TEXT',
    'ADD COLUMN IF NOT EXISTS "gstin" TEXT',
    'ADD COLUMN IF NOT EXISTS "spouseName" TEXT',
    'ADD COLUMN IF NOT EXISTS "spousePhone" TEXT',
    'ADD COLUMN IF NOT EXISTS "propertyType" TEXT',
    'ADD COLUMN IF NOT EXISTS "scopeOfWork" TEXT',
    'ADD COLUMN IF NOT EXISTS "leadSource" TEXT',
    'ADD COLUMN IF NOT EXISTS "salesRep" TEXT',
    'ADD COLUMN IF NOT EXISTS "unitNumber" TEXT',
    'ADD COLUMN IF NOT EXISTS "block" TEXT',
    'ADD COLUMN IF NOT EXISTS "floor" TEXT',
    'ADD COLUMN IF NOT EXISTS "area" TEXT',
    'ADD COLUMN IF NOT EXISTS "createdBy" TEXT',
    'ADD COLUMN IF NOT EXISTS "handoverDate" TIMESTAMP'
  ]
};

async function main() {
  try {
    for (const [modelName, columns] of Object.entries(SCHEMA_UPDATES)) {
      const actualTableName = await findTableName(modelName);
      
      if (!actualTableName) {
        console.warn(`⚠️ Warning: Table for model "${modelName}" not found in database. Skipping.`);
        continue;
      }
      
      console.log(`✅ Found table: "${actualTableName}" for model "${modelName}"`);
      
      const alterStatement = `ALTER TABLE "${actualTableName}" ${columns.join(', ')}`;
      
      // Use double quotes for safety in PostgreSQL to preserve exact case
      await prisma.$executeRawUnsafe(alterStatement);
      console.log(`✨ Successfully checked/updated columns in table "${actualTableName}"`);
    }
    
    console.log('🚀 Database schema check completed successfully.');
  } catch (error) {
    console.error('❌ Error updating database:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnose() {
  console.log('🔍 Starting Database Diagnosis...');
  try {
    // 1. Check connection
    await prisma.$connect();
    console.log('✅ Connection to database established.');

    // 2. List all schemas
    const schemas = await prisma.$queryRaw`SELECT schema_name FROM information_schema.schemata`;
    console.log('📂 Available Schemas:', schemas.map(s => s.schema_name).join(', '));

    // 3. List all tables across ALL schemas
    const tables = await prisma.$queryRaw`
      SELECT schemaname, tablename 
      FROM pg_catalog.pg_tables 
      WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
    `;
    
    if (tables.length === 0) {
      console.log('⚠️  No tables found in any schema! Your database might be empty.');
    } else {
      console.log('📋 Existing Tables:');
      tables.forEach(t => console.log(`   - [${t.schemaname}] ${t.tablename}`));
    }

    // 4. Check current schema
    const currentSchema = await prisma.$queryRaw`SELECT current_schema()`;
    console.log('📍 Current Search Path Schema:', currentSchema[0].current_schema);

  } catch (error) {
    console.error('❌ Diagnosis Error:', error.message);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

diagnose();

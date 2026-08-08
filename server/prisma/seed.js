const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seeding Database...");

    // 1. Create/Update Super Admin (Safe Operation)
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Using upsert ensures we don't duplicate or error if admin exists
    const admin = await prisma.user.upsert({
        where: { email: 'admin@cookscape.com' },
        update: {}, // No updates if exists
        create: {
            email: 'admin@cookscape.com',
            name: 'Super Admin',
            passwordHash: hashedPassword,
            role: 'SUPER_ADMIN',
        },
    });


    console.log("✅ Seeding Complete.");
    console.log({ admin });
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });

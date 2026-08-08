const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const fa = await prisma.user.findFirst({
            where: { email: 'durability.cookscape@gmail.com' }
        });
        const bh = await prisma.user.findFirst({
            where: { name: { contains: 'SANGA TAMIZH', mode: 'insensitive' } }
        });
        const superadmins = await prisma.user.findMany({
            where: { role: 'SUPER_ADMIN' }
        });
        
        console.log(JSON.stringify({ fa, bh, superadmins }, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

main();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Testing database connection...");
        const count = await prisma.user.count();
        console.log(`Connection successful! Total users: ${count}`);
    } catch (e) {
        console.error("Connection failed:");
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
main();

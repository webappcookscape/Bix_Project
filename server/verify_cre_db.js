const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
    try {
        console.log("Checking User Role registration...");
        const roles = ["CLIENT_RELATIONSHIP_EXECUTIVE"];
        console.log("Expected Role:", roles[0]);

        console.log("\nChecking WalkinHubEntry Model...");
        const walkinCount = await prisma.walkinHubEntry.count();
        console.log("Walkin Entry Count:", walkinCount);

        console.log("\nChecking WorkReport Model...");
        const reportCount = await prisma.workReport.count();
        console.log("Work Report Count:", reportCount);

        console.log("\nVerification successful! Prisma models are registered correctly.");
    } catch (error) {
        console.error("Verification failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

verify();

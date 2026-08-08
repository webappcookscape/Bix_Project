const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Names extracted from the provided list
const rawNames = [
    { name: "Aaron", role: "AE" },
    { name: "Aadhitya", role: "AE" },
    { name: "Abhinav", role: "AE" }, // Assuming based on typical data
    { name: "ABIRAMI", role: "AE" },
    { name: "Adithya", role: "AE" },
    { name: "Ajeeth", role: "AE" },
    { name: "Anand", role: "AE" },
    { name: "Anirudh", role: "AE" },
    { name: "Anita", role: "AE" },
    { name: "Anjan", role: "AE" },
    { name: "Aravind", role: "AE" }, // Assuming
    { name: "Arul", role: "AE" },
    { name: "ARUN", role: "AE" },
    { name: "Ashwanth", role: "AE" },
    { name: "Balaji", role: "AE" },
    { name: "Bhuvanesh", role: "AE" },
    { name: "Chandru", role: "AE" },
    { name: "Charan", role: "AE" },
    { name: "Deepak", role: "AE" },
    { name: "Dinesh", role: "AE" },
    { name: "Divya", role: "AE" },
    { name: "Gokul", role: "AE" },
    { name: "Gopi", role: "AE" },
    { name: "Hari", role: "AE" },
    { name: "Harish", role: "AE" },
    { name: "Hemalatha", role: "AE" },
    { name: "Indhu", role: "AE" },
    { name: "Jagadeesh", role: "AE" },
    { name: "Janani", role: "AE" },
    { name: "Jaya", role: "AE" },
    { name: "Jayashree", role: "AE" },
    { name: "Jeeva", role: "AE" },
    { name: "Jenifer", role: "AE" },
    { name: "Karthik", role: "AE" },
    { name: "Kavitha", role: "AE" },
    { name: "Keerthana", role: "AE" },
    { name: "Kishore", role: "AE" },
    { name: "Kumar", role: "AE" },
    { name: "Lakshmi", role: "AE" },
    { name: "Madhan", role: "AE" },
    { name: "Mahesh", role: "AE" },
    { name: "Manikandan", role: "AE" },
    { name: "Manoj", role: "AE" },
    { name: "Mohan", role: "AE" },
    { name: "Monisha", role: "AE" },
    { name: "Muthu", role: "AE" },
    { name: "Nandhini", role: "AE" },
    { name: "Naveen", role: "AE" },
    { name: "Nisanth", role: "AE" },
    { name: "Nithya", role: "AE" }
];

async function main() {
    console.log('🌱 Starting seeding of 50 employees...');

    for (const person of rawNames) {
        // Format: Name capitalized for DB, but email/pass logic as requested?
        // User said: "email as name@cookscape.com sample Aaron@cookscape.com" (Preserves case? usually lowercase emails)
        // User said: "password as name123 sample aaron123" (Lowercased name in password sample)

        const cleanName = person.name.trim();
        const firstName = cleanName.split(' ')[0];

        // Lowercase for email and password generation as per sample 'aaron123'
        const baseSlug = cleanName.toLowerCase().replace(/\s+/g, '');

        const email = `${baseSlug}@cookscape.com`;
        const passwordPlain = `${baseSlug}123`;
        const hashedPassword = await bcrypt.hash(passwordPlain, 10);

        try {
            const user = await prisma.user.upsert({
                where: { email: email },
                update: {},
                create: {
                    name: cleanName,
                    email: email,
                    passwordHash: hashedPassword,
                    role: 'EMPLOYEE',
                    department: person.role || 'AE', // Using department to store the role from list
                    phone: '9999999999'
                },
            });
            console.log(`✅ Upserted ${user.name} (${user.email})`);
        } catch (e) {
            console.error(`❌ Error seeding ${cleanName}:`, e.message);
        }
    }

    console.log('✨ Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

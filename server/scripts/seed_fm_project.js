const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { sendFreezingMail } = require('../src/services/emailService');
const path = require('path');
const fs = require('fs');

async function main() {
    console.log("🚀 Starting One-Time Manual Entry for Mr.Suryanarayanan...");

    try {
        // 1. Ensure FA and BH exist
        // Create FA: Ar. Renukha Gopalan
        let fa = await prisma.user.upsert({
            where: { email: 'durability.cookscape@gmail.com' },
            update: {},
            create: {
                name: "Ar. Renukha Gopalan",
                email: "durability.cookscape@gmail.com",
                passwordHash: "$2b$10$016LvshNHIbEq06j4NmzwuaLkE9D.lo0y1qN11I0DJ/zUcztgeJ0m", // Mock hash
                role: "EMPLOYEE",
                department: "FA",
                phone: "9600427021",
                status: "ACTIVE"
            }
        });

        // Find BH: Sanga Tamizh (Sangathamizh already exists with designteam email)
        let bh = await prisma.user.findFirst({
            where: { OR: [
                { name: { contains: "Sanga", mode: "insensitive" } },
                { email: "designteam.cookscape@gmail.com" }
            ]}
        });

        // 2. Generate Dummy Attachments for the mail
        const uploadsDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
        
        const dummyFiles = [
            'floor_plan.pdf',
            'site_image.jpg',
            'quotation_draft.xlsx'
        ];
        
        const attachments = dummyFiles.map(filename => {
            const filePath = path.join(uploadsDir, filename);
            if (!fs.existsSync(filePath)) {
                fs.writeFileSync(filePath, "Mock file content for testing.");
            }
            return {
                filename: filename,
                path: filePath
            };
        });

        // 3. Create the Project
        const project = await prisma.project.create({
            data: {
                name: "Purvankara Windmare - 14th Floor",
                projectCode: "PRJ-" + Date.now().toString().slice(-6),
                clientFirstName: "Suryanarayanan",
                clientLastName: "Mr.",
                clientEmail: "subanth123@gmail.com",
                clientPhone: "9600427021",
                location: "purvankara windmare, 14th floor",
                budget: 968834,
                startDate: new Date(),
                deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
                timelineDuration: 45,
                clientPassword: "password123", // Needs encryption if using for login
                leadSource: "ARUN PANDI",
                faId: fa.id,
                businessHeadId: bh ? bh.id : null,
                
                // Freezing Mail Details
                freezingAmount: 30000,
                variant: "4x tuff gloss+ elegant surabhi",
                woodworkAmount: 877934,
                addOnsAmount: 90700,
                quoteLink: "https://docs.google.com/spreadsheets/d/1yqj9uBxKVznnrDmOGLtX0vBX63BmuQtqR2UM03zAL0s/edit?usp=sharing",
                freezingMailNote: "1. Very Immediate FM & PDI\n2. Entered via manual one-time script for Suryanarayanan"
            },
            include: {
                fa: { select: { id: true, name: true, email: true } },
                businessHead: { select: { id: true, name: true, email: true } }
            }
        });

        console.log(`✅ Project created successfully: ${project.name} (${project.projectCode})`);

        // 4. Trigger the Freezing Mail
        const superadmins = await prisma.user.findMany({
            where: { role: 'SUPER_ADMIN' },
            select: { email: true }
        });
        
        const recipients = [
            'durability.cookscape@gmail.com', // FA
            'subanth123@gmail.com',         // User requested
            ...superadmins.map(s => s.email)
        ];

        console.log(`📧 Sending Freezing Mail to: ${recipients.join(', ')}...`);
        
        await sendFreezingMail({
            project: project,
            recipients: recipients,
            attachments: attachments
        });

        console.log("✨ Manual entry and email notification complete!");

    } catch (err) {
        console.error("❌ Error during manual entry:", err);
    } finally {
        await prisma.$disconnect();
    }
}

main();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
    const creId = '9881bfaa-59de-4251-aa80-1c23f277ca01';
    
    console.log("🌱 Seeding Dummy Data for Jan-Mar 2026...");

    const months = [
        { name: 'January', val: 1, year: 2026 },
        { name: 'February', val: 2, year: 2026 },
        { name: 'March', val: 3, year: 2026 }
    ];

    for (const m of months) {
        // 1. Monthly Performance Data
        await prisma.cREMonthlyReport.upsert({
            where: { creId_month_year: { creId, month: m.val, year: m.year } },
            update: {
                calls: 45 + m.val * 10,
                srv: 12 + m.val * 2,
                proposals: 8 + m.val,
                orders: 2 + m.val,
                value: 12.5 + m.val * 5
            },
            create: {
                creId,
                month: m.val,
                year: m.year,
                calls: 45 + m.val * 10,
                srv: 12 + m.val * 2,
                proposals: 8 + m.val,
                orders: 2 + m.val,
                value: 12.5 + m.val * 5
            }
        });

        // 2. Work Reports
        const days = [5, 15, 25];
        for (const day of days) {
            const reportDate = new Date(m.year, m.val - 1, day);
            await prisma.workReport.create({
                data: {
                    creId,
                    clientName: `Dummy Client ${m.name} ${day}`,
                    contact: `9000000${m.val}${day}`,
                    showroom: 'MTRS',
                    source: 'DUMMY SEED',
                    status: day % 2 === 0 ? 'Y' : 'N',
                    site: 'Velachery',
                    star: day % 5 + 5,
                    remarks: `Experimental seed for ${m.name} ${day}`,
                    date: reportDate,
                    createdAt: reportDate
                }
            });

            // 3. Walk-in entries
            await prisma.walkinHubEntry.create({
                data: {
                    creId,
                    clientName: `Visitor ${m.name} ${day}`,
                    contactNumber: `8000000${m.val}${day}`,
                    showroom: 'MTRS',
                    status: 'COMPLETED',
                    dateOfVisit: reportDate,
                    createdAt: reportDate,
                    tentativeTime: '11:00'
                }
            });
        }
    }

    console.log("✅ Seeding Complete. 9 Reports and 9 Walk-ins added.");
}

seed()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });

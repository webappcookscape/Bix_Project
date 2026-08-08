const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.upsertReport = async (req, res) => {
    try {
        const { month, year, calls, srv, proposals, orders, value, creId } = req.body;
        const { id: userId, role } = req.user;
        
        // If Admin/Manager/LeadOp, allow creId from body. Otherwise, strictly use logged in user id.
        const targetCreId = (['SUPER_ADMIN', 'MANAGER', 'BUSINESS_HEAD', 'LEAD_OPERATION'].includes(role) && creId) 
            ? creId 
            : userId;

        // Ensure these are integers/floats
        const data = {
            calls: parseInt(calls) || 0,
            srv: parseInt(srv) || 0,
            proposals: parseInt(proposals) || 0,
            orders: parseInt(orders) || 0,
            value: parseFloat(value) || 0
        };

        const report = await prisma.cREMonthlyReport.upsert({
            where: {
                creId_month_year: {
                    creId: targetCreId,
                    month: parseInt(month),
                    year: parseInt(year)
                }
            },
            update: data,
            create: {
                creId: targetCreId,
                month: parseInt(month),
                year: parseInt(year),
                ...data
            }
        });

        res.status(200).json(report);
    } catch (error) {
        console.error('[MonthlyReport] Upsert Error:', error);
        res.status(400).json({ error: error.message });
    }
};

exports.getReports = async (req, res) => {
    try {
        const { month, year } = req.query;
        const { role, id: userId } = req.user;
        const filter = {};

        if (month && !isNaN(parseInt(month))) filter.month = parseInt(month);
        if (year && !isNaN(parseInt(year))) filter.year = parseInt(year);

        // If not admin/manager/leadop, only show user's own reports
        if (!['SUPER_ADMIN', 'MANAGER', 'BUSINESS_HEAD', 'LEAD_OPERATION'].includes(role)) {
            filter.creId = userId;
        }

        const reports = await prisma.cREMonthlyReport.findMany({
            where: filter,
            include: {
                cre: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: [
                { year: 'desc' },
                { month: 'desc' }
            ]
        });

        res.json(reports);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getSummary = async (req, res) => {
    try {
        const { month, year } = req.query;
        const filter = {};

        if (month && !isNaN(parseInt(month))) filter.month = parseInt(month);
        if (year && !isNaN(parseInt(year))) filter.year = parseInt(year);

        const aggregates = await prisma.cREMonthlyReport.aggregate({
            where: filter,
            _sum: {
                calls: true,
                srv: true,
                proposals: true,
                orders: true,
                value: true
            }
        });

        res.json(aggregates || { calls: 0, srv: 0, proposals: 0, orders: 0, value: 0 });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.syncReports = async (req, res) => {
    try {
        const { month, year } = req.body;
        if (!month || !year) return res.status(400).json({ error: "Month and Year required" });

        // Fetch all active CRE users
        const cres = await prisma.user.findMany({
            where: { role: 'CLIENT_RELATIONSHIP_EXECUTIVE', status: 'ACTIVE' }
        });

        const syncResults = [];

        for (const cre of cres) {
            // 1. Calculate SRV (Visits) from WalkinHub
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59);

            const srvCount = await prisma.walkinHubEntry.count({
                where: {
                    creId: cre.id,
                    dateOfVisit: {
                        gte: startDate,
                        lte: endDate
                    }
                }
            });

            // 2. Calculate Orders from WorkReport (Status 'Y')
            const ordersCount = await prisma.workReport.count({
                where: {
                    creId: cre.id,
                    date: {
                        gte: startDate,
                        lte: endDate
                    },
                    status: 'Y'
                }
            });

            // 3. Upsert into CREMonthlyReport
            const report = await prisma.cREMonthlyReport.upsert({
                where: {
                    creId_month_year: {
                        creId: cre.id,
                        month: parseInt(month),
                        year: parseInt(year)
                    }
                },
                update: {
                    srv: srvCount,
                    orders: ordersCount
                },
                create: {
                    creId: cre.id,
                    month: parseInt(month),
                    year: parseInt(year),
                    srv: srvCount,
                    orders: ordersCount,
                    calls: 0,
                    proposals: 0,
                    value: 0
                }
            });

            syncResults.push({ cre: cre.name, report });
        }

        res.json({ message: `Successfully synced ${syncResults.length} CRE records`, results: syncResults });
    } catch (error) {
        console.error('[Sync] Error:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.deleteReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.user;

        // Restriction: Only admin/manager/leadop roles can delete
        if (!['SUPER_ADMIN', 'MANAGER', 'BUSINESS_HEAD', 'LEAD_OPERATION'].includes(role)) {
            return res.status(403).json({ error: "Unauthorized: Only managers can delete monthly history" });
        }

        const report = await prisma.cREMonthlyReport.findUnique({
            where: { id }
        });

        if (!report) {
            return res.status(404).json({ error: "Report not found" });
        }

        await prisma.cREMonthlyReport.delete({
            where: { id }
        });

        res.json({ message: "Monthly report deleted successfully" });
    } catch (error) {
        console.error('[DeleteReport] Error:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.bulkImportReports = async (req, res) => {
    try {
        const data = req.body;
        if (!Array.isArray(data)) return res.status(400).json({ error: "Expected an array" });

        const results = [];
        for (const item of data) {
            // Basic sanitization
            const month = parseInt(item.month);
            const year = parseInt(item.year);
            const creId = item.creId || req.user.id;

            if (!month || !year) continue;

            const report = await prisma.cREMonthlyReport.upsert({
                where: {
                    creId_month_year: {
                        creId,
                        month,
                        year
                    }
                },
                update: {
                    calls: parseInt(item.calls) || 0,
                    srv: parseInt(item.srv) || 0,
                    proposals: parseInt(item.proposals) || 0,
                    orders: parseInt(item.orders) || 0,
                    value: parseFloat(item.value) || 0
                },
                create: {
                    creId,
                    month,
                    year,
                    calls: parseInt(item.calls) || 0,
                    srv: parseInt(item.srv) || 0,
                    proposals: parseInt(item.proposals) || 0,
                    orders: parseInt(item.orders) || 0,
                    value: parseFloat(item.value) || 0
                }
            });
            results.push(report);
        }

        res.json({ success: true, count: results.length });
    } catch (error) {
        console.error('[BulkImportReports] Error:', error);
        res.status(500).json({ error: error.message });
    }
};

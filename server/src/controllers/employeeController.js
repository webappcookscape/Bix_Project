const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

// Get only Business Heads
exports.getBusinessHeads = async (req, res) => {
    try {
        const bhs = await prisma.user.findMany({
            where: {
                role: {
                    in: ['MANAGER', 'BUSINESS_HEAD']
                },
                status: 'ACTIVE'
            },
            select: {
                id: true,
                name: true,
                role: true
            }
        });
        res.json(bhs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get only CREs
exports.getCREs = async (req, res) => {
    try {
        const cres = await prisma.user.findMany({
            where: {
                role: 'CLIENT_RELATIONSHIP_EXECUTIVE',
                status: 'ACTIVE'
            },
            select: {
                id: true,
                name: true
            }
        });
        res.json(cres);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all employees (excluding deleted)
exports.getEmployees = async (req, res) => {
    try {
        const employees = await prisma.user.findMany({
            where: {
                status: {
                    not: 'DELETED'
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
                department: true,
                role: true,
                status: true,
                phone: true,
                createdAt: true
            }
        });
        res.json(employees);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create new employee
exports.createEmployee = async (req, res) => {
    try {
        const { password, ...data } = req.body;

        // Hash password if provided, else use default 'cookscape123'
        const passwordHash = await bcrypt.hash(password || 'cookscape123', 10);

        const employee = await prisma.user.create({
            data: {
                ...data,
                passwordHash,
                role: data.role || 'EMPLOYEE'
            }
        });

        // Remove hash from response
        const { passwordHash: _, ...result } = employee;
        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update employee
exports.updateEmployee = async (req, res) => {
    try {
        const { password, ...data } = req.body;
        const updateData = { ...data };

        if (password) {
            updateData.passwordHash = await bcrypt.hash(password, 10);
        }

        const employee = await prisma.user.update({
            where: { id: req.params.id },
            data: updateData
        });

        const { passwordHash: _, ...result } = employee;
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete employee (Soft Delete)
exports.deleteEmployee = async (req, res) => {
    try {
        await prisma.user.update({
            where: { id: req.params.id },
            data: { status: 'DELETED' }
        });
        res.json({ message: 'Employee marked as deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
// Bulk Create Employees
exports.bulkCreateEmployees = async (req, res) => {
    try {
        const users = req.body; // Array of user objects
        if (!Array.isArray(users) || users.length === 0) {
            return res.status(400).json({ error: "Invalid data format. Expected an array of users." });
        }

        const stats = { added: 0, skipped: 0, errors: [] };
        const newUsers = [];

        // 1. Identify Emails
        const inputEmails = users.filter(u => u.email).map(u => u.email);

        // 2. Find Existing Users
        const existingUsers = await prisma.user.findMany({
            where: { email: { in: inputEmails } },
            select: { email: true }
        });
        const existingEmailSet = new Set(existingUsers.map(u => u.email));

        // 3. Process Input
        for (const user of users) {
            if (!user.email || !user.name || !user.role) {
                stats.errors.push(`Row missing required fields: ${user.email || 'No Email'}`);
                continue;
            }

            if (existingEmailSet.has(user.email)) {
                stats.skipped++;
                continue;
            }

            // Hash Password
            const passwordHash = await bcrypt.hash(user.password || 'Orbix@123', 10);

            newUsers.push({
                name: user.name,
                email: user.email,
                role: user.role, // "EMPLOYEE", "MANAGER" etc.
                department: user.department || null,
                phone: user.phone || null,
                passwordHash,
                status: 'ACTIVE'
            });
        }

        // 4. Batch Insert
        if (newUsers.length > 0) {
            // SQLite supports createMany
            const result = await prisma.user.createMany({
                data: newUsers
            });
            stats.added = result.count;
        }

        res.json({ success: true, ...stats });

    } catch (error) {
        console.error("Bulk Import Error:", error);
        res.status(500).json({ error: "Bulk import failed: " + error.message });
    }
};

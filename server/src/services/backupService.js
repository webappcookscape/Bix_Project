const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BACKUP_DIR = path.join(__dirname, '../../backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const { sendBackupEmail } = require('./emailService');

// Function to create a backup
const createBackup = async () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.json`;
    const filepath = path.join(BACKUP_DIR, filename);

    console.log(`[Backup] Starting backup: ${filename}...`);

    try {
        // Fetch all data
        const users = await prisma.user.findMany();
        const projects = await prisma.project.findMany();
        const tasks = await prisma.task.findMany();
        const messages = await prisma.message.findMany();
        const employees = await prisma.user.findMany({ where: { role: 'EMPLOYEE' } }); // Redundant but consistent

        const backupData = {
            timestamp: new Date(),
            counts: {
                users: users.length,
                projects: projects.length,
                tasks: tasks.length,
                messages: messages.length
            },
            data: {
                users,
                projects,
                tasks,
                messages
            }
        };

        fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));
        console.log(`[Backup] Success! Saved to ${filepath}`);

        // Trigger Email Dispatch
        let emailResult = { success: false, message: "Skipped" };
        try {
            console.log('[Backup] Attempting Email Dispatch...');
            emailResult = await sendBackupEmail(filepath, filename);
        } catch (emailErr) {
            console.error('[Backup] Email send warning:', emailErr.message);
            emailResult = { success: false, error: emailErr.message };
        }

        return { success: true, filename, path: filepath, emailBackup: emailResult };
    } catch (error) {
        console.error(`[Backup] Failed:`, error);
        return { success: false, error: error.message };
    }
};

// Function into list all backups
const listBackups = () => {
    if (!fs.existsSync(BACKUP_DIR)) return [];

    return fs.readdirSync(BACKUP_DIR)
        .filter(file => file.endsWith('.json'))
        .map(file => {
            const stats = fs.statSync(path.join(BACKUP_DIR, file));
            return {
                filename: file,
                size: (stats.size / 1024).toFixed(2) + ' KB',
                createdAt: stats.birthtime
            };
        })
        .sort((a, b) => b.createdAt - a.createdAt); // Newest first
};

// Schedule: Daily at 2:00 AM
const initScheduler = () => {
    // 0 2 * * * = At 02:00 everyday
    cron.schedule('0 2 * * *', () => {
        console.log('[Scheduler] Running daily backup...');
        createBackup();
    });
    console.log('[Scheduler] Backup Job Initialized (Daily at 2:00 AM)');
};

// Function to delete a backup
const deleteBackup = (filename) => {
    const filepath = path.join(BACKUP_DIR, filename);
    if (!fs.existsSync(filepath)) {
        throw new Error("Backup file not found");
    }
    fs.unlinkSync(filepath);
    return { success: true, message: `Backup ${filename} deleted` };
};

// Function to restore a backup
const restoreBackup = async (filename, options = {}) => {
    const mode = options.mode || 'merge';
    const dryRun = options.dryRun === true;
    const filepath = path.join(BACKUP_DIR, filename);

    if (!fs.existsSync(filepath)) {
        throw new Error(`Backup file not found: ${filename}`);
    }

    console.log(`[Restore] Reading backup file: ${filename} (Mode: ${mode}, DryRun: ${dryRun})...`);
    const backupContent = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    const { users = [], projects = [], tasks = [], messages = [] } = backupContent.data || {};

    const result = {
        success: true,
        dryRun,
        mode,
        filename,
        counts: {
            users: users.length,
            projects: projects.length,
            tasks: tasks.length,
            messages: messages.length
        },
        restored: {
            users: 0,
            projects: 0,
            tasks: 0,
            messages: 0
        }
    };

    if (dryRun) {
        console.log(`[Restore] Dry run completed successfully for ${filename}`);
        return result;
    }

    if (mode === 'replace') {
        console.log("[Restore] Replace mode: Clearing existing core tables...");
        
        // 1. Delete Messages
        await prisma.message.deleteMany();
        // 2. Delete Tasks
        await prisma.task.deleteMany();
        // 3. Delete Projects
        await prisma.project.deleteMany();
        
        // 4. Delete Users
        try {
            await prisma.user.deleteMany();
        } catch (err) {
            console.warn("[Restore] Warning clearing User table directly: ", err.message);
        }

        console.log("[Restore] Creating users from backup...");
        for (const u of users) {
            await prisma.user.create({ data: u });
            result.restored.users++;
        }

        console.log("[Restore] Creating projects from backup...");
        for (const p of projects) {
            await prisma.project.create({ data: p });
            result.restored.projects++;
        }

        console.log("[Restore] Creating tasks from backup...");
        for (const t of tasks) {
            await prisma.task.create({ data: t });
            result.restored.tasks++;
        }

        console.log("[Restore] Creating messages from backup...");
        for (const m of messages) {
            await prisma.message.create({ data: m });
            result.restored.messages++;
        }
    } else {
        // Merge Mode
        console.log("[Restore] Merge mode: Processing records...");
        
        const userMap = {}; // backupId -> dbId
        const projectMap = {}; // backupId -> dbId

        // 1. Restore/Merge Users
        for (const u of users) {
            // Find by email or id
            let dbUser = await prisma.user.findFirst({
                where: {
                    OR: [
                        { email: u.email },
                        { id: u.id }
                    ]
                }
            });

            if (dbUser) {
                // Update existing user fields (except id/email)
                const { id: _, email: __, createdAt: ___, updatedAt: ____, ...updateFields } = u;
                dbUser = await prisma.user.update({
                    where: { id: dbUser.id },
                    data: updateFields
                });
                userMap[u.id] = dbUser.id;
            } else {
                // Create user
                const newUser = await prisma.user.create({ data: u });
                userMap[u.id] = newUser.id;
                result.restored.users++;
            }
        }

        // 2. Restore/Merge Projects
        for (const p of projects) {
            // Find by projectCode, cpNumber, or id
            const orConditions = [{ id: p.id }];
            if (p.projectCode) orConditions.push({ projectCode: p.projectCode });
            if (p.cpNumber) orConditions.push({ cpNumber: p.cpNumber });

            let dbProject = await prisma.project.findFirst({
                where: { OR: orConditions }
            });

            // Map owner IDs if they exist in userMap
            const businessHeadId = p.businessHeadId ? (userMap[p.businessHeadId] || p.businessHeadId) : null;
            const faId = p.faId ? (userMap[p.faId] || p.faId) : null;
            const laId = p.laId ? (userMap[p.laId] || p.laId) : null;

            const projectData = {
                ...p,
                businessHeadId,
                faId,
                laId
            };

            if (dbProject) {
                // Update
                const { id: _, projectCode: __, cpNumber: ___, createdAt: ____, updatedAt: _____, ...updateFields } = projectData;
                dbProject = await prisma.project.update({
                    where: { id: dbProject.id },
                    data: updateFields
                });
                projectMap[p.id] = dbProject.id;
            } else {
                // Create
                const newProject = await prisma.project.create({ data: projectData });
                projectMap[p.id] = newProject.id;
                result.restored.projects++;
            }
        }

        // 3. Restore/Merge Tasks
        for (const t of tasks) {
            let dbTask = await prisma.task.findUnique({
                where: { id: t.id }
            });

            const projectId = projectMap[t.projectId] || t.projectId;
            const employeeId = t.employeeId ? (userMap[t.employeeId] || t.employeeId) : null;

            const taskData = {
                ...t,
                projectId,
                employeeId
            };

            if (dbTask) {
                const { id: _, createdAt: __, updatedAt: ___, ...updateFields } = taskData;
                await prisma.task.update({
                    where: { id: dbTask.id },
                    data: updateFields
                });
            } else {
                await prisma.task.create({ data: taskData });
                result.restored.tasks++;
            }
        }

        // 4. Restore/Merge Messages
        for (const m of messages) {
            let dbMessage = await prisma.message.findUnique({
                where: { id: m.id }
            });

            const projectId = projectMap[m.projectId] || m.projectId;

            const messageData = {
                ...m,
                projectId
            };

            if (dbMessage) {
                const { id: _, createdAt: __, ...updateFields } = messageData;
                await prisma.message.update({
                    where: { id: dbMessage.id },
                    data: updateFields
                });
            } else {
                await prisma.message.create({ data: messageData });
                result.restored.messages++;
            }
        }
    }

    console.log(`[Restore] Successfully restored from ${filename}:`, result.restored);
    return result;
};

module.exports = {
    createBackup,
    listBackups,
    deleteBackup,
    restoreBackup,
    initScheduler,
    BACKUP_DIR
};

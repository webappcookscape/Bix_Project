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

module.exports = {
    createBackup,
    listBackups,
    deleteBackup,
    initScheduler,
    BACKUP_DIR
};

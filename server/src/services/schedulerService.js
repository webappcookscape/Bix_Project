const cron = require('node-cron');
const { sendNotificationEmail, getEmailTemplate } = require('./emailService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { sendReviewTemplate } = require('./whatsappService');

// Function to check overdue tasks and send notifications
const checkOverdueTasks = async () => {
    console.log('[Scheduler] Checking for overdue tasks...');
    try {
        const now = new Date();

        // Find tasks that are NOT completed and due date is in the past
        const overdueTasks = await prisma.task.findMany({
            where: {
                status: { not: 'COMPLETED' },
                dueDate: { lt: now }, // lt = less than now
                employeeId: { not: null } // Only if assigned
            },
            include: {
                employee: true,
                project: true
            }
        });

        if (overdueTasks.length === 0) {
            console.log('[Scheduler] No overdue tasks found.');
            return { count: 0, message: "No overdue tasks found" };
        }

        console.log(`[Scheduler] Found ${overdueTasks.length} overdue tasks.`);

        // Find a system sender (Admin)
        const sender = await prisma.user.findFirst({
            where: { role: { in: ['SUPER_ADMIN', 'MANAGER', 'ADMIN'] } }
        });

        if (!sender) {
            console.error('[Scheduler] No Admin found to send emails.');
            return { count: 0, error: "No admin found" };
        }

        let emailCount = 0;

        for (const task of overdueTasks) {
            // Check if we already sent a notification recently? 
            // For MVP, we'll just send it. In a real app, maybe check if email was sent today.
            // But let's assume this runs once a day, so it's fine.

            await prisma.email.create({
                data: {
                    senderId: sender.id,
                    receiverId: task.employeeId,
                    subject: `Overdue Task Alert: ${task.title}`,
                    content: `ACTION REQUIRED\n\nThe task "${task.title}" for project "${task.project.name}" was due on ${new Date(task.dueDate).toLocaleDateString()}.\n\nPlease update the status or complete it immediately.\n\nTask ID: ${task.project.projectCode}-${task.id}`,
                    isRead: false
                }
            });

            // [GMAIL INTEGRATION] Send Real Email
            if (task.employee && task.employee.email) {
                await sendNotificationEmail(
                    task.employee.email,
                    `Overdue Task Alert: ${task.title}`,
                    `ACTION REQUIRED\n\nThe task "${task.title}" for project "${task.project.name}" is OVERDUE.\nDue Date: ${new Date(task.dueDate).toLocaleDateString()}.\n\nPlease attend to this immediately.`,
                    getEmailTemplate(
                        `Overdue Alert: ${task.title}`,
                        `<div style="text-align: center; margin-bottom: 24px;">
                            <p style="background-color: #fee2e2; color: #dc2626; padding: 12px; border-radius: 8px; font-weight: bold; display: inline-block;">ACTION REQUIRED: OVERDUE TASK</p>
                         </div>
                         <p style="font-size: 16px;">This is a reminder that the following task is past its due date.</p>
                         <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Project</td>
                                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${task.project.name}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Originally Due</td>
                                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #dc2626; font-weight: bold;">${new Date(task.dueDate).toLocaleDateString()}</td>
                            </tr>
                         </table>
                         <div style="text-align: center; margin-top: 24px;">
                            <a href="${process.env.FRONTEND_URL || 'https://projects.orbixdesigns.com'}/dashboard" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Task Immediately</a>
                         </div>`
                    ),
                    null
                );
            }
            emailCount++;
        }

        console.log(`[Scheduler] Sent ${emailCount} overdue notifications.`);
        return { count: emailCount, message: `Sent ${emailCount} notifications` };

    } catch (error) {
        console.error('[Scheduler] Error checking overdue tasks:', error);
        return { error: error.message };
    }
};



// Function to reset specific "Daily" tasks
const resetDailyTasks = async () => {
    console.log('[Scheduler] Resetting daily tasks...');
    try {
        // Target Titles
        const TARGET_TITLES = ["Quality Check Process", "Installation Work"];

        // 1. Find relevant tasks that are COMPLETED in ONGOING projects
        const tasksToReset = await prisma.task.findMany({
            where: {
                title: { in: TARGET_TITLES },
                status: 'Completed', // Note: Case sensitive check needed? Schema says 'COMPLETED' or 'Completed'?
                // Ideally check 'project.status' but nested filtering in updateMany is limited in some Prisma versions.
                // Doing findMany + updateMany by IDs is safer.
                project: {
                    status: 'ONGOING'
                }
            },
            select: { id: true }
        });

        if (tasksToReset.length === 0) {
            console.log('[Scheduler] No daily tasks to reset.');
            return { count: 0 };
        }

        const ids = tasksToReset.map(t => t.id);

        // 2. Bulk Reset
        const result = await prisma.task.updateMany({
            where: {
                id: { in: ids }
            },
            data: {
                status: 'PENDING',
                completedAt: null // Clear completion time so it shows as pending
            }
        });

        console.log(`[Scheduler] Reset ${result.count} tasks for daily update.`);
        return { count: result.count };

    } catch (error) {
        console.error('[Scheduler] Error resetting daily tasks:', error);
        return { error: error.message };
    }
};

// --- Check for Pending WhatsApp Review Requests ---
const checkPendingReviewRequests = async () => {
    console.log('[Scheduler] Checking for pending WhatsApp review requests...');
    try {
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
        
        // Find eligible walk-ins:
        // 1. Status is COMPLETED (Send immediately)
        // 2. OR outTimeMarkedAt was 2+ hours ago (Auto-follow up)
        const pendingRequests = await prisma.walkinHubEntry.findMany({
            where: {
                whatsappSent: false,
                OR: [
                    { status: 'COMPLETED' },
                    { 
                        outTimeMarkedAt: {
                            not: null,
                            lte: twoHoursAgo
                        }
                    }
                ]
            }
        });

        if (pendingRequests.length === 0) {
            console.log('[Scheduler] No pending WhatsApp review requests found.');
            return { count: 0 };
        }

        console.log(`[Scheduler] Found ${pendingRequests.length} pending review requests.`);

        for (const entry of pendingRequests) {
            const result = await sendReviewTemplate(entry.contactNumber, entry.clientName);
            if (result.success) {
                await prisma.walkinHubEntry.update({
                    where: { id: entry.id },
                    data: { 
                        whatsappSent: true,
                        whatsappStatus: 'SENT',
                        whatsappSentAt: new Date(),
                        whatsappError: null
                    }
                });
            } else {
                // Determine the error message from Meta response if available
                const errorData = result.error?.error || result.error;
                const errorMessage = typeof errorData === 'string' ? errorData : (errorData?.message || 'Unknown WhatsApp Error');
                
                await prisma.walkinHubEntry.update({
                    where: { id: entry.id },
                    data: { 
                        whatsappSent: true, // Mark as attempted so we don't spam 20 times (or leave false to retry?)
                        whatsappStatus: 'FAILED',
                        whatsappError: errorMessage
                    }
                });
                console.error(`[Scheduler] WhatsApp Failed for ${entry.clientName}:`, errorMessage);
            }
        }

        return { count: pendingRequests.length };

    } catch (error) {
        console.error('[Scheduler] Error in WhatsApp check loop:', error);
        return { error: error.message };
    }
};

// Initialize Scheduler
const initScheduler = () => {
    // 0 5 * * * = At 05:00 AM everyday (Overdue Check)
    cron.schedule('0 5 * * *', () => {
        console.log('[Scheduler] Running daily overdue task check...');
        checkOverdueTasks();
    });

    // 0 0 * * * = At 00:00 AM (Midnight) everyday (Daily Task Reset)
    cron.schedule('0 0 * * *', () => {
        console.log('[Scheduler] Running daily task reset...');
        resetDailyTasks();
    });

    // Every 15 minutes (WhatsApp Review Check)
    cron.schedule('*/15 * * * *', () => {
        console.log('[Scheduler] Running WhatsApp review request check...');
        checkPendingReviewRequests();
    });

    console.log('[Scheduler] Jobs Initialized: Overdue Check (5 AM), Daily Reset (Midnight), WhatsApp Follow-up (15m)');
};

module.exports = {
    initScheduler,
    checkOverdueTasks,
    resetDailyTasks,
    checkPendingReviewRequests
};

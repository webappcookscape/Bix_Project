const { PrismaClient } = require('@prisma/client');
const { logActivity } = require('./activityController');
const { sendNotificationEmail, getEmailTemplate } = require('../services/emailService');
const { sendUserPushNotification } = require('../services/notificationService');
const prisma = new PrismaClient();

const emailRuntimeFieldSet = new Set(
    prisma._runtimeDataModel?.models?.Email?.fields?.map((field) => field.name) || []
);

const withOptionalEmailProjectId = (data, projectId) => {
    if (projectId && emailRuntimeFieldSet.has('projectId')) {
        return { ...data, projectId };
    }
    return data;
};

const getTaskAssignmentContent = (task) =>
    `You have been assigned a new task.\n\nType: ${task.type}\nPriority: ${task.priority}\nDue Date: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}\n\nDescription: ${task.description || 'No description provided.'}`;

const sendTaskAssignmentNotification = async ({ task, targetEmployeeId, senderId }) => {
    if (!targetEmployeeId) return;

    const [sender, emp] = await Promise.all([
        senderId
            ? prisma.user.findUnique({ where: { id: senderId } })
            : prisma.user.findFirst({ where: { role: { in: ['SUPER_ADMIN', 'MANAGER', 'ADMIN'] } } }),
        prisma.user.findUnique({ where: { id: targetEmployeeId } })
    ]);

    if (!sender || !emp) return;

    const subject = `New Task Assigned: ${task.title}`;
    const content = getTaskAssignmentContent(task);

    await prisma.email.create({
        data: withOptionalEmailProjectId({
            senderId: sender.id,
            receiverId: targetEmployeeId,
            subject,
            content,
            isRead: false
        }, task.projectId || null)
    });

    if (emp.email) {
        await sendNotificationEmail(
            emp.email,
            subject,
            `You have been assigned a new task.\n\nPriority: ${task.priority}\nDue: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}`,
            getEmailTemplate(
                subject,
                `<p style="font-size: 16px;">You have been assigned a new task by <strong>${sender.name}</strong>.</p>
                 <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0 0 10px;"><strong>Type:</strong> ${task.type}</p>
                    <p style="margin: 0 0 10px;"><strong>Priority:</strong> <span style="color: ${task.priority === 'HIGH' ? 'red' : 'orange'};">${task.priority}</span></p>
                    <p style="margin: 0;"><strong>Due Date:</strong> ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No Due Date'}</p>
                 </div>
                 <p style="font-weight: bold; margin-bottom: 5px;">Description:</p>
                 <p style="background-color: #fff; padding: 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-style: italic;">${task.description || 'No description provided.'}</p>
                 <div style="text-align: center; margin-top: 24px;">
                    <a href="${process.env.FRONTEND_URL || 'https://projects.orbixdesigns.com'}/dashboard" style="background-color: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Task in Dashboard</a>
                 </div>`
            ),
            null
        );
    }

    try {
        await sendUserPushNotification(
            targetEmployeeId,
            `New Task Assigned!`,
            `Task: ${task.title} (${task.priority})`
        );
    } catch (pushErr) {
        console.error("[Notification] Push failed:", pushErr);
    }
};

// Get tasks (with optional filtering)
exports.getTasks = async (req, res) => {
    try {
        console.log("GET /api/tasks hit with query:", req.query);
        const { projectId, employeeId, type } = req.query;

        const filter = {};
        if (projectId) filter.projectId = projectId;
        if (employeeId) filter.employeeId = employeeId;
        if (type) filter.type = type;

        const tasks = await prisma.task.findMany({
            where: filter,
            include: {
                project: true, // Fetch full project details including location
                employee: { select: { name: true } },
                evidence: true, // Fetch evidence for real completion location
                documents: true, // Fetch linked documents
                ticket: {
                    select: {
                        id: true,
                        ticketId: true
                    }
                }
            }
        });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create new task
exports.createTask = async (req, res) => {
    try {
        const { startDate, dueDate, ...otherData } = req.body;

        const taskData = {
            ...otherData,
            startDate: startDate ? new Date(startDate) : undefined,
            dueDate: dueDate ? new Date(dueDate) : undefined
        };

        const task = await prisma.task.create({
            data: taskData
        });

        // 🚀 Production Fix: Await Notification to ensure Render doesn't kill the process
        try {
            const targetEmployeeId = req.body.employeeId;
            if (targetEmployeeId) {
                console.log(`[Notification] Sending awaited notification for Task: ${task.title}`);
                await sendTaskAssignmentNotification({
                    task,
                    targetEmployeeId,
                    senderId: req.user?.id
                });
            }
        } catch (notifErr) {
            console.error("[Notification] Awaited notification failed:", notifErr);
        }

        res.status(201).json(task);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update task
exports.updateTask = async (req, res) => {
    try {
        const {
            completionFileUrl,
            completionFileName,
            id,
            createdAt,
            updatedAt,
            project,
            employee,
            ticket,
            evidence,
            completedAt, // if handled separately
            ...allowedUpdates
        } = req.body;

        // 1. Fetch current task to check its status
        const currentTask = await prisma.task.findUnique({ where: { id: req.params.id } });
        if (!currentTask) {
            return res.status(404).json({ error: "Task not found" });
        }

        const normalizeDateOnly = (value) => {
            if (!value) return "";
            const date = new Date(value);
            if (Number.isNaN(date.getTime())) return "";
            return date.toISOString().split("T")[0];
        };

        const editableFields = [
            "title",
            "projectId",
            "employeeId",
            "startDate",
            "dueDate",
            "priority",
            "type",
            "stage",
            "description",
        ];

        const hasMeaningfulTaskEdit = editableFields.some((field) => {
            if (!(field in allowedUpdates)) return false;

            const incomingValue = field === "startDate" || field === "dueDate"
                ? normalizeDateOnly(allowedUpdates[field])
                : (allowedUpdates[field] ?? "");

            const currentValue = field === "startDate" || field === "dueDate"
                ? normalizeDateOnly(currentTask[field])
                : (currentTask[field] ?? "");

            return incomingValue !== currentValue;
        });

        // Business Rule: editing task details should reopen the task.
        // Explicit status-only updates are still allowed and keep the requested status.
        if (hasMeaningfulTaskEdit) {
            allowedUpdates.status = 'PENDING';
        } else if (allowedUpdates.status) {
            allowedUpdates.status = allowedUpdates.status.toUpperCase();
        }

        // 3. Update the task
        const task = await prisma.task.update({
            where: { id: req.params.id },
            data: {
                ...allowedUpdates,
                completionFileUrl,
                completionFileName,
                // Ensure dates are parsed if string
                startDate: allowedUpdates.startDate ? new Date(allowedUpdates.startDate) : undefined,
                dueDate: allowedUpdates.dueDate ? new Date(allowedUpdates.dueDate) : undefined,
            }
        });

        const assignmentChanged = allowedUpdates.employeeId && allowedUpdates.employeeId !== currentTask.employeeId;

        // ------------------------------------------------------------------
        // NEW: Auto-Start Project Timeline Logic
        // ------------------------------------------------------------------
        // When "Approval of Finalized Designs" is COMPLETED, set Project Start Date
        if (task.title === "Approval of Finalized Designs" && task.status === "COMPLETED") {
            await prisma.project.update({
                where: { id: task.projectId },
                data: { startDate: new Date() }
            });
            console.log(`[Auto-Start] Project ${task.projectId} timeline started via Task ${task.id}`);
        }

        // ------------------------------------------------------------------
        // NEW: Auto-Close Project Logic
        // ------------------------------------------------------------------
        // When "Completion Certificate" is COMPLETED, set Project Status to COMPLETED
        if (task.title === "Completion Certificate" && task.status === "COMPLETED") {
            await prisma.project.update({
                where: { id: task.projectId },
                data: {
                    status: "COMPLETED",
                    handoverDate: new Date()
                }
            });
            console.log(`[Auto-Close] Project ${task.projectId} marked as COMPLETED via Task ${task.id}`);
        }

        // 2. If a file was uploaded as proof, auto-add to Project Documents so Client sees it
        if (completionFileUrl && completionFileName) {
            await prisma.projectDocument.create({
                data: {
                    name: `Proof: ${task.title}`,
                    url: completionFileUrl,
                    projectId: task.projectId
                }
            });
            console.log(`[Auto-Doc] Created ProjectDocument for Task ${task.id}`);
        }

        // Send response immediately
        res.json(task);

        if (assignmentChanged && task.employeeId) {
            (async () => {
                try {
                    await sendTaskAssignmentNotification({
                        task,
                        targetEmployeeId: task.employeeId,
                        senderId: req.user?.id
                    });
                    console.log(`[Notification] Assignment inbox/email sent for Task ${task.id}`);
                } catch (assignmentErr) {
                    console.error("[Notification] Assignment email failed:", assignmentErr);
                }
            })();
        }

        // 3. Background Notifications (Non-blocking)
        if (task.status === "COMPLETED") {
            (async () => {
                try {
                    // Fetch full task details with Project and Employee info
                    const fullTask = await prisma.task.findUnique({
                        where: { id: task.id },
                        include: {
                            project: true,
                            employee: true
                        }
                    });

                    if (fullTask) {
                        const admins = await prisma.user.findMany({
                            where: { role: { in: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] }, status: 'ACTIVE' }
                        });

                        const completorName = fullTask.employee ? fullTask.employee.name : "An employee";
                        const projectName = fullTask.project ? fullTask.project.name : "Unknown Project";

                        for (const admin of admins) {
                            if (fullTask.employeeId && admin.id === fullTask.employeeId) continue;

                            // 1. Create Internal Email
                            await prisma.email.create({
                                data: withOptionalEmailProjectId({
                                    senderId: fullTask.employeeId || admin.id,
                                    receiverId: admin.id,
                                    subject: `Task Completed: ${fullTask.title} (${projectName})`,
                                    content: `Task Completion Report:\n\nTask: ${fullTask.title}\nProject: ${projectName}\nCompleted By: ${completorName}\nTime: ${new Date().toLocaleString()}\n\nThe task has been successfully marked as completed.`,
                                    isRead: false
                                }, fullTask.projectId || null)
                            });

                            // 2. Send Real Email (Gmail Integration)
                            if (admin.email) {
                                await sendNotificationEmail(
                                    admin.email,
                                    `Task Completed: ${fullTask.title}`,
                                    `Project: ${projectName}\nCompleted By: ${completorName}\n\nThe task has been marked as completed.`,
                                    getEmailTemplate(
                                        `Task Completed: ${fullTask.title}`,
                                        `<p style="font-size: 16px; margin-bottom: 24px;">The task has been marked as <strong>COMPLETED</strong>.</p>
                                         <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                                            <tr>
                                                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Project</td>
                                                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${projectName}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Completed By</td>
                                                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${completorName}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Completion Time</td>
                                                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${new Date().toLocaleString()}</td>
                                            </tr>
                                         </table>
                                         <div style="text-align: center;">
                                            <a href="${process.env.FRONTEND_URL || 'https://projects.orbixdesigns.com'}/admin/tasks" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Review Task</a>
                                         </div>`
                                    ),
                                    null // Removed CC to prevent header mismatch
                                );
                            }
                        }
                        console.log(`[Notification] Background completion emails sent for Task ${task.id}`);
                    }
                } catch (emailErr) {
                    console.error("[Notification] Background admin completion email failed:", emailErr);
                }
            })();
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete task
exports.deleteTask = async (req, res) => {
    try {
        const existingTask = await prisma.task.findUnique({
            where: { id: req.params.id },
            include: {
                ticket: {
                    select: {
                        id: true,
                        ticketId: true
                    }
                }
            }
        });

        if (!existingTask) {
            return res.status(404).json({ error: 'Task not found' });
        }

        if (existingTask.ticket) {
            return res.status(400).json({ error: 'Helpdesk-linked issues cannot be deleted' });
        }

        await prisma.task.delete({
            where: { id: req.params.id }
        });
        res.json({ message: 'Task deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Simulate Overdue Check (Dev/Admin Tool)
const { checkOverdueTasks } = require('../services/schedulerService');
exports.simulateOverdue = async (req, res) => {
    try {
        const result = await checkOverdueTasks();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

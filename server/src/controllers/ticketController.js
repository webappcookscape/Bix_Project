const { PrismaClient } = require('@prisma/client');
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

const getLinkedTaskStatus = (ticketStatus) => {
    switch ((ticketStatus || "").toUpperCase()) {
        case "RESOLVED":
            return "COMPLETED";
        case "IN PROGRESS":
            return "IN PROGRESS";
        case "OPEN":
        default:
            return "PENDING";
    }
};

// Helper to generate Ticket ID
const generateTicketId = () => {
    return `TKT-${Math.floor(1000 + Math.random() * 9000)}`;
};

// Create a new ticket
exports.createTicket = async (req, res) => {
    try {
        const { subject, description, category, priority, email, projectId, attachment } = req.body;

        if (!projectId || !description) {
            return res.status(400).json({ error: "Project ID and Description are required" });
        }

        const ticket = await prisma.ticket.create({
            data: {
                ticketId: generateTicketId(),
                subject: subject || "New Support Request",
                description,
                category: category || "Support",
                priority: priority || "Medium",
                clientEmail: email,
                projectId,
                attachmentUrl: attachment?.url,
                attachmentName: attachment?.name,
                attachmentType: attachment?.type
            }
        });

        res.status(201).json(ticket);
    } catch (error) {
        console.error("Create Ticket Error:", error);
        res.status(500).json({
            error: "Failed to create ticket",
            details: error.message
        });
    }
};

// Get tickets (with filters)
exports.getTickets = async (req, res) => {
    try {
        const { projectId, status } = req.query;

        let where = {};
        if (projectId) where.projectId = projectId;
        if (status && status !== 'All') where.status = status;

        const tickets = await prisma.ticket.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                project: {
                    select: { name: true, projectCode: true }
                },
                comments: {
                    orderBy: { createdAt: 'asc' }
                }
            }
        });

        res.json(tickets);
    } catch (error) {
        console.error("Get Tickets Error:", error);
        res.status(500).json({
            error: "Failed to fetch tickets",
            details: error.message,
            stack: error.stack
        });
    }
};

// Update Ticket Status
exports.updateTicketStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const existingTicket = await prisma.ticket.findUnique({
            where: { id },
            select: { id: true, taskId: true }
        });

        if (!existingTicket) {
            return res.status(404).json({ error: "Ticket not found" });
        }

        const updateData = { status };
        const taskUpdateData = { status: getLinkedTaskStatus(status) };

        if (taskUpdateData.status === "COMPLETED") {
            taskUpdateData.completedAt = new Date();
        } else {
            taskUpdateData.completedAt = null;
        }

        const [ticket] = await prisma.$transaction([
            prisma.ticket.update({
                where: { id },
                data: updateData
            }),
            ...(existingTicket.taskId ? [
                prisma.task.update({
                    where: { id: existingTicket.taskId },
                    data: taskUpdateData
                })
            ] : [])
        ]);

        res.json(ticket);
    } catch (error) {
        console.error("Update Ticket Status Error:", error);
        res.status(500).json({ error: "Failed to update status" });
    }
};

// Get Comments for a Ticket
exports.getComments = async (req, res) => {
    try {
        const { id } = req.params;
        const comments = await prisma.ticketComment.findMany({
            where: { ticketId: id },
            orderBy: { createdAt: 'asc' }
        });
        res.json(comments);
    } catch (error) {
        console.error("Get Comments Error:", error);
        res.status(500).json({ error: "Failed to fetch comments" });
    }
};

// Add Comment to Ticket
exports.addComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { content, role, senderId } = req.body; // role: 'ADMIN' or 'CLIENT'

        if (!content) return res.status(400).json({ error: "Content is required" });

        const comment = await prisma.ticketComment.create({
            data: {
                ticketId: id,
                content,
                role,
                senderId
            }
        });

        res.status(201).json(comment);
    } catch (error) {
        console.error("Add Comment Error:", error);
        res.status(500).json({ error: "Failed to add comment" });
    }
};

// Convert Ticket to Issue (Task)
exports.convertToIssue = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Find Ticket
        const ticket = await prisma.ticket.findUnique({
            where: { id },
            include: { project: true }
        });

        if (!ticket) return res.status(404).json({ error: "Ticket not found" });
        if (ticket.taskId) return res.status(400).json({ error: "Ticket already converted to issue" });

        // 2. Create Task (Issue)
        // We set type to "ISSUE".
        const { employeeId, dueDate, priority, senderId } = req.body;

        if (!employeeId) {
            return res.status(400).json({ error: "Employee assignment is required" });
        }

        const assignee = await prisma.user.findFirst({
            where: {
                id: employeeId,
                role: "EMPLOYEE",
                status: "ACTIVE"
            },
            select: {
                id: true,
                name: true,
                email: true
            }
        });

        if (!assignee) {
            return res.status(400).json({ error: "Only active employees can be assigned to converted issues" });
        }

        const newTask = await prisma.task.create({
            data: {
                title: `[Effect of Ticket ${ticket.ticketId}] ${ticket.subject}`,
                description: `Source Ticket: ${ticket.ticketId}\nClient Email: ${ticket.clientEmail}\nOriginal Description:\n${ticket.description}`,
                type: "Issue",
                priority: priority ? priority.toUpperCase() : ticket.priority.toUpperCase(),
                status: "PENDING",
                projectId: ticket.projectId,
                employeeId: employeeId || null,
                dueDate: dueDate ? new Date(dueDate) : undefined,
            }
        });

        // 3. Update Ticket (Link + Status)
        const updatedTicket = await prisma.ticket.update({
            where: { id },
            data: {
                status: "In Progress",
                taskId: newTask.id
            }
        });

        try {
            const sender = senderId ? await prisma.user.findFirst({
                where: {
                    id: senderId,
                    role: { in: ['SUPER_ADMIN', 'MANAGER', 'ADMIN'] }
                },
                select: { id: true, name: true }
            }) : await prisma.user.findFirst({
                where: { role: { in: ['SUPER_ADMIN', 'MANAGER', 'ADMIN'] } },
                select: { id: true, name: true }
            });

            if (sender) {
                await prisma.email.create({
                    data: withOptionalEmailProjectId({
                        senderId: sender.id,
                        receiverId: assignee.id,
                        subject: `New Issue Assigned: ${newTask.title}`,
                        content: `You have been assigned a new issue.\n\nPriority: ${newTask.priority}\nDue Date: ${newTask.dueDate ? new Date(newTask.dueDate).toLocaleDateString() : 'N/A'}\n\nDescription: ${newTask.description || 'No description provided.'}`,
                        isRead: false
                    }, newTask.projectId || null)
                });

                if (assignee.email) {
                    await sendNotificationEmail(
                        assignee.email,
                        `New Issue Assigned: ${newTask.title}`,
                        `You have been assigned a new issue by ${sender.name}.\n\nPriority: ${newTask.priority}\nDue: ${newTask.dueDate ? new Date(newTask.dueDate).toLocaleDateString() : 'N/A'}`,
                        getEmailTemplate(
                            `New Issue Assigned: ${newTask.title}`,
                            `<p style="font-size: 16px;">You have been assigned a new issue by <strong>${sender.name}</strong>.</p>
                             <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0;">
                                <p style="margin: 0 0 10px;"><strong>Source Ticket:</strong> ${ticket.ticketId}</p>
                                <p style="margin: 0 0 10px;"><strong>Priority:</strong> ${newTask.priority}</p>
                                <p style="margin: 0;"><strong>Due Date:</strong> ${newTask.dueDate ? new Date(newTask.dueDate).toLocaleDateString() : 'No Due Date'}</p>
                             </div>
                             <p style="font-weight: bold; margin-bottom: 5px;">Issue Description:</p>
                             <p style="background-color: #fff; padding: 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-style: italic; white-space: pre-wrap;">${newTask.description || 'No description provided.'}</p>`
                        ),
                        null
                    );
                }

                try {
                    await sendUserPushNotification(
                        assignee.id,
                        `New Issue Assigned`,
                        `${newTask.title}`
                    );
                } catch (pushErr) {
                    console.error("[Ticket Convert] Push failed:", pushErr);
                }
            }
        } catch (notificationError) {
            console.error("[Ticket Convert] Assignment notification failed:", notificationError);
        }

        res.json({ ticket: updatedTicket, task: newTask });

    } catch (error) {
        console.error("Convert Error:", error);
        res.status(500).json({ error: "Failed to convert ticket to issue", details: error.message });
    }
};

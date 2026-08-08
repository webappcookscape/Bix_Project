const { PrismaClient } = require('@prisma/client');
const path = require('path');
const prisma = new PrismaClient();
const { sendNotificationEmail, getEmailTemplate } = require('../services/emailService');

const emailRuntimeFieldSet = new Set(
    prisma._runtimeDataModel?.models?.Email?.fields?.map((field) => field.name) || []
);

const withOptionalEmailProjectId = (data, projectId) => {
    if (projectId && emailRuntimeFieldSet.has('projectId')) {
        return { ...data, projectId };
    }
    return data;
};

// Send an email (or draft)
exports.sendEmail = async (req, res) => {
    try {
        const { draftId, subject, content, senderId, receiverId, projectId, isDraft, attachments } = req.body;

        if (!senderId) {
            return res.status(400).json({ error: "Sender ID is required." });
        }

        // Validation for sending
        if (!isDraft && !receiverId) {
            return res.status(400).json({ error: "Receiver is required for sending." });
        }

        let email;
        const emailData = withOptionalEmailProjectId({
            subject,
            content,
            senderId,
            receiverId: receiverId || null,
            isDraft: isDraft || false,
            isRead: false,
            attachments: attachments ? JSON.stringify(attachments) : null
        }, projectId || null);

        if (draftId) {
            email = await prisma.email.update({
                where: { id: draftId },
                data: {
                    ...emailData,
                    isDeleted: false
                },
                include: {
                    sender: { select: { name: true, email: true } },
                    receiver: { select: { name: true, email: true } }
                }
            });
        } else {
            email = await prisma.email.create({
                data: {
                    ...emailData,
                    receiverId: receiverId || undefined
                },
                include: {
                    sender: { select: { name: true, email: true } },
                    receiver: { select: { name: true, email: true } }
                }
            });
        }

        // Return success response immediately once internal record is created
        // Background Gmail Relay (SYNCHRONIZED for Production Reliability)
        const relayReceiverEmail = email.receiver?.email;
        const relayEmailId = email.id;
        const relaySubject = email.subject || "No Subject";
        const relaySenderName = email.sender?.name || "Someone";
        const relayContent = email.content || "";
        const relayAttachments = attachments;

        if (!isDraft && relayReceiverEmail) {
            try {
                console.log(`[EmailRelay] Starting awaited relay for message: ${relayEmailId} to ${relayReceiverEmail}`);

                // Format attachments for Nodemailer
                let mailAttachments = [];
                if (relayAttachments && Array.isArray(relayAttachments)) {
                    mailAttachments = relayAttachments.map(att => {
                        const filename = att.url.split('/').pop();
                        return {
                            filename: att.name,
                            path: path.join(__dirname, '../../uploads', filename)
                        };
                    });
                }

                await sendNotificationEmail(
                    relayReceiverEmail,
                    `[Internal Message] ${relaySubject}`,
                    `You received a new message from ${relaySenderName}:\n\n${relayContent}\n\n(Sent via Orbix Dashboard)`,
                    getEmailTemplate(
                        `New Message from ${relaySenderName}`,
                        `<p style="font-size: 16px; margin-bottom: 20px;">You received a new message via the Orbix Dashboard:</p>
                         <div style="background-color: #f8fafc; border-left: 4px solid #ea580c; padding: 16px; margin-bottom: 24px;">
                            <p style="margin: 0; font-style: italic; white-space: pre-wrap;">${relayContent}</p>
                         </div>
                         <p style="font-size: 14px; color: #64748b;">Log in to the dashboard to reply.</p>`
                    ),
                    null,
                    mailAttachments
                );
                console.log(`[EmailRelay] Successfully relayed message ${relayEmailId} to Gmail`);
            } catch (emailErr) {
                console.error("[EmailRelay] Failed background Gmail relay:", emailErr);
            }
        }

        res.status(201).json(email);
    } catch (error) {
        console.error("Send email error:", error);
        res.status(500).json({ error: error.message });
    }
};

// Get emails (Inbox, Sent, Drafts)
exports.getEmails = async (req, res) => {
    try {
        const { userId, folder } = req.query; // Expect userId in query for now to match loose auth pattern

        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }

        let whereConfig = { isDeleted: false };

        if (folder === 'inbox') {
            whereConfig.receiverId = userId;
            whereConfig.isDraft = false;
        } else if (folder === 'sent') {
            whereConfig.senderId = userId;
            whereConfig.isDraft = false;
        } else if (folder === 'draft') {
            whereConfig.senderId = userId;
            whereConfig.isDraft = true;
        } else if (folder === 'trash') {
            whereConfig = {
                OR: [
                    { receiverId: userId },
                    { senderId: userId }
                ],
                isDeleted: true
            };
        } else {
            return res.status(400).json({ error: "Invalid folder type" });
        }

        const emails = await prisma.email.findMany({
            where: whereConfig,
            orderBy: { createdAt: 'desc' },
            include: {
                sender: { select: { name: true, email: true } },
                receiver: { select: { name: true, email: true } }
            }
        });

        res.json(emails);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Search users for autocomplete
exports.searchUsers = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) return res.json([]);

        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { email: { contains: query, mode: 'insensitive' } }
                ],
                status: 'ACTIVE'
            },
            select: { id: true, name: true, email: true, role: true },
            take: 10
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
// Get unread email count
exports.getUnreadCount = async (req, res) => {
    try {
        const { userId } = req.query;
        console.log(`[DEBUG_EMAIL] getUnreadCount called for userId: ${userId}`);
        if (!userId) {
            console.error('[DEBUG_EMAIL] Missing userId');
            return res.status(400).json({ error: "User ID is required" });
        }

        const count = await prisma.email.count({
            where: {
                receiverId: userId,
                isRead: false,
                isDeleted: false,
                isDraft: false
            }
        });

        res.json({ count });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Mark all emails as read for a user
exports.markAllRead = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: "User ID is required" });

        await prisma.email.updateMany({
            where: {
                receiverId: userId,
                isRead: false
            },
            data: {
                isRead: true
            }
        });

        res.json({ message: "All marked as read" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
// Delete Email (Soft or Hard)
exports.deleteEmail = async (req, res) => {
    try {
        const { id } = req.params;
        const { type } = req.query; // 'soft' or 'hard'

        if (type === 'hard') {
            await prisma.email.delete({
                where: { id }
            });
            return res.json({ message: "Email permanently deleted" });
        }

        // Soft delete
        await prisma.email.update({
            where: { id },
            data: { isDeleted: true }
        });
        res.json({ message: "Moved to trash" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Restore Email from Trash
exports.restoreEmail = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.email.update({
            where: { id },
            data: { isDeleted: false }
        });
        res.json({ message: "Email restored" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

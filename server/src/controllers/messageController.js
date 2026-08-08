const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get messages for a project
exports.getMessages = async (req, res) => {
    try {
        const { projectId } = req.params;
        const messages = await prisma.message.findMany({
            where: { projectId },
            orderBy: { createdAt: 'asc' }
        });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Send a message
exports.sendMessage = async (req, res) => {
    try {
        const { content, projectId, sender, senderRole, attachments } = req.body;

        const message = await prisma.message.create({
            data: {
                content,
                projectId,
                sender,
                senderRole,
                attachments: attachments ? JSON.stringify(attachments) : null
            }
        });

        res.status(201).json(message);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

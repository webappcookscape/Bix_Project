const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.uploadEvidence = async (req, res) => {
    try {
        const { taskId, latitude, longitude, capturedAt } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        if (!taskId || !latitude || !longitude || !capturedAt) {
            return res.status(400).json({ error: 'Missing metadata' });
        }

        // Create TaskEvidence record
        // Assuming file upload middleware puts the file url in req.file.path or similar
        // If we are using multer with diskStorage, it might be req.file.path.
        // If we need to upload to a cloud service, that logic should be here or in the middleware.
        // Based on existing uploadController, let's see how it handles it. 
        // For now, I'll assume we store the 'path' or 'filename' as URL.
        // Using 'uploads/' prefix as per existing structure likely.

        const evidence = await prisma.taskEvidence.create({
            data: {
                url: `/uploads/${file.filename}`,
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                capturedAt: new Date(capturedAt),
                taskId: taskId
            }
        });

        // Update Task Status
        // If it's a "Daily Update" (IN_PROGRESS), we update 'updatedAt' but NOT 'status' or 'completedAt'.
        // If it's a Final Completion, we set 'status' to 'COMPLETED'.

        const isDailyUpdate = req.body.isDailyUpdate === 'true'; // FormData sends strings

        const updateData = {
            updatedAt: new Date() // Always mark as updated
        };

        if (!isDailyUpdate) {
            updateData.status = 'COMPLETED';
            updateData.completedAt = new Date();
        }

        await prisma.task.update({
            where: { id: taskId },
            data: updateData
        });

        res.status(201).json(evidence);
    } catch (error) {
        console.error("Evidence upload error:", error);
        res.status(500).json({ error: error.message });
    }
};

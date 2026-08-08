const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Helper to log activity (internal use)
const logActivity = async (projectId, message, category = "GENERAL", taskId = null) => {
    try {
        await prisma.activityLog.create({
            data: {
                projectId,
                message,
                category,
                taskId
            }
        });
        console.log(`[Activity] Logged for project ${projectId}: ${message}`);
    } catch (error) {
        console.error("[Activity] Error creating log:", error);
    }
};

// Get activities for a project
const getProjectActivities = async (req, res) => {
    try {
        const { projectId } = req.params;

        if (!projectId) {
            return res.status(400).json({ error: "Project ID is required" });
        }

        const activities = await prisma.activityLog.findMany({
            where: { projectId },
            orderBy: { createdAt: "desc" },
            take: 50 // Limit to last 50 activities
        });

        res.json(activities);
    } catch (error) {
        console.error("Error fetching activities:", error);
        res.status(500).json({ error: "Failed to fetch activities" });
    }
};

module.exports = {
    logActivity,
    getProjectActivities
};

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key';

exports.login = async (req, res) => {
    const { projectId, password } = req.body;

    try {
        // 1. Find Project by Code
        // Schema verification: Project has embedded client details (clientFirstName, etc.) and 'name' field.
        const project = await prisma.project.findUnique({
            where: { projectCode: projectId }
        });

        if (!project) {
            return res.status(401).json({ message: 'Invalid Project ID' });
        }

        // 2. Verify Client Password
        const isValid = await bcrypt.compare(password, project.clientPassword);

        if (!isValid) {
            return res.status(401).json({ message: 'Invalid Credentials' });
        }

        // 3. Generate Token
        // Use 'name' from schema (not projectName)
        const token = jwt.sign(
            { id: project.id, role: 'CLIENT', projectCode: project.projectCode, name: project.name },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // 4. Respond
        res.json({
            token,
            project: {
                id: project.id,
                projectCode: project.projectCode,
                projectName: project.name, // Map 'name' to 'projectName' for frontend consistency
                firstName: project.clientFirstName,
                lastName: project.clientLastName,
                clientName: `${project.clientFirstName} ${project.clientLastName}`,
                role: 'CLIENT'
            }
        });

    } catch (error) {
        console.error('Client Login Error:', error);
        res.status(500).json({ message: 'Server error during client login' });
    }
};

// Get Current Project Details
exports.getProjectDetails = async (req, res) => {
    try {
        const { projectId } = req.params;
        const project = await prisma.project.findUnique({
            where: { projectCode: projectId }
        });

        if (!project) return res.status(404).json({ message: "Project not found" });

        res.json(project);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching project details' });
    }
};

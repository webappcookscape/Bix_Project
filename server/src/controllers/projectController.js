const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { sendFreezingMail } = require('../services/emailService');
const { sendPlainTextMessage } = require('../services/whatsappService');
const path = require('path');

const projectRuntimeFieldSet = new Set(
    prisma._runtimeDataModel?.models?.Project?.fields?.map((field) => field.name) || []
);
const emailRuntimeFieldSet = new Set(
    prisma._runtimeDataModel?.models?.Email?.fields?.map((field) => field.name) || []
);

const parseSpreadsheetDate = (value) => {
    if (value === undefined || value === null || value === "") return null;

    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
        const excelEpoch = new Date(Date.UTC(1899, 11, 30));
        const parsed = new Date(excelEpoch.getTime() + (value * 24 * 60 * 60 * 1000));
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    if (typeof value !== 'string') {
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    const trimmed = value.trim();
    if (!trimmed) return null;

    const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (isoMatch) {
        const [, year, month, day] = isoMatch;
        const parsed = new Date(Number(year), Number(month) - 1, Number(day));
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    const dayFirstMatch = trimmed.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
    if (dayFirstMatch) {
        const [, day, month, year] = dayFirstMatch;
        const parsed = new Date(Number(year), Number(month) - 1, Number(day));
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    const excelSerialMatch = trimmed.match(/^\d+(\.\d+)?$/);
    if (excelSerialMatch) {
        return parseSpreadsheetDate(Number(trimmed));
    }

    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const pickSupportedProjectFields = (data, allowedFields) => {
    return Object.keys(data)
        .filter((key) => allowedFields.includes(key) && projectRuntimeFieldSet.has(key))
        .reduce((obj, key) => {
            obj[key] = data[key];
            return obj;
        }, {});
};

// Get all projects
// Get all projects (Optional: Filter by employee)

exports.getProjects = async (req, res) => {
    try {
        const { employeeId } = req.query;

        const filter = {};
        if (employeeId) {
            filter.OR = [
                {
                    assignedEmployees: {
                        some: {
                            id: employeeId
                        }
                    }
                },
                {
                    tasks: {
                        some: {
                            employeeId: employeeId
                        }
                    }
                }
            ];
        }

        const projects = await prisma.project.findMany({
            where: filter,
            include: {
                tasks: true,
                assignedEmployees: true,
                businessHead: { select: { id: true, name: true, email: true } },
                fa: { select: { id: true, name: true, email: true } },
                la: { select: { id: true, name: true, email: true } }
            } // Include tasks for stats and related users
        });
        res.json(projects);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // Correct import
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key';

// Create new project
exports.createProject = async (req, res) => {
    try {
        const rawData = req.body;

        // Sanitize Data (Backend Hardening)
        const data = { ...rawData };

        if (data.budget) data.budget = parseFloat(data.budget);
        if (data.timelineDuration) data.timelineDuration = parseInt(data.timelineDuration, 10);
        if (data.latitude) data.latitude = parseFloat(data.latitude);
        if (data.longitude) data.longitude = parseFloat(data.longitude);

        // --- NEW: Freezing Mail Specific Sanitization ---
        if (data.freezingAmount) data.freezingAmount = parseFloat(data.freezingAmount);
        if (data.woodworkAmount) data.woodworkAmount = parseFloat(data.woodworkAmount);
        if (data.addOnsAmount) data.addOnsAmount = parseFloat(data.addOnsAmount);

        // Handle Recipients (might be sent as JSON string or comma list)
        let recipients = data.recipients;
        console.log(`[DEBUG] Raw recipients from body: ${JSON.stringify(recipients)}`); // DIAGNOSTIC LOG

        if (typeof recipients === 'string') {
            try { recipients = JSON.parse(recipients); }
            catch (e) { recipients = recipients.split(',').map(r => r.trim()); }
        }
        
        console.log(`[DEBUG] Parsed recipients: ${JSON.stringify(recipients)}`); // DIAGNOSTIC LOG
        
        delete data.recipients; // Clean from Prisma data
        delete data.attachments; // Clean from Prisma data (handled by req.files)

        // Handle Dates
        if (data.startDate) data.startDate = new Date(data.startDate);
        if (data.deadline) data.deadline = new Date(data.deadline);

        // Clean up empty/whitespace strings for optional fields to avoid Unique Constraint errors
        ['cpNumber', 'gstin', 'googleMapsLink', 'spouseName', 'spousePhone', 'location', 'businessHeadId', 'propertyType', 'scopeOfWork', 'leadSource', 'salesRep', 'faId', 'laId', 'unitNumber', 'block', 'floor', 'area', 'createdBy', 'variant', 'quoteLink', 'freezingMailNote'].forEach(field => {
            if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === "") || data[field] === "null" || data[field] === "undefined") {
                data[field] = null; // Explicitly set to null to avoid Prisma unique constraint errors for empty strings
            } else if (typeof data[field] === 'string') {
                data[field] = data[field].trim();
            }
        });

        // Auto-generate Project Code (Robust Collision Handling)
        let nextCode = 'PRJ-001';
        let isUnique = false;

        // 1. Try to guess based on latest project code
        const lastProject = await prisma.project.findFirst({
            orderBy: { projectCode: 'desc' }, // Use projectCode instead of createdAt
            select: { projectCode: true }
        });

        if (lastProject && lastProject.projectCode) {
            const matches = lastProject.projectCode.match(/PRJ-(\d+)/);
            if (matches && matches[1]) {
                const nextNum = parseInt(matches[1], 10) + 1;
                nextCode = `PRJ-${String(nextNum).padStart(3, '0')}`;
            }
        }

        // 2. Verify uniqueness loop (Fail-safe)
        while (!isUnique) {
            const existing = await prisma.project.findUnique({
                where: { projectCode: nextCode }
            });

            if (!existing) {
                isUnique = true;
            } else {
                // If collision, increment
                const matches = nextCode.match(/PRJ-(\d+)/);
                if (matches && matches[1]) {
                    const nextNum = parseInt(matches[1], 10) + 1;
                    nextCode = `PRJ-${String(nextNum).padStart(3, '0')}`;
                } else {
                    // Fallback if parsing fails weirdly
                    nextCode = `PRJ-${Date.now().toString().slice(-4)}`; // Emergency fallback
                    isUnique = true;
                }
            }
        }

        data.projectCode = nextCode;

        if (data.clientPassword) {
            data.clientPassword = await bcrypt.hash(data.clientPassword, 10);
        }

        // --- FINAL SANITIZATION: Strict field whitelist for Prisma ---
        const validProjectFields = [
            'name', 'clientFirstName', 'clientLastName', 'clientEmail', 'clientPhone', 
            'clientPassword', 'projectCode', 'location', 'googleMapsLink', 'budget', 'startDate', 'deadline', 
            'timelineDuration', 'leadSource', 'status', 'priority', 'faId', 'businessHeadId', 
            'laId', 'spouseName', 'spousePhone', 'billingName', 'billingAddress', 
            'billingPhone', 'handingOverMonth', 'handingOverYear', 'propertyType', 
            'scopeOfWork', 'area', 'block', 'floor', 'unitNumber', 'createdBy', 
            'freezingAmount', 'variant', 'woodworkAmount', 'addOnsAmount', 
            'quoteLink', 'freezingMailNote', 'cpNumber', 'gstin'
        ];

        const prismaData = pickSupportedProjectFields(data, validProjectFields);

        const project = await prisma.project.create({
            data: prismaData,
            include: {
                tasks: true,
                assignedEmployees: true,
                businessHead: { select: { id: true, name: true, email: true } },
                fa: { select: { id: true, name: true, email: true } },
                la: { select: { id: true, name: true, email: true } }
            } // Include for consistency
        });

        // Seed Predefined Tasks
        // await seedProjectTasks(project.id);

        // --- NEW: Handle Freezing Mail Trigger ---
        const sendEmail = req.body.sendEmail === 'true' || req.body.sendEmail === true;
        const sendWhatsApp = req.body.sendWhatsApp === 'true' || req.body.sendWhatsApp === true;

        console.log(`[DEBUG] Final check - recipients:`, recipients, "sendEmail:", sendEmail, "sendWhatsApp:", sendWhatsApp);
        
        if (sendEmail && recipients && Array.isArray(recipients) && recipients.length > 0) {
            try {
                // Attachments handling (from multer req.files)
                const files = req.files || [];
                console.log(`[ProjectController] Files count: ${files.length}, Recipients: ${recipients.join(', ')}`);
                
                const emailAttachments = files.map(file => ({
                    filename: file.originalname,
                    path: path.join(__dirname, '../../uploads', file.filename)
                }));
                
                console.log(`[DEBUG] Triggering mail with ${emailAttachments.length} attachments...`);
                
                await sendFreezingMail({
                    project: project,
                    recipients: recipients,
                    attachments: emailAttachments
                });
                console.log(`[ProjectManager] Freezing Mail sent to ${recipients.join(', ')}`);
            } catch (err) {
                console.error("[ProjectManager] Failed to send freezing mail:", err);
                // We don't fail the project creation, just log the error
            }
        }

        // --- WhatsApp Notification to FA ---
        // Uses the custom message provided from the frontend (Editable in Drawer)
        if (sendWhatsApp && project.faId && req.body.whatsappMessage) {
            try {
                const fa = await prisma.user.findUnique({
                    where: { id: project.faId },
                    select: { phone: true, name: true }
                });

                if (fa && fa.phone) {
                    console.log(`[ProjectController] Sending CUSTOM WhatsApp to FA ${fa.name} (${fa.phone})...`);
                    await sendPlainTextMessage(fa.phone, req.body.whatsappMessage);
                }
            } catch (waErr) {
                console.error("[ProjectController] Failed to send WhatsApp to FA:", waErr);
            }
        }

        res.status(201).json(project);
    } catch (error) {
        if (error.code === 'P2002') {
            const target = error.meta?.target || [];
            return res.status(400).json({ error: `Unique constraint failed: A project with this ${target.join(', ')} already exists.` });
        }
        res.status(400).json({ error: error.message });
    }
};

// Get single project
exports.getProjectById = async (req, res) => {
    try {
        const project = await prisma.project.findUnique({
            where: { id: req.params.id },
            include: {
                tasks: true,
                assignedEmployees: true,
                businessHead: { select: { id: true, name: true, email: true } },
                fa: { select: { id: true, name: true, email: true } },
                la: { select: { id: true, name: true, email: true } }
            }
        });
        if (!project) return res.status(404).json({ message: 'Project not found' });
        res.json(project);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update project
exports.updateProject = async (req, res) => {
    try {
        const rawData = req.body;
        let recipients = rawData.recipients;

        if (typeof recipients === 'string') {
            try { recipients = JSON.parse(recipients); }
            catch (e) { recipients = recipients.split(',').map(r => r.trim()).filter(Boolean); }
        }

        // Remove known relation/system fields that cause Prisma update errors
        const {
            tasks,
            assignedEmployees,
            businessHead,
            fa,
            la,
            activityLogs,
            magicLinks,
            messages,
            paymentTransactions,
            documents,
            images,
            tickets,
            id,
            createdAt,
            updatedAt,
            recipients: _recipients,
            attachments: _attachments,
            sendEmail: _sendEmail,
            sendWhatsApp: _sendWhatsApp,
            ...cleanData
        } = rawData;

        const data = { ...cleanData };

        // Sanitize types
        if (data.budget !== undefined && data.budget !== null) data.budget = parseFloat(data.budget);
        if (data.timelineDuration !== undefined && data.timelineDuration !== null) data.timelineDuration = parseInt(data.timelineDuration, 10);
        if (data.latitude !== undefined && data.latitude !== null) data.latitude = parseFloat(data.latitude);
        if (data.longitude !== undefined && data.longitude !== null) data.longitude = parseFloat(data.longitude);
        if (data.paymentPercentage !== undefined && data.paymentPercentage !== null) data.paymentPercentage = parseInt(data.paymentPercentage, 10);
        if (data.executionPercentage !== undefined && data.executionPercentage !== null) data.executionPercentage = parseInt(data.executionPercentage, 10);
        if (data.addOnsAmount !== undefined && data.addOnsAmount !== null) data.addOnsAmount = parseFloat(data.addOnsAmount);
        if (data.freezingAmount !== undefined && data.freezingAmount !== null) data.freezingAmount = parseFloat(data.freezingAmount);
        if (data.woodworkAmount !== undefined && data.woodworkAmount !== null) data.woodworkAmount = parseFloat(data.woodworkAmount);
        
        if (data.startDate) data.startDate = new Date(data.startDate);
        if (data.deadline) data.deadline = new Date(data.deadline);
        if (data.handoverDate) data.handoverDate = new Date(data.handoverDate);

        // Sanitization: Unify Status Casing
        if (data.status) {
            data.status = data.status.toUpperCase();
        }

        // Clean empty optional fields
        ['cpNumber', 'gstin', 'googleMapsLink', 'spouseName', 'spousePhone', 'location', 'businessHeadId', 'propertyType', 'scopeOfWork', 'leadSource', 'salesRep', 'faId', 'laId', 'unitNumber', 'block', 'floor', 'area', 'clientPassword'].forEach(field => {
            if (data[field] === "" || (typeof data[field] === 'string' && data[field].trim() === "") || data[field] === "null" || data[field] === "undefined") {
                if (field === 'clientPassword') {
                    delete data[field]; // Don't update password if empty
                } else {
                    data[field] = null;
                }
            } else if (typeof data[field] === 'string') {
                data[field] = data[field].trim();
            }
        });

        // Strict Whitelist of scalar fields allowed in the update
        const allowedFields = [
            'projectCode', 'clientPassword', 'name', 'clientFirstName', 'clientLastName', 
            'clientEmail', 'clientPhone', 'spouseName', 'spousePhone', 'location', 'googleMapsLink',
            'budget', 'paymentPercentage', 'cpNumber', 'billingName', 'billingAddress', 
            'billingPhone', 'gstin', 'latitude', 'longitude', 'startDate', 'deadline', 
            'handoverDate', 'handingOverMonth', 'handingOverYear', 'timelineDuration', 
            'status', 'businessHeadId', 'faId', 'laId', 'leadSource', 'propertyType', 
            'salesRep', 'scopeOfWork', 'area', 'block', 'executionPercentage', 'floor', 
            'unitNumber', 'createdBy', 'addOnsAmount', 'freezingAmount', 'freezingMailNote', 
            'quoteLink', 'variant', 'woodworkAmount'
        ];

        const safeData = pickSupportedProjectFields(data, allowedFields);

        const projectData = safeData;

        // Prevent updating projectCode to the same value (Prisma bug/quirk avoidance)
        // or attempting to hijack another project code
        if (projectData.projectCode) {
            const existing = await prisma.project.findUnique({ where: { id: req.params.id } });
            if (existing && existing.projectCode === projectData.projectCode) {
                delete projectData.projectCode; // Don't update if same
            } else {
                // If changing, ensure new code is unique
                const duplicate = await prisma.project.findUnique({ where: { projectCode: projectData.projectCode } });
                if (duplicate) {
                    return res.status(400).json({ error: `Project Code ${projectData.projectCode} is already taken.` });
                }
            }
        }

        if (projectData.clientPassword) {
            projectData.clientPassword = await bcrypt.hash(projectData.clientPassword, 10);
        }
        const project = await prisma.project.update({
            where: { id: req.params.id },
            data: projectData,
            include: {
                tasks: true,
                assignedEmployees: true,
                businessHead: { select: { id: true, name: true, email: true } },
                fa: { select: { id: true, name: true, email: true } },
                la: { select: { id: true, name: true, email: true } }
            } // Include for consistency
        });

        const sendEmail = req.body.sendEmail === 'true' || req.body.sendEmail === true;
        const sendWhatsApp = req.body.sendWhatsApp === 'true' || req.body.sendWhatsApp === true;

        if (sendEmail && recipients && Array.isArray(recipients) && recipients.length > 0) {
            try {
                const files = req.files || [];
                const emailAttachments = files.map(file => ({
                    filename: file.originalname,
                    path: file.path,
                    cid: path.basename(file.filename)
                }));

                await sendFreezingMail({
                    project,
                    recipients,
                    attachments: emailAttachments
                });
            } catch (emailError) {
                console.error('[ProjectManager] Failed to send freezing mail on update:', emailError);
            }
        }

        if (sendWhatsApp && project.faId && req.body.whatsappMessage) {
            try {
                await sendPlainTextMessage({
                    employeeId: project.faId,
                    text: req.body.whatsappMessage
                });
            } catch (whatsappError) {
                console.error('[ProjectManager] Failed to send WhatsApp notification on update:', whatsappError);
            }
        }

        res.json(project);
    } catch (error) {
        console.error("PRISMA UPDATE ERROR", error);
        console.error("FAILED DATA PAYLOAD:", JSON.stringify(req.body, null, 2));
        if (error.code === 'P2002') {
            const target = error.meta?.target || [];
            return res.status(400).json({ error: `Unique constraint failed: A project with this ${target.join(', ')} already exists.` });
        }
        // Send the stringified data in the error message so we can see it in the frontend alert
        res.status(400).json({ error: error.message + "\n\nPayload: " + JSON.stringify(req.body) });
    }
};



// Update Project Payment & Log Transaction
exports.updateProjectPayment = async (req, res) => {
    console.log("updateProjectPayment called with body:", req.body);
    try {
        const { percentage, amount, date, time, mode, verifiedBy } = req.body;
        const projectId = req.params.id;

        // Validation
        if (!projectId) {
            return res.status(400).json({ error: "Project ID is required" });
        }
        if (percentage === undefined || percentage === null || !date || !mode || !verifiedBy) {
            console.error("Missing required fields:", { percentage, date, mode, verifiedBy });
            return res.status(400).json({ error: "Missing required payment details (Percentage, Date, Mode, Verified By)" });
        }

        const parsedPercentage = parseInt(percentage);
        if (isNaN(parsedPercentage)) {
            return res.status(400).json({ error: "Invalid percentage value" });
        }

        const parsedAmount = amount ? parseFloat(amount) : null;
        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
            return res.status(400).json({ error: "Invalid date format" });
        }

        console.log(`Processing payment for Project ${projectId}: ${parsedPercentage}%`);

        // Transaction: Update Project + Create Log
        const result = await prisma.$transaction([
            prisma.project.update({
                where: { id: projectId },
                data: { paymentPercentage: parsedPercentage }
            }),
            prisma.paymentTransaction.create({
                data: {
                    projectId,
                    percentage: parsedPercentage,
                    amount: parsedAmount,
                    date: parsedDate,
                    time,
                    mode,
                    verifiedBy
                }
            })
        ]);

        console.log("Payment updated successfully:", result);
        res.json({ message: "Payment recorded and project phase updated", project: result[0] });

    } catch (error) {
        console.error("Payment Update Error (Detailed):", error);
        // Check for specific Prisma errors
        if (error.code === 'P2025') {
            return res.status(404).json({ error: "Project not found" });
        }
        res.status(500).json({ error: error.message, stack: error.stack });
    }
};



// Get Project Payment History
exports.getProjectPayments = async (req, res) => {
    try {
        const projectId = req.params.id;
        if (!projectId) {
            return res.status(400).json({ error: "Project ID is required" });
        }

        const payments = await prisma.paymentTransaction.findMany({
            where: { projectId: projectId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(payments);
    } catch (error) {
        console.error("Get Payment History Error:", error);
        res.status(500).json({ error: error.message, stack: error.stack });
    }
};

// Start of DELETE
exports.deleteProject = async (req, res) => {
    try {
        const projectId = req.params.id;

        // 1. Manually clean up relations that don't have onDelete: Cascade in schema
        // Specifically: TaskEvidence linked to Tasks linked to this Project

        // Find all tasks for this project
        const projectTasks = await prisma.task.findMany({
            where: { projectId: projectId },
            select: { id: true }
        });

        const taskIds = projectTasks.map(t => t.id);

        if (taskIds.length > 0) {
            // Delete all evidence for these tasks
            await prisma.taskEvidence.deleteMany({
                where: { taskId: { in: taskIds } }
            });
        }

        // Delete project-linked emails explicitly as a safety net.
        // The new Email.project relation also cascades on project deletion.
        if (emailRuntimeFieldSet.has('projectId')) {
            await prisma.email.deleteMany({
                where: { projectId }
            });
        }

        // 2. Now delete the project (Cascade should handle the rest: Tasks, Tickets, etc.)
        await prisma.project.delete({
            where: { id: projectId }
        });

        res.json({ message: 'Project deleted' });
    } catch (error) {
        console.error("Delete Project Error:", error);
        res.status(500).json({ error: error.message });
    }
};

// Generate Secure Access Link (Magic Code)
exports.generateAccessLink = async (req, res) => {
    try {
        const project = await prisma.project.findUnique({
            where: { id: req.params.id }
        });

        if (!project) return res.status(404).json({ message: 'Project not found' });

        // Generate Random 8-char Code
        const code = Math.random().toString(36).substring(2, 10).toUpperCase();

        // Expire in 7 days
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await prisma.magicLink.create({
            data: {
                code,
                projectId: project.id,
                expiresAt
            }
        });

        // Return ONLY the code (Frontend constructs the URL)
        // URL format: domain.com/client/login?code=CODE
        res.json({ code });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Verify Magic Link
exports.verifyMagicLink = async (req, res) => {
    try {
        const { code } = req.params;

        const magicLink = await prisma.magicLink.findUnique({
            where: { code },
            include: { project: true }
        });

        if (!magicLink) {
            return res.status(404).json({ message: 'Invalid or expired link' });
        }

        if (new Date() > magicLink.expiresAt) {
            return res.status(410).json({ message: 'Link has expired' });
        }

        // Return Project Data (Same as login response)
        const token = jwt.sign(
            { id: magicLink.projectId, role: 'CLIENT', projectCode: magicLink.project.projectCode, name: magicLink.project.name },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            project: magicLink.project
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Helper to seed tasks
async function seedProjectTasks(projectId) {
    const STAGES = {
        "Freezing Mail": [
            "Client Details", "Floor Plan", "Initial Estimate Options",
            "Finalized Variants & Initial Quote", "Initial Schematic Proposal",
            "Blurred DWG", "Payment Gateway", "Booking Docs"
        ],
        "Approval of finalized designs": [
            "PDI Reports", "FM taken by AE", "2D Drawing",
            "3D Rendered Images", "Production Payment", "Approval of Finalized Designs"
        ],
        "Production": [
            "Quality Check Process"
        ],
        "Installation": [
            "Installation Work", "Completion Certificate"
        ]
    };

    const tasksToCreate = [];

    Object.entries(STAGES).forEach(([stage, taskTitles]) => {
        taskTitles.forEach(title => {
            tasksToCreate.push({
                projectId,
                title,
                stage,
                status: "PENDING",
                priority: "MEDIUM",
                type: "TASK"
            });
        });
    });

    if (tasksToCreate.length > 0) {
        await prisma.task.createMany({ data: tasksToCreate });
    }
};

// Parse Google Maps Link
const axios = require('axios');

exports.parseLocation = async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ error: "URL is required" });

        console.log(`[GeoParser] resolving: ${url}`);

        // 1. Resolve Short URL (e.g. maps.app.goo.gl)
        let resolvedUrl = url;
        if (url.includes('goo.gl') || url.includes('maps.app.goo.gl') || url.includes('maps.app')) {
            try {
                const response = await axios.head(url, { maxRedirects: 5, validateStatus: null });
                resolvedUrl = response.request.res.responseUrl || url;
                console.log(`[GeoParser] resolved to: ${resolvedUrl}`);
            } catch (err) {
                console.warn("[GeoParser] Failed to resolve short URL:", err.message);
                try {
                    const response = await axios.get(url, { maxRedirects: 5, validateStatus: null });
                    resolvedUrl = response.request?.res?.responseUrl || resolvedUrl;
                    console.log(`[GeoParser] fallback resolved to: ${resolvedUrl}`);
                } catch (fallbackErr) {
                    console.warn("[GeoParser] Fallback resolution failed:", fallbackErr.message);
                }
            }
        }

        // 2. Extract Coordinates via Regex
        const patterns = [
            /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,            // https://.../@12.34,56.78...
            /[?&]q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,       // https://...?q=12.34,56.78
            /[?&]query=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,   // https://...?query=12.34,56.78
            /[?&]ll=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,      // https://...?ll=12.34,56.78
            /[?&]center=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,  // https://...?center=12.34,56.78
            /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,        // Embed/share data params
            /(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/           // raw "lat,lng" text
        ];

        let lat, lng;
        for (let pattern of patterns) {
            const match = resolvedUrl.match(pattern);
            if (match) {
                lat = parseFloat(match[1]);
                lng = parseFloat(match[2]);
                break;
            }
        }

        if (lat !== undefined && lng !== undefined && !Number.isNaN(lat) && !Number.isNaN(lng)) {
            res.json({ latitude: lat, longitude: lng, resolvedUrl });
        } else {
            res.status(422).json({ error: "Could not extract coordinates from this link." });
        }

    } catch (error) {
        console.error("[GeoParser] Error:", error);
        res.status(500).json({ error: error.message });
    }
};

// Bulk Create Projects
// exports.bulkCreateProjects = async (req, res) => {
//     try {
//         const projectsData = req.body;
//         console.log(projectsData)
//     }catch{
    
//     }}
exports.bulkCreateProjects = async (req, res) => {
    try {
        const projectsData = req.body;
        if (!Array.isArray(projectsData) || projectsData.length === 0) {
            return res.status(400).json({ error: "Invalid data format. Expected an array of projects." });
        }

        const stats = { added: 0, skipped: 0, errors: [] };

        // 1. Fetch all users to create a lookup map for name/email to ID
        const allUsers = await prisma.user.findMany({
            select: { id: true, email: true, name: true }
        });

        const userLookup = {};
        allUsers.forEach(u => {
            if (u.email) userLookup[u.email.toLowerCase().trim()] = u.id;
            if (u.name) userLookup[u.name.toLowerCase().trim()] = u.id;
            if (u.id) userLookup[u.id.toLowerCase().trim()] = u.id; // Also allow raw ID if provided
        });

        const resolveUserId = (input) => {
            if (!input) return null;
            const key = String(input).trim().toLowerCase();
            return userLookup[key] || null;
        };

        // 1. Get latest project code to start incrementing
        const lastProject = await prisma.project.findFirst({
            orderBy: { projectCode: 'desc' },
            select: { projectCode: true }
        });

        let lastCodeNum = 0;
        if (lastProject && lastProject.projectCode) {
            const matches = lastProject.projectCode.match(/PRJ-(\d+)/);
            if (matches && matches[1]) {
                lastCodeNum = parseInt(matches[1], 10);
            }
        }

        // 2. Process projects one by one
        for (const data of projectsData) {
            try {
                // Validation
                // Validation - Relaxed (clientLastName is optional now)
                const missing = [];
                if (!data.name) missing.push("Project Name");
                if (!data.clientFirstName) missing.push("Client Name/First Name");
                if (!data.clientEmail) missing.push("Email");
                if (!data.clientPhone) missing.push("Phone");
                
                if (missing.length > 0) {
                    stats.errors.push(`Row error: ${data.name || 'Unnamed'} - Missing required fields: ${missing.join(', ')}`);
                    continue;
                }
                
                // Ensure lastName has a value if missing
                if (!data.clientLastName) data.clientLastName = ".";

                // Cleanup Phone (handle "9962050254, 8754503925") - Take first one
                if (data.clientPhone && data.clientPhone.includes(',')) {
                    data.clientPhone = data.clientPhone.split(',')[0].trim();
                }

                // Check for existing Project (by CP Number)
                let existingProject = null;
                if (data.cpNumber) {
                    existingProject = await prisma.project.findUnique({ where: { cpNumber: data.cpNumber } });
                }

                // Auto-generate Code
                lastCodeNum++;
                const projectCode = `PRJ-${String(lastCodeNum).padStart(3, '0')}`;

                const sanitizedData = { ...data };

                // Resolve Foreign Keys (BH, FA, LA)
                sanitizedData.businessHeadId = resolveUserId(sanitizedData.businessHeadId);
                sanitizedData.faId = resolveUserId(sanitizedData.faId);
                sanitizedData.laId = resolveUserId(sanitizedData.laId);

                // Cleanup empty optional strings
                const optionalFields = [
                    'cpNumber', 'gstin', 'spouseName', 'spousePhone', 'location',
                    'businessHeadId', 'propertyType', 'scopeOfWork', 'leadSource',
                    'salesRep', 'faId', 'laId', 'billingName', 'billingAddress',
                    'billingPhone', 'handingOverMonth', 'handingOverYear', 'status',
                    'unitNumber', 'block', 'floor', 'area'
                ];

                optionalFields.forEach(field => {
                    if (!sanitizedData[field] || (typeof sanitizedData[field] === 'string' && sanitizedData[field].trim() === "") || sanitizedData[field] === "null" || sanitizedData[field] === "undefined") {
                        sanitizedData[field] = null;
                    } else if (typeof sanitizedData[field] === 'string') {
                        sanitizedData[field] = sanitizedData[field].trim();
                    }
                });

                // --- Robust Numeric Parsing ---
                const parseNum = (val, isFloat = false, defaultValue = null) => {
                    if (val === undefined || val === null || val === "") return defaultValue;
                    const parsed = isFloat ? parseFloat(val) : parseInt(val, 10);
                    return isNaN(parsed) ? defaultValue : parsed;
                };

                sanitizedData.budget = parseNum(sanitizedData.budget, true, null);
                sanitizedData.timelineDuration = parseNum(sanitizedData.timelineDuration, false, 45);
                sanitizedData.latitude = parseNum(sanitizedData.latitude, true, null);
                sanitizedData.longitude = parseNum(sanitizedData.longitude, true, null);
                sanitizedData.paymentPercentage = parseNum(sanitizedData.paymentPercentage, false, 0);
                sanitizedData.executionPercentage = parseNum(sanitizedData.executionPercentage, false, 0);

                // Date Types
                const dateFields = ['startDate', 'deadline', 'handoverDate'];
                dateFields.forEach(field => {
                    sanitizedData[field] = parseSpreadsheetDate(sanitizedData[field]);
                });

                // --- Whitelist Fields for Prisma ---
                const validBaseFields = [
                    'name', 'clientFirstName', 'clientLastName', 'clientEmail', 'clientPhone',
                    'spouseName', 'spousePhone', 'location',
                    'unitNumber', 'block', 'floor', 'area', 'budget',
                    'paymentPercentage', 'executionPercentage', 'cpNumber',
                    'billingName', 'billingAddress', 'billingPhone', 'gstin',
                    'businessHeadId', 'faId', 'laId', 'propertyType', 'scopeOfWork',
                    'leadSource', 'salesRep', 'latitude', 'longitude',
                    'startDate', 'deadline', 'handoverDate', 'handingOverMonth',
                    'handingOverYear', 'timelineDuration', 'status'
                ];

                const finalData = {};
                validBaseFields.forEach(f => {
                    // Exclude scalar relation IDs from the base data object
                    if (['businessHeadId', 'faId', 'laId'].includes(f)) return;
                    if (sanitizedData[f] !== undefined && sanitizedData[f] !== null) {
                        finalData[f] = sanitizedData[f];
                    }
                });

                // Status Fallback (Must be a string, not null, according to schema)
                if (!finalData.status) finalData.status = "ONGOING";

                // Password
                const passwordHash = data.clientPassword ? await bcrypt.hash(data.clientPassword, 10) : undefined;

                if (existingProject) {
                    // UPDATE EXISTING
                    await prisma.project.update({
                        where: { id: existingProject.id },
                        data: {
                            ...finalData,
                            // Only update password if provided in Excel, or keep existing
                            ...(passwordHash ? { clientPassword: passwordHash } : {}),
                            // Use nested connect for foreign keys
                            businessHead: sanitizedData.businessHeadId ? { connect: { id: sanitizedData.businessHeadId } } : { disconnect: !sanitizedData.businessHeadId && existingProject.businessHeadId ? true : false },
                            fa: sanitizedData.faId ? { connect: { id: sanitizedData.faId } } : { disconnect: !sanitizedData.faId && existingProject.faId ? true : false },
                            la: sanitizedData.laId ? { connect: { id: sanitizedData.laId } } : { disconnect: !sanitizedData.laId && existingProject.laId ? true : false },
                        }
                    });
                    if (!stats.updated) stats.updated = 0;
                    stats.updated++;
                } else {
                    // CREATE NEW
                    // Auto-generate Code
                    lastCodeNum++;
                    const projectCode = `PRJ-${String(lastCodeNum).padStart(3, '0')}`;
                    
                    await prisma.project.create({
                        data: {
                            ...finalData,
                            projectCode,
                            clientPassword: passwordHash || await bcrypt.hash('cookscape123', 10),
                            // Use nested connect for foreign keys
                            businessHead: sanitizedData.businessHeadId ? { connect: { id: sanitizedData.businessHeadId } } : undefined,
                            fa: sanitizedData.faId ? { connect: { id: sanitizedData.faId } } : undefined,
                            la: sanitizedData.laId ? { connect: { id: sanitizedData.laId } } : undefined,
                        }
                    });
                    stats.added++;
                }

            } catch (error) {
                console.error("Bulk Item Error:", error);
                if (error.code === 'P2002') {
                    stats.errors.push(`Duplicate value error (Project Code or CP Number) for: ${data.name}`);
                } else if (error.code === 'P2003') {
                    stats.errors.push(`Invalid User Reference (BH, FA, or LA not found) for: ${data.name}`);
                } else {
                    console.error(`[BulkImport] Unexpected Error for ${data.name}:`, error);
                    stats.errors.push(`Row error: ${data.name} - ${error.message}${error.meta?.cause ? ' (' + error.meta.cause + ')' : ''}`);
                }
            }
        }

        res.json({ success: true, ...stats });

    } catch (error) {
        console.error("Bulk Import Error:", error);
        res.status(500).json({ error: "Bulk import failed: " + error.message });
    }
};

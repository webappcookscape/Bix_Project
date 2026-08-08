const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { sendUserPushNotification } = require('../services/notificationService');
const { sendReviewTemplate } = require('../services/whatsappService');

/**
 * Helper to trigger WhatsApp Review Request immediately
 * Used for In-Time / Arrival triggers
 */
async function processWhatsAppReview(entryId) {
    try {
        const entry = await prisma.walkinHubEntry.findUnique({ where: { id: entryId } });
        if (!entry || entry.whatsappSent || !entry.contactNumber) {
            return entry;
        }

        const result = await sendReviewTemplate(entry.contactNumber, entry.clientName);
        
        const updateData = {
            whatsappSent: true,
            whatsappStatus: result.success ? 'SENT' : 'FAILED',
            whatsappSentAt: new Date(),
            whatsappError: result.success ? null : (typeof result.error === 'string' ? result.error : (result.error?.message || 'WhatsApp Error'))
        };

        return await prisma.walkinHubEntry.update({
            where: { id: entryId },
            data: updateData,
            include: {
                cre: { select: { id: true, name: true } },
                bh: { select: { id: true, name: true } },
                architect: { select: { id: true, name: true } }
            }
        });
    } catch (error) {
        console.error('[WhatsApp Trigger] Error:', error);
        return null;
    }
}

const sanitizeTime = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return '';
    // If it is in format 10:00 AM or 10:00 PM, convert it for HTML5 time input (HH:mm)
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (match) {
        let [_, hours, minutes, ampm] = match;
        hours = parseInt(hours);
        if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
        if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
        return `${String(hours).padStart(2, '0')}:${minutes}`;
    }
    return timeStr;
};

const parseSpreadsheetDate = (value) => {
    if (!value) return null;

    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
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

    const dayFirstMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (dayFirstMatch) {
        const [, day, month, year] = dayFirstMatch;
        const parsed = new Date(Number(year), Number(month) - 1, Number(day));
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

// --- Helper for Sanitization ---
const sanitizeData = (data) => {
    const cleaned = { ...data };
    ['bhId', 'creId', 'architectId'].forEach(field => {
        if (cleaned[field] === '') {
            cleaned[field] = null;
        }
    });

    // Also sanitize times
    if (cleaned.inTime) cleaned.inTime = sanitizeTime(cleaned.inTime);
    if (cleaned.outTime) cleaned.outTime = sanitizeTime(cleaned.outTime);
    if (cleaned.tentativeTime) cleaned.tentativeTime = sanitizeTime(cleaned.tentativeTime);

    return cleaned;
};

const deriveWalkinStatus = ({ inTime, outTime, status }) => {
    if (outTime) return 'COMPLETED';
    if (inTime) return 'ACTIVE';
    if (status === 'IN PROGRESS') return 'IN PROGRESS';
    return status === 'ACTIVE' ? 'COMPLETED' : (status || 'COMPLETED');
};

// --- Walkin Hub Entries ---

exports.getWalkins = async (req, res) => {
    try {
        const { role, id: userId } = req.user;
        const filter = {};

        // Role-based filtering
        if (!['SUPER_ADMIN', 'MANAGER', 'BUSINESS_HEAD', 'LEAD_OPERATION'].includes(role)) {
            filter.OR = [
                { creId: userId },
                { bhId: userId },
                { architectId: userId }
            ];
        }

        const walkins = await prisma.walkinHubEntry.findMany({
            where: filter,
            include: {
                cre: { select: { id: true, name: true } },
                bh: { select: { id: true, name: true } },
                architect: { select: { id: true, name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(walkins);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createWalkin = async (req, res) => {
    try {
        const { 
            clientName, contactNumber, showroom, architectName, architectId, bhId, bhName, 
            project, dayOfVisit, tentativeTime, creId: bodyCreId,
            inTime, outTime, remarks, dateOfVisit, status
        } = req.body;
        const { role, id: loggedInUserId } = req.user;

        // Allow Admin/Manager/BH/LeadOperation to set creId explicitly
        const creId = (['SUPER_ADMIN', 'MANAGER', 'BUSINESS_HEAD', 'LEAD_OPERATION'].includes(role) && bodyCreId) 
            ? bodyCreId 
            : loggedInUserId;

        // 1. Duplicate Prevention (Contact + Today)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const existing = await prisma.walkinHubEntry.findFirst({
            where: {
                contactNumber,
                createdAt: {
                    gte: today,
                    lt: tomorrow
                }
            }
        });

        if (existing) {
            return res.status(400).json({ error: "Duplicate entry: This contact has already visited today." });
        }

        const normalizedStatus = deriveWalkinStatus({ inTime, outTime, status });

        // 2. Create Entry
        const entry = await prisma.walkinHubEntry.create({
            data: sanitizeData({
                creId,
                clientName,
                contactNumber,
                showroom,
                architectName,
                architectId,
                bhId,
                bhName,
                project,
                dayOfVisit,
                tentativeTime,
                inTime,
                outTime,
                remarks,
                dateOfVisit: dateOfVisit ? new Date(dateOfVisit) : today,
                status: normalizedStatus
            }),
            include: {
                cre: { select: { id: true, name: true } },
                bh: { select: { id: true, name: true } },
                architect: { select: { id: true, name: true } }
            }
        });

        // 3. Notifications
        // Notify BH if assigned
        if (bhId) {
            await sendUserPushNotification(
                bhId,
                'New Walk-in Assigned',
                `Client ${clientName} is visiting ${showroom} showroom.`,
                '/walkin-hub'
            );
        }

        // 4. IMMEDIATE WHATSAPP TRIGGER (Only if In-Time / Arrival is marked)
        let finalEntry = entry;
        if (entry.inTime) {
            finalEntry = await processWhatsAppReview(entry.id) || entry;
        }

        res.status(201).json(finalEntry);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.updateWalkin = async (req, res) => {
    try {
        const { id } = req.params;
        const { dateOfVisit, status, ...rest } = req.body;
        const existing = await prisma.walkinHubEntry.findUnique({ where: { id } });

        if (!existing) {
            return res.status(404).json({ error: 'Walk-in entry not found' });
        }

        const normalizedStatus = deriveWalkinStatus({
            inTime: rest.inTime ?? existing.inTime,
            outTime: rest.outTime ?? existing.outTime,
            status
        });
        
        // If status is being set to COMPLETED, track the time for WhatsApp follow-up
        let outTimeMarkedAt = undefined;
        if (normalizedStatus === 'COMPLETED') {
            outTimeMarkedAt = new Date();
        }

        let updated = await prisma.walkinHubEntry.update({
            where: { id },
            data: {
                ...sanitizeData(rest),
                status: normalizedStatus,
                outTimeMarkedAt,
                dateOfVisit: dateOfVisit ? new Date(dateOfVisit) : undefined
            },
            include: {
                cre: { select: { id: true, name: true } },
                bh: { select: { id: true, name: true } },
                architect: { select: { id: true, name: true } }
            }
        });

        // Trigger WhatsApp if newly provided inTime and not sent yet
        if (!updated.whatsappSent && updated.inTime) {
            const triggered = await processWhatsAppReview(id);
            if (triggered) updated = triggered;
        }

        res.json(updated);
    } catch (error) {
        console.error('[Walkin] Update Error:', error);
        res.status(400).json({ error: error.message });
    }
};

exports.deleteWalkin = async (req, res) => {
    try {
        await prisma.walkinHubEntry.delete({ where: { id: req.params.id } });
        res.json({ message: 'Entry deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- Work Reports ---

exports.getWorkReports = async (req, res) => {
    try {
        const { role, id: userId } = req.user;
        const filter = {};

        if (!['SUPER_ADMIN', 'MANAGER', 'BUSINESS_HEAD', 'LEAD_OPERATION'].includes(role)) {
            filter.OR = [
                { creId: userId },
                { bhId: userId }
            ];
        }

        const reports = await prisma.workReport.findMany({
            where: filter,
            include: { 
                bh: { select: { id: true, name: true } },
                cre: { select: { id: true, name: true } }
            },
            orderBy: { date: 'desc' }
        });
        res.json(reports);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createWorkReport = async (req, res) => {
    try {
        const { role, id: loggedInUserId } = req.user;
        const { creId: bodyCreId, ...rest } = req.body;

        // Allow Admin/Manager/BH/LeadOperation to set creId explicitly
        const creId = (['SUPER_ADMIN', 'MANAGER', 'BUSINESS_HEAD', 'LEAD_OPERATION'].includes(role) && bodyCreId) 
            ? bodyCreId 
            : loggedInUserId;

        const report = await prisma.workReport.create({
            data: sanitizeData({
                ...rest,
                date: rest.date ? new Date(rest.date) : new Date(),
                creId,
                bhName: req.body.bhName // Explicitly include if passed
            })
        });
        res.status(201).json(report);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.updateWorkReport = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await prisma.workReport.update({
            where: { id },
            data: sanitizeData({
                ...req.body,
                date: req.body.date ? new Date(req.body.date) : undefined
            })
        });
        res.json(updated);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.deleteWorkReport = async (req, res) => {
    try {
        await prisma.workReport.delete({ where: { id: req.params.id } });
        res.json({ message: 'Work report deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- Bulk Imports ---

exports.bulkImportWalkins = async (req, res) => {
    try {
        const data = req.body;
        if (!Array.isArray(data)) return res.status(400).json({ error: "Expected an array" });

        const sanitized = data.map(item => {
            const inTime = sanitizeTime(item.inTime) || '';
            const outTime = sanitizeTime(item.outTime) || '';

            return {
                clientName: item.clientName || 'Unnamed Client',
                contactNumber: item.contactNumber || '0000000000',
                showroom: item.showroom || 'MTRS',
                project: item.project || '',
                dateOfVisit: parseSpreadsheetDate(item.dateOfVisit) || new Date(),
                inTime,
                outTime,
                remarks: item.remarks || '',
                creId: item.creId || req.user.id,
                status: deriveWalkinStatus({ inTime, outTime, status: item.status })
            };
        });

        const result = await prisma.walkinHubEntry.createMany({
            data: sanitized
        });
        res.json({ success: true, count: result.count });
    } catch (error) {
        console.error('[BulkImportWalkins] Error:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.bulkImportWorkReports = async (req, res) => {
    try {
        const data = req.body;
        if (!Array.isArray(data)) return res.status(400).json({ error: "Expected an array" });

        const sanitized = data.map(item => ({
            clientName: item.clientName || 'Unnamed Client',
            contact: item.contact || '0000000000',
            showroom: item.showroom || 'MTRS',
            site: item.site || '',
            status: item.status || 'Y',
            star: parseInt(item.star) || 0,
            remarks: item.remarks || '',
            date: parseSpreadsheetDate(item.date) || new Date(),
            creId: item.creId || req.user.id
        }));

        const result = await prisma.workReport.createMany({
            data: sanitized
        });
        res.json({ success: true, count: result.count });
    } catch (error) {
        console.error('[BulkImportWorkReports] Error:', error);
        res.status(500).json({ error: error.message });
    }
};

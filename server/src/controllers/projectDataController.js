const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

// --- IMAGES ---

exports.getImages = async (req, res) => {
    try {
        const { projectId } = req.params;
        const images = await prisma.projectImage.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(images);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching images' });
    }
};

exports.addImage = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { url, caption } = req.body;
        const image = await prisma.projectImage.create({
            data: {
                projectId,
                url, // Expecting relative URL from uploadController
                caption
            }
        });
        res.status(201).json(image);
    } catch (error) {
        res.status(500).json({ message: 'Error adding image' });
    }
};

exports.deleteImage = async (req, res) => {
    try {
        const { id } = req.params;
        const image = await prisma.projectImage.findUnique({ where: { id } });
        if (image) {
            // Optional: Delete file from filesystem
            const filePath = path.join(__dirname, '../../', image.url);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            await prisma.projectImage.delete({ where: { id } });
        }
        res.json({ message: 'Image deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting image' });
    }
};

// --- DOCUMENTS ---

exports.getDocuments = async (req, res) => {
    try {
        const { projectId } = req.params;
        const docs = await prisma.projectDocument.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(docs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching documents' });
    }
};

exports.addDocument = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { url, name, taskId } = req.body;
        const doc = await prisma.projectDocument.create({
            data: {
                projectId,
                url,
                name,
                taskId: taskId || null
            }
        });
        res.status(201).json(doc);
    } catch (error) {
        res.status(500).json({ message: 'Error adding document' });
    }
};

exports.deleteDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await prisma.projectDocument.findUnique({ where: { id } });
        if (doc) {
            const filePath = path.join(__dirname, '../../', doc.url);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            await prisma.projectDocument.delete({ where: { id } });
        }
        res.json({ message: 'Document deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting document' });
    }
};

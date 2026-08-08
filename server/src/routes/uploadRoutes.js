const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Unique filename: timestamp + random + extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        // Detailed logging for debugging
        console.log(`[Upload Debug] Processing file: ${file.originalname}`);
        console.log(`[Upload Debug] Mimetype: ${file.mimetype}`);

        // Allow images, PDFs, docs
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            console.warn(`[Upload Debug] Rejected file: ${file.originalname} (Type: ${file.mimetype})`);
            // TEMPORARILY ALLOW ALL FOR DEBUGGING
            return cb(null, true);
            // cb(new Error('Only images and documents are allowed!'));
        }
    }
});

// Upload Endpoint
// Upload Endpoint - Changed to .any() for debugging 400 error
router.post('/', upload.any(), (req, res) => {
    try {
        console.log('[Upload Debug] Files:', req.files);
        console.log('[Upload Debug] Body:', req.body);

        if (!req.files || req.files.length === 0) {
            console.error('[Upload Debug] No files found in request');
            return res.status(400).json({ error: "No files uploaded - DEBUG MODE" });
        }

        const fileUrls = req.files.map(file => ({
            name: file.originalname,
            url: `/uploads/${file.filename}`, // Relative URL for frontend
            type: file.mimetype,
            size: (file.size / 1024).toFixed(1) + ' KB'
        }));

        res.json(fileUrls);
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

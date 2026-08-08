const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Storage for Project Attachments (similar to uploadRoutes)
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

router.get('/', projectController.getProjects);
router.post('/', upload.any(), projectController.createProject); // Allow file uploads on create
router.post('/bulk', projectController.bulkCreateProjects);
router.get('/:id', projectController.getProjectById);
router.put('/:id', upload.any(), projectController.updateProject);
router.put('/:id/payment', projectController.updateProjectPayment);
router.get('/:id/payments', projectController.getProjectPayments);
router.delete('/:id', projectController.deleteProject);
router.post('/parse-location', projectController.parseLocation);
// Magic Link
router.get('/:id/access-link', projectController.generateAccessLink);
router.get('/magic-link/:code', projectController.verifyMagicLink);

module.exports = router;

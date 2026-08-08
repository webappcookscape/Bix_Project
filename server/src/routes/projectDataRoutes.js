const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const projectDataController = require('../controllers/projectDataController');

// Upload
router.post('/upload', uploadController.uploadMiddleware, uploadController.handleUpload);

// Images
router.get('/:projectId/images', projectDataController.getImages);
router.post('/:projectId/images', projectDataController.addImage);
router.delete('/images/:id', projectDataController.deleteImage);

// Documents
router.get('/:projectId/documents', projectDataController.getDocuments);
router.post('/:projectId/documents', projectDataController.addDocument);
router.delete('/documents/:id', projectDataController.deleteDocument);

module.exports = router;

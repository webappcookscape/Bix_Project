const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

const uploadController = require('../controllers/uploadController');
const taskEvidenceController = require('../controllers/taskEvidenceController');

router.get('/', taskController.getTasks);
router.post('/', taskController.createTask);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

// Evidence Upload
router.post('/:taskId/evidence', uploadController.uploadMiddleware, taskEvidenceController.uploadEvidence);

// Simulation
router.post('/simulate-overdue', taskController.simulateOverdue);

module.exports = router;

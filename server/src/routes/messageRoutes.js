const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');

// GET /api/messages/:projectId
router.get('/:projectId', messageController.getMessages);

// POST /api/messages
router.post('/', messageController.sendMessage);

module.exports = router;

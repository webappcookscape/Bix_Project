const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');

// GET /api/emails?userId=...&folder=...
router.get('/', emailController.getEmails);

// POST /api/emails (Send or Draft)
router.post('/', emailController.sendEmail);

// GET /api/emails/users?query=...
router.get('/users', emailController.searchUsers);

// GET /api/emails/unread?userId=...
router.get('/unread', emailController.getUnreadCount);

// POST /api/emails/mark-all-read
router.post('/mark-all-read', emailController.markAllRead);

// DELETE /api/emails/:id?type=soft|hard
router.delete('/:id', emailController.deleteEmail);

// PUT /api/emails/:id/restore
router.put('/:id/restore', emailController.restoreEmail);

module.exports = router;

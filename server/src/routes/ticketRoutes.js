const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');

router.post('/', ticketController.createTicket);
router.get('/', ticketController.getTickets); // Can accept ?projectId=xyz
router.patch('/:id/status', ticketController.updateTicketStatus);
router.get('/:id/comments', ticketController.getComments);
router.post('/:id/comments', ticketController.addComment);
router.post('/:id/convert', ticketController.convertToIssue);

module.exports = router;

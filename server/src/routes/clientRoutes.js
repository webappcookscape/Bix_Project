const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');

router.post('/login', clientController.login);
router.get('/:projectId', clientController.getProjectDetails);

module.exports = router;

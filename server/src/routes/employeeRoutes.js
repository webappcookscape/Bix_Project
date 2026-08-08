const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');

router.get('/bhs', employeeController.getBusinessHeads);
router.get('/cres', employeeController.getCREs);
router.get('/', employeeController.getEmployees);
router.post('/', employeeController.createEmployee);
router.post('/bulk', employeeController.bulkCreateEmployees);
router.put('/:id', employeeController.updateEmployee);
router.delete('/:id', employeeController.deleteEmployee);

module.exports = router;

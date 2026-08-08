const express = require('express');
const router = express.Router();
const { listBackups, createBackup, deleteBackup, BACKUP_DIR } = require('../services/backupService');
const path = require('path');
const fs = require('fs');
const employeeController = require('../controllers/employeeController');

// GET /api/admin/backups - List all backups
router.get('/backups', (req, res) => {
    try {
        const backups = listBackups();
        res.json(backups);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/admin/backups - Trigger manual backup
router.post('/backups', async (req, res) => {
    try {
        const result = await createBackup();
        if (result.success) {
            res.json(result);
        } else {
            res.status(500).json({ error: "Backup failed" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/admin/backups/:filename - Download backup
router.get('/backups/:filename', (req, res) => {
    const filepath = path.join(BACKUP_DIR, req.params.filename);
    if (fs.existsSync(filepath)) {
        res.download(filepath);
    } else {
        res.status(404).json({ error: "File not found" });
    }
});

// DELETE /api/admin/backups/:filename - Delete backup
router.delete('/backups/:filename', (req, res) => {
    try {
        const result = deleteBackup(req.params.filename);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// User Management compatibility (Required for Frontend Admin UI)
// Maps /api/admin/users/:id -> employeeController.deleteEmployee
router.delete('/users/:id', employeeController.deleteEmployee);
router.get('/users', employeeController.getEmployees);

module.exports = router;

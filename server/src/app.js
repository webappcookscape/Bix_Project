const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
    setHeaders: (res, path) => {
        res.set('Content-Disposition', 'attachment');
    }
}));

// Routes
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const taskRoutes = require('./routes/taskRoutes');
const clientRoutes = require('./routes/clientRoutes');
// const userRoutes = require('./routes/userRoutes'); // Removed non-existent route
const messageRoutes = require('./routes/messageRoutes');
const projectDataRoutes = require('./routes/projectDataRoutes');
const adminRoutes = require('./routes/adminRoutes'); // New Admin Routes
const walkinRoutes = require('./routes/walkinRoutes');
const monthlyReportRoutes = require('./routes/monthlyReportRoutes');


const { initScheduler: initBackupScheduler } = require('./services/backupService');
const { initScheduler: initTaskScheduler } = require('./services/schedulerService');
const { initKeepAlive } = require('./services/keepAliveService');

// Init Schedulers
initBackupScheduler();
initTaskScheduler();
initKeepAlive();

app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes); // Removed
app.use('/api/projects', projectRoutes);
app.use('/api/employees', employeeRoutes); // Keep existing employee routes
app.use('/api/client', clientRoutes); // Keep existing client routes
app.use('/api/tasks', (req, res, next) => { console.log('Route /api/tasks access'); next(); }, taskRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/project-data', projectDataRoutes);
app.use('/api/admin', adminRoutes); // Register Admin Routes
app.use('/api/emails', require('./routes/emailRoutes')); // Register Email Routes
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/tickets', require('./routes/ticketRoutes'));
app.use('/api/activities', require('./routes/activityRoutes'));
app.use('/api/walkins', walkinRoutes);
app.use('/api/monthly-reports', monthlyReportRoutes);


app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Cookscape Backend is running' });
});

app.get('/api/env-debug', (req, res) => {
    res.json({
        VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY ? 'PRESENT' : 'MISSING',
        VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY ? 'PRESENT' : 'MISSING',
        PORT: process.env.PORT,
        NODE_ENV: process.env.NODE_ENV
    });
});

app.get('/api/health/smtp', async (req, res) => {
    const net = require('net');
    const dns = require('dns').promises;
    const { createTransporter } = require('./services/emailService');

    const host = 'smtp.gmail.com';
    const ports = [465, 587, 25, 2525];

    // 1. DNS Test
    const dnsStatus = await (async () => {
        try {
            const result = await dns.lookup(host);
            return { status: 'ok', address: result.address };
        } catch (err) {
            return { status: 'error', message: err.message };
        }
    })();

    // 2. Multi-Port TCP Test
    const portTests = await Promise.all(ports.map(port => new Promise((resolve) => {
        const socket = new net.Socket();
        const start = Date.now();
        socket.setTimeout(5000); // 5s is enough to see a block

        socket.on('connect', () => {
            const duration = Date.now() - start;
            socket.destroy();
            resolve({ port, status: 'OPEN', duration: `${duration}ms` });
        });

        socket.on('timeout', () => {
            socket.destroy();
            resolve({ port, status: 'BLOCKED (TIMEOUT)' });
        });

        socket.on('error', (err) => {
            socket.destroy();
            resolve({ port, status: 'BLOCKED (REFUSED)', error: err.message });
        });

        socket.connect(port, host);
    })));

    try {
        const transporter = createTransporter();
        const verifyPromise = transporter ? transporter.verify() : Promise.reject('No transporter');
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Handshake timeout')), 10000));

        let smtpHandshake = 'SKIP';
        try {
            await Promise.race([verifyPromise, timeoutPromise]);
            smtpHandshake = 'SUCCESS';
        } catch (e) {
            smtpHandshake = `FAILED: ${e.message}`;
        }

        res.json({
            status: smtpHandshake === 'SUCCESS' ? 'ok' : 'error',
            render_tier_check: "Possible Blockage Detected",
            dns: dnsStatus,
            network_ports: portTests,
            smtp_handshake: smtpHandshake,
            environment: {
                SMTP_USER: process.env.SMTP_USER ? 'Set' : 'Missing',
                SMTP_PORT: process.env.SMTP_PORT || 'Default (465)'
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
    }
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Serve Static Frontend (Production)
// Serve Static Frontend (Production)
// Serve static files from the React app (assuming build output is in ../../dist due to current folder structure: root/server/src/app.js)
const buildPath = path.join(__dirname, '../../dist');
app.use(express.static(buildPath));

// Catch-all handler for any request that doesn't match an API route
// Server Restart Triggered: VAPID Key Alignment
app.get('*', (req, res) => {
    // Ticket Comments Fix
    res.sendFile(path.join(buildPath, 'index.html'));
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

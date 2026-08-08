const cron = require('node-cron');
const axios = require('axios');

// Function to ping the server itself
const pingServer = async () => {
    // Render typically provides RENDER_EXTERNAL_URL
    const serverUrl = process.env.SERVER_URL || process.env.RENDER_EXTERNAL_URL || `http://localhost:${process.env.PORT || 5000}`;
    const healthUrl = `${serverUrl}/api/health`;

    console.log(`[KeepAlive] Pinging ${healthUrl} to prevent sleep...`);

    try {
        const start = Date.now();
        const response = await axios.get(healthUrl);
        const duration = Date.now() - start;
        console.log(`[KeepAlive] Success: Status ${response.status} (${duration}ms)`);
    } catch (error) {
        console.error(`[KeepAlive] Failed: ${error.message}`);
    }
};

const initKeepAlive = () => {
    // Run every 14 minutes (Render sleeps after 15 mins inactive)
    cron.schedule('*/14 * * * *', () => {
        pingServer();
    });

    console.log('[KeepAlive] Service Initialized (Every 14 mins)');

    // Initial ping to verify
    setTimeout(() => {
        pingServer();
    }, 10000); // Wait 10s for server to start
};

module.exports = { initKeepAlive };

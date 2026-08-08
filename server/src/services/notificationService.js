const webpush = require('web-push');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

require('dotenv').config();

// Configure keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
} else {
    console.warn('[NotificationService] VAPID keys missing. Push notifications disabled.');
}

const sendPushNotification = async (subscription, payload) => {
    try {
        await webpush.sendNotification(subscription, JSON.stringify(payload));
        return { success: true };
    } catch (error) {
        console.error('[NotificationService] Error sending push:', error);
        if (error.statusCode === 410 || error.statusCode === 404) {
            return { success: false, status: 'EXPIRED' };
        }
        return { success: false, error };
    }
};

const sendUserPushNotification = async (userId, title, body, url = '/') => {
    try {
        const subscriptions = await prisma.pushSubscription.findMany({
            where: { userId }
        });

        if (subscriptions.length === 0) {
            console.log(`[NotificationService] No subscriptions for user ${userId}`);
            return { success: false, reason: 'NO_SUBSCRIPTION' };
        }

        const payload = { title, body, url, icon: '/pwa-192x192.png' };
        const results = [];

        for (const sub of subscriptions) {
            const pushSub = {
                endpoint: sub.endpoint,
                keys: sub.keys
            };

            const result = await sendPushNotification(pushSub, payload);

            // Clean up dead subscriptions
            if (result.status === 'EXPIRED') {
                console.log(`[NotificationService] Removing expired subscription ${sub.id}`);
                await prisma.pushSubscription.delete({ where: { id: sub.id } });
            }
            results.push(result);
        }

        console.log(`[NotificationService] Sent ${results.filter(r => r.success).length}/${results.length} notifications to User ${userId}`);
        return { success: true, results };

    } catch (error) {
        console.error('[NotificationService] Failed to send user notification:', error);
        return { success: false, error: error.message };
    }
};

module.exports = { sendPushNotification, sendUserPushNotification };

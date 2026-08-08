const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { sendReviewTemplate } = require('../src/services/whatsappService');

/**
 * Trigger Reviews Script
 * Manually forces sending of WhatsApp review requests for all eligible entries.
 * Criteria: Status = COMPLETED, OutTime >= 2 hours ago, Message not yet sent.
 */
async function triggerReviews() {
    console.log('🚀 Starting Manual Review Trigger...');
    
    try {
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
        
        // Find eligible walk-ins:
        // 1. Status is COMPLETED (Send immediately)
        // 2. OR outTimeMarkedAt was 2+ hours ago (Auto-follow up)
        const pendingRequests = await prisma.walkinHubEntry.findMany({
            where: {
                whatsappSent: false,
                OR: [
                    { status: 'COMPLETED' },
                    { 
                        outTimeMarkedAt: {
                            not: null,
                            lte: twoHoursAgo
                        }
                    }
                ]
            }
        });

        if (pendingRequests.length === 0) {
            console.log('ℹ️ No eligible pending WhatsApp review requests found.');
            return;
        }

        console.log(`🔍 Found ${pendingRequests.length} eligible entries. Sending now...`);

        let successCount = 0;
        let failCount = 0;

        for (const entry of pendingRequests) {
            console.log(`📤 Sending to ${entry.clientName} (${entry.contactNumber})...`);
            const result = await sendReviewTemplate(entry.contactNumber, entry.clientName);
            
            if (result.success) {
                await prisma.walkinHubEntry.update({
                    where: { id: entry.id },
                    data: { 
                        whatsappSent: true,
                        whatsappStatus: 'SENT',
                        whatsappSentAt: new Date(),
                        whatsappError: null
                    }
                });
                successCount++;
                console.log(`✅ Sent successfully to ${entry.clientName}`);
            } else {
                const errorData = result.error?.error || result.error;
                const errorMessage = typeof errorData === 'string' ? errorData : (errorData?.message || 'Unknown WhatsApp Error');
                
                await prisma.walkinHubEntry.update({
                    where: { id: entry.id },
                    data: { 
                        whatsappSent: true, // Mark as attempted to prevent infinite loops
                        whatsappStatus: 'FAILED',
                        whatsappError: errorMessage
                    }
                });
                failCount++;
                console.error(`❌ Failed for ${entry.clientName}:`, errorMessage);
            }
        }

        console.log(`\n✨ Summary: ${successCount} Successful, ${failCount} Failed.`);

    } catch (error) {
        console.error('❌ Fatal Error in trigger script:', error);
    } finally {
        await prisma.$disconnect();
    }
}

triggerReviews();

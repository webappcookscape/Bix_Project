require('dotenv').config();
const { sendReviewTemplate } = require('../src/services/whatsappService');

async function test() {
    const phoneNumber = '7418414780'; // Updated 10-digit number
    const clientName = 'Aravind';
    
    console.log(`🚀 Sending WhatsApp Review Template to ${clientName} (${phoneNumber})...`);
    
    const result = await sendReviewTemplate(phoneNumber, clientName);
    
    if (result.success) {
        console.log('✅ Successfully sent!');
        console.log('Response:', JSON.stringify(result.data, null, 2));
    } else {
        console.error('❌ Failed to send.');
        console.error('Error:', result.error);
    }
}

test();

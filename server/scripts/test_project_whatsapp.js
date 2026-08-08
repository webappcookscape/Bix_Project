require('dotenv').config();
const { sendPlainTextMessage } = require('../src/services/whatsappService');

async function test() {
    const phoneNumber = process.argv[2] || '7418414780';
    const clientName = 'Test User';
    const message = `
BH RK
Name - Test Client
Mob number: 1234567890
Mail id - test@example.com

Project Name - TEST PROJECT UNIT 101
Location - CHENNAI PORUR

Wood work value - Rs.50,000/-
Add on - Rs.10,000/-

Source - Test Source
Payment mode - ONLINE

Freezed amount - Rs.5,000/- (Test Registration)

Variant - Test Variant

Order Taken - Test CRE
Bh - RK

Project Created Successfully.
`.trim();

    console.log(`🚀 Sending Test Plain Text WhatsApp to ${phoneNumber}...`);
    const result = await sendPlainTextMessage(phoneNumber, message);

    if (result.success) {
        console.log('✅ Successfully sent!');
        console.log('Response:', JSON.stringify(result.data, null, 2));
    } else {
        console.error('❌ Failed to send.');
        console.error('Error:', result.error);
    }
}

test();

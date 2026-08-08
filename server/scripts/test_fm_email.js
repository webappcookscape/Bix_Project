const { sendFreezingMail } = require('../src/services/emailService');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function testEmail() {
    const testRecipient = process.argv[2] || 'es.cookscape@gmail.com';
    
    console.log(`🚀 Starting Freezing Mail Test for: ${testRecipient}`);
    console.log(`📡 Using SMTP User: ${process.env.SMTP_USER}`);

    // 1. Mock Project Data
    const mockProject = {
        name: "Test Project - VPS Verification",
        projectCode: "TEST-001",
        clientFirstName: "Test",
        clientLastName: "Client",
        clientEmail: testRecipient,
        clientPhone: "9876543210",
        location: "VPS Test Server, Cloud",
        budget: 500000,
        freezingAmount: 25000,
        variant: "Direct Test Variant",
        woodworkAmount: 400000,
        addOnsAmount: 75000,
        quoteLink: "https://docs.google.com/spreadsheets/d/1yqj9uBxKVznnrDmOGLtX0vBX63BmuQtqR2UM03zAL0s/edit?usp=sharing",
        freezingMailNote: "This is a diagnostic email sent from the VPS to verify SMTP connectivity and attachment delivery.",
        salesRep: "Julia (Test CRE)",
        fa: { name: "System Admin", email: "admin@cookscape.com" },
        businessHead: { name: "BH Manager", email: "bh@cookscape.com" }
    };

    // 2. Create a Dummy Attachment
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
    
    const testFilePath = path.join(uploadsDir, 'vps_test_attachment.txt');
    fs.writeFileSync(testFilePath, "SMTP Verification Success! This file was sent from the VPS.");

    const attachments = [
        {
            filename: 'vps_test_report.txt',
            path: testFilePath
        }
    ];

    try {
        console.log("📨 Attempting to send Freezing Mail (NEW CLEAN UI)...");
        
        await sendFreezingMail({
            project: mockProject,
            recipients: [testRecipient],
            attachments: attachments
        });

        console.log("✅ SUCCESS: The test email has been handed off with the CUSTOM LOGO.");
        console.log("📩 Please check for the NEW MINIMALIST DESIGN at:", testRecipient);

    } catch (error) {
        console.error("❌ ERROR: Failed to send test email.");
        console.error("Details:", error.message);
        
        if (error.message.includes('535')) {
            console.error("\n💡 TIP: Authentication failed. Please check if your App Password is correct and 2-Step Verification is enabled.");
        }
    }
}

testEmail();

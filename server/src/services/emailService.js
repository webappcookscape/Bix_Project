const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Initialize Transporter
const createTransporter = () => {
    // Only create if credentials exist to avoid crashing
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('[EmailService] SMTP credentials missing. Email sending disabled.');
        return null;
    }

    const smtpPort = parseInt(process.env.SMTP_PORT) || 465;
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const isGmail = smtpHost.toLowerCase().includes('gmail.com');

    const config = {
        secure: smtpPort === 465,
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        // Aggressive connection settings for cloud environments
        connectionTimeout: 30000,
        greetingTimeout: 20000,
        socketTimeout: 60000,
        dnsTimeout: 10000,
        family: 4, // Force IPv4 to avoid Render IPv6 handshake stalls
        debug: true,
        logger: true,
        tls: {
            rejectUnauthorized: false,
            minVersion: 'TLSv1.2'
        }
    };

    // FORCE service: 'gmail' if it's a Gmail address
    // This is much more reliable as it triggers Nodemailer's internal Gmail logic
    if (isGmail) {
        config.service = 'gmail';
    } else {
        config.host = smtpHost;
        config.port = smtpPort;
    }

    return nodemailer.createTransport(config);
};

const sendBackupEmail = async (filePath, filename) => {
    const transporter = createTransporter();
    if (!transporter) {
        return { success: false, error: "SMTP credentials missing" };
    }

    const recipient = process.env.BACKUP_EMAIL_RECIPIENT || process.env.SMTP_USER;

    try {
        if (!recipient) {
            console.error('[EmailService] Backup failed: No recipient defined (BACKUP_EMAIL_RECIPIENT or SMTP_USER).');
            return { success: false, error: "No recipient defined" };
        }

        console.log(`[EmailService] Sending backup email to ${recipient}...`);

        const info = await transporter.sendMail({
            from: `"Orbix Projects Backup Bot" <${process.env.SMTP_USER}>`,
            to: recipient,
            subject: `[Backup] Daily Data Backup - ${filename}`,
            text: `Attached is the daily system data backup file generated on ${new Date().toLocaleString()}.`,
            attachments: [
                {
                    filename: filename,
                    path: filePath
                }
            ]
        });

        console.log('[EmailService] Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('[EmailService] Failed to send email:', error);
        return { success: false, error: error.message };
    }
};

// Generic Notification Sender
const sendNotificationEmail = async (to, subject, text, html = null, cc = null, attachments = []) => {
    const transporter = createTransporter();
    if (!transporter) {
        return { success: false, error: "SMTP credentials missing" };
    }

    try {
        // Robust check for string, array, or null/undefined
        const hasRecipient = to && (typeof to === 'string' ? to.trim().length > 0 : (Array.isArray(to) ? to.length > 0 : true));
        
        if (!hasRecipient) {
            console.warn(`[EmailService] Abandoned sending email: No valid recipient (to) defined for subject: "${subject}". Value:`, to);
            return { success: false, error: "No recipient defined" };
        }
        console.log(`[EmailService v4-FINAL] Sending notification to ${to} (CC: ${cc || 'None'})...`);

        const mailOptions = {
            from: `"Orbix Projects" <${process.env.SMTP_USER}>`,
            to: to,
            subject: subject,
            text: text, // Fallback plain text
            html: html || text.replace(/\n/g, '<br>') // Simple HTML conversion if not provided
        };

        if (cc) {
            mailOptions.cc = cc;
        }

        if (attachments && attachments.length > 0) {
            mailOptions.attachments = attachments;
        }

        const info = await transporter.sendMail(mailOptions);

        console.log(`[EmailService] SUCCESS: Notification delivered to ${to} (MessageID: ${info.messageId})`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('[EmailService] Failed to send email:', error);
        return { success: false, error: error.message };
    }
};

// Standard HTML Template (Optimized for Clean UI)
const getEmailTemplate = (title, content) => {
    return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #edf2f7; border-radius: 16px; overflow: hidden; background-color: #ffffff; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);">
        <!-- Logos/Branding Section (Clean White) -->
        <div style="padding: 32px 32px 20px; text-align: left; border-bottom: 1px solid #f7fafc;">
            <img src="cid:logo" alt="Cookscape" style="height: 50px; width: auto; display: block;">
        </div>
        
        <div style="padding: 32px; color: #4a5568; line-height: 1.6;">
            <h2 style="color: #1a202c; margin-top: 0; margin-bottom: 24px; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">${title}</h2>
            <div style="font-size: 15px; color: #4a5568;">
                ${content}
            </div>
        </div>
        
        <div style="background-color: #f7fafc; padding: 24px 32px; text-align: left; border-top: 1px solid #edf2f7; font-size: 12px; color: #a0aec0;">
            <p style="margin: 0; font-weight: 600; color: #718096;">&copy; ${new Date().getFullYear()} Cookscape Interiors. All rights reserved.</p>
            <p style="margin: 4px 0 0;">This is an automated system notification. Please do not reply directly unless specified.</p>
        </div>
    </div>
    `;
};

const sendFreezingMail = async ({ project, recipients, attachments = [] }) => {
    const title = `NEW PROJECT FREEZING MAIL: ${project.name}`;
    
    const content = `
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                    <td style="padding: 8px 0; color: #64748b; width: 150px; font-weight: 600;">Name</td>
                    <td style="padding: 8px 0; color: #0f172a; font-weight: 700;">${project.clientFirstName} ${project.clientLastName}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Number</td>
                    <td style="padding: 8px 0; color: #0f172a;">${project.clientPhone}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Mail ID</td>
                    <td style="padding: 8px 0; color: #0f172a;">${project.clientEmail}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Project / Location</td>
                    <td style="padding: 8px 0; color: #0f172a;">${project.location || 'N/A'}</td>
                </tr>
                <tr style="border-top: 1px solid #e2e8f0;">
                    <td style="padding: 12px 0 8px; color: #ea580c; font-weight: 700;">Freezing Amount</td>
                    <td style="padding: 12px 0 8px; color: #ea580c; font-weight: 800; font-size: 16px;">Rs. ${Number(project.freezingAmount || 0).toLocaleString()}/-</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Variant</td>
                    <td style="padding: 8px 0; color: #0f172a;">${project.variant || 'N/A'}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Project Value</td>
                    <td style="padding: 8px 0; color: #0f172a; font-weight: 700;">Rs. ${Number(project.budget || 0).toLocaleString()}/-</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Woodwork</td>
                    <td style="padding: 8px 0; color: #0f172a;">Rs. ${Number(project.woodworkAmount || 0).toLocaleString()}/-</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Add ons</td>
                    <td style="padding: 8px 0; color: #0f172a;">Rs. ${Number(project.addOnsAmount || 0).toLocaleString()}/-</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Source</td>
                    <td style="padding: 8px 0; color: #0f172a;">${project.leadSource || 'N/A'}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #64748b; font-weight: 600;">FA</td>
                    <td style="padding: 8px 0; color: #0f172a;">${project.fa?.name || 'Assigned'}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #64748b; font-weight: 600;">BH</td>
                    <td style="padding: 8px 0; color: #0f172a;">${project.businessHead?.name || 'Assigned'}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Order Taken (CRE)</td>
                    <td style="padding: 8px 0; color: #0f172a; font-weight: 700;">${project.salesRep || 'N/A'}</td>
                </tr>
                ${project.quoteLink ? `
                <tr>
                    <td style="padding: 12px 0; color: #64748b; font-weight: 600;">Quote Link</td>
                    <td style="padding: 12px 0;">
                        <a href="${project.quoteLink}" style="color: #2563eb; text-decoration: underline; font-weight: 600;">View Spreadsheet</a>
                    </td>
                </tr>` : ''}
            </table>
            
            ${project.freezingMailNote ? `
            <div style="margin-top: 20px; padding-top: 15px; border-top: 2px dashed #cbd5e1;">
                <p style="margin: 0 0 8px; color: #64748b; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">NOTE</p>
                <p style="margin: 0; color: #1e293b; font-size: 14px; line-height: 1.5; white-space: pre-wrap;">${project.freezingMailNote}</p>
            </div>` : ''}
        </div>
    `;

    const html = getEmailTemplate(title, content);
    
    // Add Branding Logo to every Freezing Mail
    const logoPath = path.join(__dirname, '../../../public/FINAL_LOGO.png');
    const finalAttachments = [...attachments];
    
    if (fs.existsSync(logoPath)) {
        finalAttachments.push({
            filename: 'logo.png',
            path: logoPath,
            cid: 'logo' // Consistent CID for template
        });
    }

    return await sendNotificationEmail(recipients, title, title, html, null, finalAttachments);
};

module.exports = { createTransporter, sendBackupEmail, sendNotificationEmail, getEmailTemplate, sendFreezingMail };

const axios = require('axios');

/**
 * WhatsApp Service for Unified Cookscape
 * Integrated with Meta Graph API (WhatsApp Cloud API)
 */

// Retrieve credentials dynamically to ensure compatibility with .env variable names
const getCredentials = () => {
    const token = process.env.WHATSAPP_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneId = process.env.PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_NUMBER_ID;
    return { token, phoneId };
};

/**
 * Sends the cookscape_review_request_media template to a customer
 * @param {string} phoneNumber - Customer phone number (with country code, no +)
 * @param {string} clientName - Customer name for the template parameter
 */
exports.sendReviewTemplate = async (phoneNumber, clientName) => {
    const { token, phoneId } = getCredentials();

    if (!token || !phoneId) {
        console.error('[WhatsApp] Missing credentials in .env (WHATSAPP_TOKEN or WHATSAPP_ACCESS_TOKEN / PHONE_NUMBER_ID or WHATSAPP_PHONE_NUMBER_ID)');
        return { success: false, error: 'Missing credentials' };
    }

    // Clean phone number: remove +, spaces, dashes.
    let cleanPhone = phoneNumber.replace(/\D/g, '');
    
    // Check for dummy numbers
    const DUMMY_NUMBERS = ['0000000000', '1234567890', '9876543210'];
    if (DUMMY_NUMBERS.includes(cleanPhone) || cleanPhone.length < 10) {
        console.error(`[WhatsApp] Blocked dummy/invalid number: ${cleanPhone}`);
        return { success: false, error: 'Dummy/Invalid Phone Number' };
    }

    if (cleanPhone.length === 10) {
        cleanPhone = '91' + cleanPhone;
    }

    const url = `https://graph.facebook.com/v17.0/${phoneId}/messages`;

    const data = {
        messaging_product: "whatsapp",
        to: cleanPhone,
        type: "template",
        template: {
            name: "cookscape_review_request_media",
            language: {
                code: "en"
            },
            components: [
                {
                    type: "header",
                    parameters: [
                        {
                            type: "image",
                            image: {
                                link: "https://wa.orbixdesigns.com/media/qr_cookscape.png"
                            }
                        }
                    ]
                },
                {
                    type: "body",
                    parameters: [
                        {
                            type: "text",
                            text: clientName
                        }
                    ]
                }
            ]
        }
    };

    try {
        const response = await axios.post(url, data, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log(`[WhatsApp] Template sent to ${cleanPhone}:`, response.data);
        return { success: true, data: response.data };
    } catch (error) {
        console.error(`[WhatsApp] Error sending template to ${cleanPhone}:`, error.response?.data || error.message);
        return { success: false, error: error.response?.data || error.message };
    }
};

/**
 * Sends a plain text message (no template) to a phone number.
 * @param {string} phoneNumber - Recipient phone number (with country code, no +)
 * @param {string} message - Message body content
 */
exports.sendPlainTextMessage = async (phoneNumber, message) => {
    const { token, phoneId } = getCredentials();

    if (!token || !phoneId) {
        console.error('[WhatsApp] Missing credentials in .env (WHATSAPP_TOKEN or WHATSAPP_ACCESS_TOKEN / PHONE_NUMBER_ID or WHATSAPP_PHONE_NUMBER_ID)');
        return { success: false, error: 'Missing credentials' };
    }

    // Clean phone number: remove +, spaces, dashes.
    let cleanPhone = phoneNumber.replace(/\D/g, '');
    
    if (cleanPhone.length === 10) {
        cleanPhone = '91' + cleanPhone;
    }

    const url = `https://graph.facebook.com/v17.0/${phoneId}/messages`;

    const data = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanPhone,
        type: "text",
        text: {
            preview_url: false,
            body: message
        }
    };

    try {
        const response = await axios.post(url, data, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log(`[WhatsApp] Plain text sent to ${cleanPhone}:`, response.data);
        return { success: true, data: response.data };
    } catch (error) {
        console.error(`[WhatsApp] Error sending text to ${cleanPhone}:`, error.response?.data || error.message);
        return { success: false, error: error.response?.data || error.message };
    }
};

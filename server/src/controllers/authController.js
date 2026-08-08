const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key';
const { sendNotificationEmail, getEmailTemplate } = require('../services/emailService');

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Find user
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // 2. Verify password
        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // 3. Status check
        if (user.status !== 'ACTIVE') {
            return res.status(403).json({ message: 'Account is inactive' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role, name: user.name },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        // 5. Respond
        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                department: user.department,
                phone: user.phone
            }
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Server error parsing login request' });
    }
};

const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.googleLogin = async (req, res) => {
    const { token } = req.body; // ID Token from frontend

    try {
        // 1. Verify Google Token
        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { email, name, picture } = payload;

        // 2. Find User
        let user = await prisma.user.findUnique({ where: { email } });

        // If user doesn't exist, we reject (Closed System)
        // OR we could auto-register strict roles if needed, but safer to reject.
        if (!user) {
            return res.status(401).json({ message: "No account found with this Google email. Please ask an Admin to register you first." });
        }

        if (user.status !== 'ACTIVE') {
            return res.status(403).json({ message: 'Account is inactive' });
        }

        // 3. Generate JWT (Same as normal login)
        const jwtToken = jwt.sign(
            { id: user.id, role: user.role, name: user.name },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            token: jwtToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                department: user.department,
                phone: user.phone,
                picture: picture // Send back google pic if we want to use it
            }
        });

    } catch (error) {
        console.error("Google Login Error:", error);
        res.status(400).json({ message: "Google authentication failed" });
    }
};

// -----------------------------------------
// Password Reset Logic
// -----------------------------------------

exports.requestPasswordReset = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            // Security: Don't reveal if user exists
            return res.json({ message: "If that email exists, we have sent an OTP." });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Save to DB
        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetOTP: otp,
                resetOTPExpires: expiresAt
            }
        });

        // Send Email
        await sendNotificationEmail(
            email,
            "Password Reset Request",
            `Your OTP for password reset is: ${otp}\n\nThis code expires in 10 minutes.`,
            getEmailTemplate(
                "Password Reset Request",
                `<div style="text-align: center;">
                    <p style="margin-bottom: 24px;">You requested to reset your password. Use the code below to proceed:</p>
                    <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; display: inline-block; margin-bottom: 24px;">
                        <h1 style="color: #ea580c; letter-spacing: 8px; font-size: 32px; margin: 0; font-family: monospace;">${otp}</h1>
                    </div>
                    <p style="font-size: 14px; color: #64748b;">This code expires in 10 minutes.</p>
                    <p style="font-size: 12px; color: #ef4444; margin-top: 10px;">If you didn't request this, strictly ignore this email.</p>
                </div>`
            )
        );

        res.json({ message: "If that email exists, we have sent an OTP." });

    } catch (error) {
        console.error("Forgot Password Error:", error);
        res.status(500).json({ message: "Server error processing request" });
    }
};

exports.resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || user.resetOTP !== otp) {
            return res.status(400).json({ message: "Invalid or expired OTP." });
        }

        // Check expiry
        if (new Date() > new Date(user.resetOTPExpires)) {
            return res.status(400).json({ message: "OTP has expired. Please request a new one." });
        }

        // Hash new password
        const passwordHash = await bcrypt.hash(newPassword, 10);

        // Update User & Clear OTP
        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                resetOTP: null,
                resetOTPExpires: null
            }
        });

        res.json({ message: "Password reset successfully. You can now login." });

    } catch (error) {
        console.error("Reset Password Error:", error);
        res.status(500).json({ message: "Failed to reset password." });
    }
};

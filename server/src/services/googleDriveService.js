const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Initialize Google Drive API
// Only initialize if credentials exist to avoid crashing the server on startup for people who haven't set it up
let drive = null;

const initDrive = () => {
    if (drive) return drive;

    const KEY_FILE_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!KEY_FILE_PATH || !fs.existsSync(path.resolve(KEY_FILE_PATH))) {
        console.warn('[GDrive] Skipping Google Drive init: GOOGLE_APPLICATION_CREDENTIALS not found or invalid.');
        return null;
    }

    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: KEY_FILE_PATH,
            scopes: ['https://www.googleapis.com/auth/drive.file'],
        });
        drive = google.drive({ version: 'v3', auth });
        console.log('[GDrive] Google Drive Service Initialized.');
        return drive;
    } catch (error) {
        console.error('[GDrive] Failed to initialize Google Drive:', error.message);
        return null;
    }
};

const uploadFileToDrive = async (filePath, originalFilename) => {
    const driveService = initDrive();
    if (!driveService) {
        return { success: false, error: "Google Drive service not initialized (Check credentials)" };
    }

    try {
        console.log(`[GDrive] Starting upload for ${originalFilename}...`);

        const folderId = process.env.GDRIVE_BACKUP_FOLDER_ID;
        if (!folderId) {
            throw new Error("GDRIVE_BACKUP_FOLDER_ID is missing in .env");
        }

        const fileMetadata = {
            name: originalFilename,
            parents: [folderId],
        };

        const media = {
            mimeType: 'application/json',
            body: fs.createReadStream(filePath),
        };

        const response = await driveService.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id',
        });

        console.log('[GDrive] Upload success. File ID:', response.data.id);
        return { success: true, fileId: response.data.id };

    } catch (error) {
        console.error('[GDrive] Upload failed:', error.message);
        return { success: false, error: error.message };
    }
};

module.exports = { uploadFileToDrive };

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');

if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    const pubKeyLine = lines.find(l => l.startsWith('VAPID_PUBLIC_KEY'));
    if (pubKeyLine) {
        console.log('KEY_VALUE:', pubKeyLine.split('=')[1].trim());
    } else {
        console.log('KEY_NOT_FOUND');
    }
} else {
    console.log('ENV_FILE_NOT_FOUND');
}

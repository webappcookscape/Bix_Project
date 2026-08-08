const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');

if (!fs.existsSync(envPath)) {
    console.log('.env not found');
} else {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    lines.forEach(line => {
        if (line.includes('VAPID')) {
            const [key, value] = line.split('=');
            console.log(`${key}: ${value ? (value.trim() ? 'PRESENT' : 'EMPTY') : 'MISSING'}`);
        }
    });
}

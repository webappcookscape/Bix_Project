const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const publicKey = 'BCzEmj0HimnRyh6wuFfhxvv9MNNIF-vdfTlnNz8T_kc_21N0oTp7iLHuJSQ9RnRAoZO4DONVU_b16tFBQPNL-ZQ';
const privateKey = '1w33MAZxWDoD-8qT7HnUSu2sN2IR2esemq1hypHAKnk';

console.log('Checking .env at:', envPath);

if (!fs.existsSync(envPath)) {
    console.log('.env file not found, creating it...');
    fs.writeFileSync(envPath, `VAPID_PUBLIC_KEY="${publicKey}"\nVAPID_PRIVATE_KEY="${privateKey}"\n`);
    console.log('Success: .env created with VAPID keys.');
    process.exit(0);
}

let content = fs.readFileSync(envPath, 'utf8');

let updated = false;
if (!content.includes('VAPID_PUBLIC_KEY')) {
    content += `\nVAPID_PUBLIC_KEY="${publicKey}"`;
    updated = true;
}
if (!content.includes('VAPID_PRIVATE_KEY')) {
    content += `\nVAPID_PRIVATE_KEY="${privateKey}"`;
    updated = true;
}

if (updated) {
    fs.writeFileSync(envPath, content);
    console.log('Success: VAPID keys added to .env');
} else {
    console.log('VAPID keys already exist in .env');
}

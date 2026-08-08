const path = require('path');
const fs = require('fs');

const uploadPath = path.join(__dirname, '../uploads');
console.log('Resolved Upload Path:', uploadPath);

if (fs.existsSync(uploadPath)) {
    const files = fs.readdirSync(uploadPath);
    console.log(`Found ${files.length} files:`);
    files.forEach(f => {
        if (f.startsWith('1768888633456')) {
            console.log(`[MATCH] '${f}' (Length: ${f.length})`);
            // Print char codes
            const codes = [];
            for (let i = 0; i < f.length; i++) {
                codes.push(f.charCodeAt(i));
            }
            console.log(`       Codes: ${codes.join(' ')}`);
        } else {
            console.log(` - ${f}`);
        }
    });
} else {
    console.log('Uploads directory does not exist!');
}

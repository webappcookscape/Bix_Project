const { restoreBackup } = require('../src/services/backupService');

async function main() {
    const args = process.argv.slice(2);
    
    // Find filename (anything that doesn't start with - and isn't "dry-run")
    const filename = args.find(arg => !arg.startsWith('-') && arg !== 'dry-run');
    
    if (!filename) {
        console.error("❌ Error: Please specify a backup filename.");
        console.log("Usage:");
        console.log("  npm run restore:backup -- <filename> [--mode=replace] [dry-run]");
        process.exit(1);
    }

    const dryRun = args.includes('dry-run') || args.includes('--dry-run');
    const mode = args.includes('--mode=replace') || args.includes('-m=replace') ? 'replace' : 'merge';

    try {
        const result = await restoreBackup(filename, { mode, dryRun });
        console.log("\n📊 Restore results:");
        console.log(JSON.stringify(result, null, 2));
        process.exit(0);
    } catch (err) {
        console.error("❌ Restore failed:", err.message);
        process.exit(1);
    }
}

main();

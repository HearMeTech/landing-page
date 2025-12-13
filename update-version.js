import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filesToUpdate = [
    path.join(__dirname, 'public', 'index.html'),
    path.join(__dirname, 'public', '404.html'),
    path.join(__dirname, 'public', 'pages', 'waitlist.html'),
    path.join(__dirname, 'public', 'pages', 'maintenance.html')
];

const newVersion = Date.now();

console.log(`🚀 Updating asset versions to: ${newVersion}`);

filesToUpdate.forEach(filePath => {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        const updatedContent = content.replace(/(\?v=)[^"']+/g, `$1${newVersion}`);
        
        if (content !== updatedContent) {
            fs.writeFileSync(filePath, updatedContent, 'utf8');
            console.log(`✅ Updated: ${path.relative(__dirname, filePath)}`);
        } else {
            console.log(`ℹ️  No changes needed: ${path.relative(__dirname, filePath)}`);
        }
        
    } catch (err) {
        console.error(`❌ Error updating ${filePath}:`, err.message);
    }
});

console.log('🎉 Version update complete!');


import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');

try {
    if (!fs.existsSync(envPath)) {
        console.log('.env.local DOES NOT EXIST at', envPath);
    } else {
        const buffer = fs.readFileSync(envPath);
        console.log('.env.local found. Size:', buffer.length, 'bytes');
        console.log('Hex start:', buffer.subarray(0, 20).toString('hex'));

        const content = buffer.toString('utf8');
        console.log('Content preview (first 100 chars):', content.substring(0, 100).replace(/\n/g, '\\n'));

        // Simple parse check
        const lines = content.split('\n');
        const keyLine = lines.find(l => l.includes('GEMINI_API_KEY'));
        if (keyLine) {
            console.log('Found GEMINI_API_KEY line:', keyLine.substring(0, 20) + '...');
            const parts = keyLine.split('=');
            if (parts.length > 1 && parts[1].trim().length > 5) {
                console.log('Key appears to be set (length > 5)');
            } else {
                console.log('Key appears to be EMPTY');
            }
        } else {
            console.log('GEMINI_API_KEY NOT FOUND in file content');
        }
    }
} catch (err) {
    console.error('Error reading .env.local:', err);
}

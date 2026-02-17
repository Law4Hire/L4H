import fs from 'fs';
import path from 'path';

const LOG_FILE = path.join(__dirname, '../logs/nightly_error.log');

export function logError(context: string, error: any) {
    const timestamp = new Date().toISOString();
    const errorMessage = error instanceof Error ? error.stack || error.message : String(error);
    const logEntry = `[${timestamp}] [${context}] ${errorMessage}\n----------------------------------------\n`;
    
    // Ensure directory exists
    const dir = path.dirname(LOG_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.appendFileSync(LOG_FILE, logEntry);
    console.error(`[${context}] ${errorMessage}`); // Also log to console for CI/local visibility
}

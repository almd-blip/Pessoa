import * as fs from 'fs';
import * as path from 'path';

const now = Date.now();
const fiveMinutes = 5 * 60 * 1000;

function scan(dir: string, depth = 0) {
  if (depth > 6) return;
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          if (file !== 'node_modules' && file !== '.git' && file !== 'dist' && file !== 'proc' && file !== 'sys' && file !== 'dev') {
            scan(fullPath, depth + 1);
          }
        } else {
          const age = now - stat.mtimeMs;
          if (age < fiveMinutes) {
            console.log(`[NEW FILE] ${fullPath} - age: ${Math.round(age / 1000)}s - size: ${stat.size} bytes`);
          }
        }
      } catch (e) {}
    }
  } catch (e) {}
}

console.log('Scanning entire filesystem for files created/modified in the last 5 minutes...');
scan('/');
console.log('Done scanning.');

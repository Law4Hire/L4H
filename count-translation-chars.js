const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all English (en-US) translation files
const enFiles = execSync('find web -path "*/locales/*/en-US/*" -name "*.json" | grep -v node_modules | grep -v dist', { encoding: 'utf-8' })
  .trim()
  .split('\n')
  .filter(f => f);

console.log(`Found ${enFiles.length} English translation files\n`);

let totalChars = 0;
let totalKeys = 0;
const fileStats = [];

for (const file of enFiles) {
  try {
    const content = fs.readFileSync(file, 'utf-8');
    const json = JSON.parse(content);

    // Count characters in all string values (recursively)
    function countChars(obj) {
      let count = 0;
      let keys = 0;

      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
          count += value.length;
          keys++;
        } else if (typeof value === 'object' && value !== null) {
          const nested = countChars(value);
          count += nested.count;
          keys += nested.keys;
        }
      }

      return { count, keys };
    }

    const result = countChars(json);
    totalChars += result.count;
    totalKeys += result.keys;

    fileStats.push({
      file: file.replace('web/', ''),
      chars: result.count,
      keys: result.keys
    });
  } catch (err) {
    console.error(`Error reading ${file}:`, err.message);
  }
}

// Sort by character count
fileStats.sort((a, b) => b.chars - a.chars);

console.log('=== Top 10 Largest Translation Files ===');
fileStats.slice(0, 10).forEach((stat, i) => {
  console.log(`${i + 1}. ${stat.file}`);
  console.log(`   ${stat.chars.toLocaleString()} chars, ${stat.keys} keys\n`);
});

console.log('\n=== SUMMARY ===');
console.log(`Total English source characters: ${totalChars.toLocaleString()}`);
console.log(`Total translation keys: ${totalKeys.toLocaleString()}`);

// Count languages
const languages = new Set();
execSync('find web -path "*/locales/*" -type d | grep -v node_modules | grep -v dist', { encoding: 'utf-8' })
  .trim()
  .split('\n')
  .forEach(dir => {
    const match = dir.match(/\/locales\/[^/]+\/([a-z]{2}-[A-Z]{2})\//);
    if (match) {
      languages.add(match[1]);
    }
  });

const languageList = Array.from(languages).sort();
console.log(`\nLanguages supported: ${languageList.length}`);
console.log(languageList.join(', '));

// Calculate total characters needed for translation
// (English doesn't count, so subtract 1)
const targetLanguages = languageList.length - 1;
const totalTranslationChars = totalChars * targetLanguages;

console.log(`\n=== TRANSLATION API ESTIMATE ===`);
console.log(`Source (English): ${totalChars.toLocaleString()} characters`);
console.log(`Target languages: ${targetLanguages} (${languageList.filter(l => l !== 'en-US').join(', ')})`);
console.log(`Total characters to translate: ${totalTranslationChars.toLocaleString()}`);
console.log(`\nIf using Lara Translate API:`);
console.log(`  - At $0.10 per 1,000 chars: $${(totalTranslationChars / 1000 * 0.10).toFixed(2)}`);
console.log(`  - At $0.20 per 1,000 chars: $${(totalTranslationChars / 1000 * 0.20).toFixed(2)}`);
console.log(`  - At $0.50 per 1,000 chars: $${(totalTranslationChars / 1000 * 0.50).toFixed(2)}`);

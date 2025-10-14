/**
 * Fix hardcoded English strings in InterviewPage.tsx
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'web', 'l4h', 'src', 'pages', 'InterviewPage.tsx');

console.log('🔧 Fixing hardcoded English strings in InterviewPage.tsx...');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Apply fixes
const fixes = [
  {
    search: '<p className="text-gray-600">Loading your personalized interview...</p>',
    replace: '<p className="text-gray-600">{t(\'interview.loading\', \'Loading your personalized interview...\')}</p>',
    description: 'Fix loading message'
  },
  {
    search: '                🔄 Reset',
    replace: '                {t(\'interview.restart\', \'🔄 Reset\')}',
    description: 'Fix reset button text'
  }
];

let fixesApplied = 0;

fixes.forEach(fix => {
  if (content.includes(fix.search)) {
    content = content.replace(fix.search, fix.replace);
    console.log(`✅ Applied fix: ${fix.description}`);
    fixesApplied++;
  } else {
    console.log(`⚠️ Pattern not found: ${fix.description}`);
  }
});

// Write the file back
fs.writeFileSync(filePath, content, 'utf8');

console.log(`🎉 Applied ${fixesApplied} fixes to InterviewPage.tsx`);
console.log('✅ All hardcoded English strings should now be translated!');
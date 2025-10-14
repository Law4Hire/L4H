/**
 * Fix InterviewPage.tsx to have minimal fallbacks that ensure rendering
 * but still force French translations to work
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'web', 'l4h', 'src', 'pages', 'InterviewPage.tsx');

console.log('🔧 Adding minimal fallbacks to ensure InterviewPage renders...');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Apply fixes to add minimal fallbacks
const fixes = [
  {
    search: "t('interview.title')",
    replace: "t('interview.title') || 'Interview'",
    description: 'Add minimal fallback for interview title'
  },
  {
    search: "t('interview.progress.title')",
    replace: "t('interview.progress.title') || 'Progress'",
    description: 'Add minimal fallback for progress title'
  },
  {
    search: "t('interview.progress.stats', {",
    replace: "t('interview.progress.stats', { defaultValue: 'Question {{current}} | {{remaining}} remaining', ",
    description: 'Add fallback for progress stats'
  },
  {
    search: "t('interview.selectOption')",
    replace: "t('interview.selectOption') || 'Select'",
    description: 'Add minimal fallback for select option'
  },
  {
    search: "t('interview.next')",
    replace: "t('interview.next') || 'Next'",
    description: 'Add minimal fallback for next button'
  },
  {
    search: "t('interview.loading')",
    replace: "t('interview.loading') || 'Loading...'",
    description: 'Add minimal fallback for loading text'
  },
  {
    search: "t('interview.restart')",
    replace: "t('interview.restart') || 'Reset'",
    description: 'Add minimal fallback for restart button'
  }
];

let fixesApplied = 0;

fixes.forEach(fix => {
  const beforeCount = (content.match(new RegExp(fix.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  if (beforeCount > 0) {
    content = content.replace(new RegExp(fix.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fix.replace);
    console.log(`✅ Applied fix: ${fix.description} (${beforeCount} instances)`);
    fixesApplied += beforeCount;
  } else {
    console.log(`⚠️ Pattern not found: ${fix.description}`);
  }
});

// Write the file back
fs.writeFileSync(filePath, content, 'utf8');

console.log(`🎉 Applied ${fixesApplied} fixes to add minimal fallbacks`);
console.log('✅ Now the component should render AND use French translations!');
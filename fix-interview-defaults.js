/**
 * Fix InterviewPage.tsx to remove English default values from translation calls
 * This forces the translations to work properly instead of falling back to English
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'web', 'l4h', 'src', 'pages', 'InterviewPage.tsx');

console.log('🔧 Removing English default values from translation calls...');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Apply fixes to remove English defaults
const fixes = [
  {
    search: "t('interview.title', 'Visa Eligibility Interview')",
    replace: "t('interview.title')",
    description: 'Remove English default from interview title (lines 305, 321)'
  },
  {
    search: "t('interview.progress.title', 'Adaptive Interview Progress')",
    replace: "t('interview.progress.title')",
    description: 'Remove English default from progress title (line 326)'
  },
  {
    search: "t('interview.progress.stats', 'Question {{current}} | {{remaining}} visa types remaining', {",
    replace: "t('interview.progress.stats', {",
    description: 'Remove English default from progress stats (line 329)'
  },
  {
    search: "t('interview.selectOption', 'Select an option')",
    replace: "t('interview.selectOption')",
    description: 'Remove English default from select option (line 371)'
  },
  {
    search: "t('interview.next', 'Next Question')",
    replace: "t('interview.next')",
    description: 'Remove English default from next button (line 422)'
  },
  {
    search: "t('interview.loading', 'Loading your personalized interview...')",
    replace: "t('interview.loading')",
    description: 'Remove English default from loading text'
  },
  {
    search: "t('interview.restart', '🔄 Reset')",
    replace: "t('interview.restart')",
    description: 'Remove English default from restart button'
  }
];

let fixesApplied = 0;

fixes.forEach(fix => {
  const beforeCount = (content.match(new RegExp(fix.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  if (beforeCount > 0) {
    content = content.replace(new RegExp(fix.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fix.replace);
    const afterCount = (content.match(new RegExp(fix.replace.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    console.log(`✅ Applied fix: ${fix.description} (${beforeCount} instances)`);
    fixesApplied += beforeCount;
  } else {
    console.log(`⚠️ Pattern not found: ${fix.description}`);
  }
});

// Write the file back
fs.writeFileSync(filePath, content, 'utf8');

console.log(`🎉 Applied ${fixesApplied} fixes to remove English defaults`);
console.log('✅ Now translations MUST work or text will be missing!');
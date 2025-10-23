const fs = require('fs');
const path = require('path');

const supportedLanguages = [
  'ar-SA', 'bn-BD', 'de-DE', 'en-US', 'es-ES', 'fr-FR', 'hi-IN',
  'id-ID', 'it-IT', 'ja-JP', 'ko-KR', 'mr-IN', 'pl-PL', 'pt-BR',
  'ru-RU', 'ta-IN', 'te-IN', 'tl-PH', 'tr-TR', 'ur-PK', 'vi-VN', 'zh-CN'
];

const frontendNamespaces = ['common', 'landing', 'auth', 'forms', 'visaLibrary'];

console.log('=== LANGUAGE TRANSLATION STATUS REPORT ===\n');

// Frontend gaps
console.log('FRONTEND TRANSLATION FILES (web/l4h/public/locales):');
console.log('─'.repeat(80));

const frontendGaps = {};
supportedLanguages.forEach(lang => {
  const missingNamespaces = [];
  frontendNamespaces.forEach(ns => {
    const filePath = path.join('web/l4h/public/locales', lang, `${ns}.json`);
    if (!fs.existsSync(filePath)) {
      missingNamespaces.push(ns);
    }
  });

  if (missingNamespaces.length > 0) {
    frontendGaps[lang] = missingNamespaces;
  }
});

if (Object.keys(frontendGaps).length > 0) {
  console.log('\n❌ MISSING FRONTEND FILES:\n');
  Object.entries(frontendGaps).forEach(([lang, namespaces]) => {
    console.log(`  ${lang}: Missing ${namespaces.join(', ')}`);
  });
} else {
  console.log('\n✅ All frontend files present');
}

// Backend gaps
console.log('\n\nBACKEND RESOURCE FILES (.resx):');
console.log('─'.repeat(80));

const backendGaps = {};
supportedLanguages.forEach(lang => {
  const apiPath = `src/api/Resources/Shared.${lang}.resx`;
  const infraPath = `src/infrastructure/Resources/Shared.${lang}.resx`;

  const hasAPI = fs.existsSync(apiPath);
  const hasInfra = fs.existsSync(infraPath);

  if (!hasAPI || !hasInfra) {
    backendGaps[lang] = {
      api: hasAPI,
      infrastructure: hasInfra
    };
  }
});

if (Object.keys(backendGaps).length > 0) {
  console.log('\n❌ MISSING BACKEND RESOURCES:\n');
  Object.entries(backendGaps).forEach(([lang, status]) => {
    const missing = [];
    if (!status.api) missing.push('API');
    if (!status.infrastructure) missing.push('Infrastructure');
    console.log(`  ${lang}: Missing ${missing.join(' and ')}`);
  });
} else {
  console.log('\n✅ All backend resources present');
}

// Special case: pt-PT vs pt-BR
console.log('\n\nSPECIAL CASES:');
console.log('─'.repeat(80));
const ptPTExists = fs.existsSync('src/api/Resources/Shared.pt-PT.resx');
const ptBRExistsAPI = fs.existsSync('src/api/Resources/Shared.pt-BR.resx');
if (ptPTExists && !ptBRExistsAPI) {
  console.log('⚠️  API has pt-PT instead of pt-BR (should be pt-BR for consistency)');
}

// Dist folder check
console.log('\n\nDISTRIBUTION FOLDER STATUS (web/l4h/dist/locales):');
console.log('─'.repeat(80));

const distGaps = {};
supportedLanguages.forEach(lang => {
  const missingInDist = [];
  ['common', 'landing', 'auth', 'forms'].forEach(ns => {
    const distPath = path.join('web/l4h/dist/locales', lang, `${ns}.json`);
    if (!fs.existsSync(distPath)) {
      missingInDist.push(ns);
    }
  });

  if (missingInDist.length > 0) {
    distGaps[lang] = missingInDist;
  }
});

if (Object.keys(distGaps).length > 0) {
  console.log('\n⚠️  MISSING FROM DIST (needs build):\n');
  Object.entries(distGaps).forEach(([lang, namespaces]) => {
    console.log(`  ${lang}: Missing ${namespaces.join(', ')}`);
  });
  console.log('\n  Note: These will be resolved by running "npm run build"');
} else {
  console.log('\n✅ All required files in dist');
}

// Summary
console.log('\n\n=== SUMMARY ===');
console.log('─'.repeat(80));
console.log(`Total languages supported: ${supportedLanguages.length}`);
console.log(`Languages with frontend gaps: ${Object.keys(frontendGaps).length}`);
console.log(`Languages with backend gaps: ${Object.keys(backendGaps).length}`);
console.log(`Languages with dist gaps: ${Object.keys(distGaps).length}`);

// Recommendations
console.log('\n\n=== RECOMMENDATIONS ===');
console.log('─'.repeat(80));

const allGaps = new Set([
  ...Object.keys(frontendGaps),
  ...Object.keys(backendGaps)
]);

if (allGaps.size === 0) {
  console.log('✅ All language files are complete!');
  console.log('   Just run "npm run build" to update dist folder if needed.');
} else {
  console.log('Languages needing attention:\n');
  allGaps.forEach(lang => {
    const issues = [];
    if (frontendGaps[lang]) {
      issues.push(`Frontend: ${frontendGaps[lang].join(', ')}`);
    }
    if (backendGaps[lang]) {
      const missing = [];
      if (!backendGaps[lang].api) missing.push('API');
      if (!backendGaps[lang].infrastructure) missing.push('Infrastructure');
      issues.push(`Backend: ${missing.join(' + ')}`);
    }
    console.log(`  ${lang}:`);
    issues.forEach(issue => console.log(`    - ${issue}`));
  });
}

console.log('\n' + '='.repeat(80) + '\n');

const fs = require('fs');
const path = require('path');

// Languages to check
const languages = [
  'en-US', 'ar-SA', 'bn-BD', 'zh-CN', 'de-DE', 'es-ES', 'fr-FR', 'hi-IN',
  'id-ID', 'it-IT', 'ja-JP', 'ko-KR', 'mr-IN', 'pl-PL', 'pt-BR',
  'ru-RU', 'ta-IN', 'te-IN', 'tr-TR', 'ur-PK', 'vi-VN', 'tl-PH'
];

// Translation keys used in VisaLibraryPage
const requiredKeys = [
  'close',  // Used for modal close button
  'visaLibrary.title',
  'visaLibrary.description',
  'visaLibrary.loading',
  'visaLibrary.learnMore',
  'visaLibrary.categories.nonimmigrant',
  'visaLibrary.categories.immigrant',
  'visaLibrary.modal.category',
  'visaLibrary.modal.description',
  'visaLibrary.modal.nextSteps',
  'visaLibrary.modal.readyToApply',
  'visaLibrary.modal.applyFor',
  'visaLibrary.cta.title',
  'visaLibrary.cta.description',
  'visaLibrary.cta.button'
];

// Visa types that need translations
const visaTypes = [
  'B1', 'B2', 'F1', 'F2', 'H1B', 'H2A', 'H4', 'J1',
  'L1A', 'L1B', 'L2', 'O1', 'TN', 'E2',
  'EB1', 'EB2', 'EB3', 'EB4', 'EB5'
];

// Add visa-specific keys
visaTypes.forEach(visa => {
  requiredKeys.push(`visaLibrary.visas.${visa}.name`);
  requiredKeys.push(`visaLibrary.visas.${visa}.description`);
});

console.log('🔍 Checking Visa Library translations...\n');

const missingTranslations = {};
const totalKeys = requiredKeys.length;

languages.forEach(lang => {
  const commonPath = path.join(__dirname, 'web', 'l4h', 'public', 'locales', lang, 'common.json');

  if (!fs.existsSync(commonPath)) {
    console.log(`❌ ${lang}: common.json file not found`);
    missingTranslations[lang] = { missing: requiredKeys, total: totalKeys };
    return;
  }

  try {
    const content = fs.readFileSync(commonPath, 'utf8');
    const translations = JSON.parse(content);

    const missing = [];

    requiredKeys.forEach(key => {
      const keys = key.split('.');
      let value = translations;

      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          value = undefined;
          break;
        }
      }

      if (value === undefined || value === null || value === '') {
        missing.push(key);
      }
    });

    if (missing.length > 0) {
      missingTranslations[lang] = {
        missing,
        total: totalKeys,
        percentage: ((totalKeys - missing.length) / totalKeys * 100).toFixed(1)
      };
      console.log(`⚠️  ${lang}: ${missing.length}/${totalKeys} keys missing (${missingTranslations[lang].percentage}% complete)`);
    } else {
      console.log(`✅ ${lang}: All ${totalKeys} keys present (100% complete)`);
    }
  } catch (error) {
    console.log(`❌ ${lang}: Error reading file - ${error.message}`);
    missingTranslations[lang] = { error: error.message };
  }
});

console.log('\n📊 Summary:');
console.log(`Languages checked: ${languages.length}`);
console.log(`Languages with missing translations: ${Object.keys(missingTranslations).length}`);
console.log(`Languages complete: ${languages.length - Object.keys(missingTranslations).length}`);

if (Object.keys(missingTranslations).length > 0) {
  console.log('\n📝 Detailed missing translations:\n');

  Object.entries(missingTranslations).forEach(([lang, data]) => {
    if (data.error) {
      console.log(`${lang}: ERROR - ${data.error}`);
    } else if (data.missing) {
      console.log(`\n${lang} (${data.percentage || 0}% complete):`);
      data.missing.slice(0, 10).forEach(key => {
        console.log(`  - ${key}`);
      });
      if (data.missing.length > 10) {
        console.log(`  ... and ${data.missing.length - 10} more`);
      }
    }
  });

  // Write detailed report to file
  fs.writeFileSync(
    path.join(__dirname, 'visa-library-missing-translations.json'),
    JSON.stringify(missingTranslations, null, 2)
  );
  console.log('\n💾 Detailed report saved to: visa-library-missing-translations.json');
}

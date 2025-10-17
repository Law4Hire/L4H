const fs = require('fs');
const path = require('path');

// Brand translations for each language
const brandTranslations = {
  'ar-SA': { title: 'مساعدة الهجرة الأمريكية', subtitle: 'مدعوم من Law4Hire' },
  'bn-BD': { title: 'মার্কিন অভিবাসন সহায়তা', subtitle: 'Law4Hire দ্বারা চালিত' },
  'de-DE': { title: 'US-Einwanderungshilfe', subtitle: 'Betrieben von Law4Hire' },
  'en-US': { title: 'US Immigration Help', subtitle: 'Powered by Law4Hire' },
  'es-ES': { title: 'Ayuda de Inmigración de EE.UU.', subtitle: 'Impulsado por Law4Hire' },
  'fr-FR': { title: 'Aide à l\'Immigration aux États-Unis', subtitle: 'Propulsé par Law4Hire' },
  'hi-IN': { title: 'यूएस इमिग्रेशन सहायता', subtitle: 'Law4Hire द्वारा संचालित' },
  'id-ID': { title: 'Bantuan Imigrasi AS', subtitle: 'Didukung oleh Law4Hire' },
  'it-IT': { title: 'Aiuto per l\'Immigrazione negli Stati Uniti', subtitle: 'Fornito da Law4Hire' },
  'ja-JP': { title: '米国移民支援', subtitle: 'Law4Hireによる提供' },
  'ko-KR': { title: '미국 이민 도움', subtitle: 'Law4Hire 제공' },
  'mr-IN': { title: 'यूएस इमिग्रेशन मदत', subtitle: 'Law4Hire द्वारे समर्थित' },
  'pl-PL': { title: 'Pomoc Imigracyjna do USA', subtitle: 'Obsługiwane przez Law4Hire' },
  'pt-BR': { title: 'Ajuda de Imigração dos EUA', subtitle: 'Desenvolvido por Law4Hire' },
  'ru-RU': { title: 'Помощь по иммиграции в США', subtitle: 'При поддержке Law4Hire' },
  'ta-IN': { title: 'அமெரிக்க குடிவரவு உதவி', subtitle: 'Law4Hire மூலம் இயக்கப்படுகிறது' },
  'te-IN': { title: 'US ఇమ్మిగ్రేషన్ సహాయం', subtitle: 'Law4Hire ద్వారా అందించబడింది' },
  'tr-TR': { title: 'ABD Göçmenlik Yardımı', subtitle: 'Law4Hire tarafından desteklenmektedir' },
  'ur-PK': { title: 'امریکی امیگریشن مدد', subtitle: 'Law4Hire کی طرف سے فراہم کردہ' },
  'vi-VN': { title: 'Trợ Giúp Nhập Cư Hoa Kỳ', subtitle: 'Được hỗ trợ bởi Law4Hire' },
  'zh-CN': { title: '美国移民帮助', subtitle: '由Law4Hire提供支持' }
};

const localesDir = path.join(__dirname, 'web', 'l4h', 'public', 'locales');

// Process each language
Object.keys(brandTranslations).forEach(lang => {
  const commonFile = path.join(localesDir, lang, 'common.json');

  if (fs.existsSync(commonFile)) {
    try {
      const content = JSON.parse(fs.readFileSync(commonFile, 'utf8'));

      // Update brand section (remove existing if present, then add at beginning)
      const { brand, ...rest } = content;
      const updated = {
        brand: brandTranslations[lang],
        ...rest
      };

      fs.writeFileSync(commonFile, JSON.stringify(updated, null, 2), 'utf8');
      console.log(`✅ Added brand translations to ${lang}/common.json`);
    } catch (error) {
      console.error(`❌ Error processing ${lang}/common.json:`, error.message);
    }
  } else {
    console.warn(`⚠️  File not found: ${commonFile}`);
  }
});

console.log('\n✨ Done! Brand translations added to all language files.');

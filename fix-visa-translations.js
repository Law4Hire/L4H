const fs = require('fs');

// Read the current i18n file
const filePath = 'web/shared-ui/src/i18n-enhanced.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Visa Library translations for all languages
const visaTranslations = {
  'es-ES': {
    // Visa Library keys
    'visaLibrary.title': 'Biblioteca de Tipos de Visa de EE.UU.',
    'visaLibrary.description': 'Explora información completa sobre diferentes categorías de visa de EE.UU. Haz clic en cualquier tipo de visa para conocer los requisitos de elegibilidad, el proceso de solicitud y los beneficios.',
    'visaLibrary.loading': 'Cargando información de visas...',
    'visaLibrary.learnMore': 'Aprender Más',
    'visaLibrary.categories.nonimmigrant': 'Visas de No Inmigrante',
    'visaLibrary.categories.immigrant': 'Visas de Inmigrante',
    'visaLibrary.cta.title': '¿Necesitas ayuda eligiendo la visa correcta?',
    'visaLibrary.cta.description': 'Nuestros expertos en inmigración pueden ayudarte a determinar qué categoría de visa se adapta mejor a tu situación.',
    'visaLibrary.cta.button': 'Iniciar Tu Solicitud',
    'visaLibrary.modal.category': 'Categoría',
    'visaLibrary.modal.description': 'Descripción',
    'visaLibrary.modal.nextSteps': 'Siguientes Pasos',
    'visaLibrary.modal.readyToApply': '¿Listo para solicitar la visa {{code}}? Nuestros abogados de inmigración pueden guiarte a través de todo el proceso.',
    'visaLibrary.modal.applyFor': 'Solicitar Visa {{code}}',
    // Visa-specific translations (short names and descriptions for common ones)
    'visaLibrary.visas.B1.name': 'Visitante de Negocios',
    'visaLibrary.visas.B1.description': 'Visa de visitante de negocios para actividades comerciales temporales en Estados Unidos. Permite asistir a reuniones de negocios, conferencias y consultas con socios comerciales.',
    'visaLibrary.visas.B2.name': 'Visitante Turista',
    'visaLibrary.visas.B2.description': 'Visa de turista para placer, vacaciones o visitar familiares y amigos. Perfecta para turismo, tratamiento médico o eventos sociales con familiares y amigos.',
    'visaLibrary.visas.F1.name': 'Estudiante',
    'visaLibrary.visas.F1.description': 'Visa de estudiante para estudios académicos en instituciones estadounidenses acreditadas. Requerida para estudios académicos de tiempo completo en universidades, colegios, escuelas secundarias o institutos de idioma inglés.',
    'visaLibrary.visas.H1B.name': 'Trabajador de Ocupación Especializada',
    'visaLibrary.visas.H1B.description': 'Visa de ocupación especializada para profesionales con licenciatura o superior. Requerida para posiciones que demandan conocimiento especializado y habilidades.'
  },
  'fr-FR': {
    // Visa Library keys
    'visaLibrary.title': 'Bibliothèque des Types de Visa Américains',
    'visaLibrary.description': 'Explorez des informations complètes sur les différentes catégories de visa américains. Cliquez sur n\'importe quel type de visa pour connaître les exigences d\'admissibilité, le processus de demande et les avantages.',
    'visaLibrary.loading': 'Chargement des informations sur les visas...',
    'visaLibrary.learnMore': 'En Savoir Plus',
    'visaLibrary.categories.nonimmigrant': 'Visas de Non-Immigrant',
    'visaLibrary.categories.immigrant': 'Visas d\'Immigrant',
    'visaLibrary.cta.title': 'Besoin d\'aide pour choisir le bon visa?',
    'visaLibrary.cta.description': 'Nos experts en immigration peuvent vous aider à déterminer quelle catégorie de visa convient le mieux à votre situation.',
    'visaLibrary.cta.button': 'Commencer Votre Demande',
    'visaLibrary.modal.category': 'Catégorie',
    'visaLibrary.modal.description': 'Description',
    'visaLibrary.modal.nextSteps': 'Prochaines Étapes',
    'visaLibrary.modal.readyToApply': 'Prêt à faire une demande pour le visa {{code}}? Nos avocats d\'immigration peuvent vous guider tout au long du processus.',
    'visaLibrary.modal.applyFor': 'Demander le Visa {{code}}',
    // Basic visa translations
    'visaLibrary.visas.B1.name': 'Visiteur d\'Affaires',
    'visaLibrary.visas.B1.description': 'Visa de visiteur d\'affaires pour activités commerciales temporaires aux États-Unis.',
    'visaLibrary.visas.B2.name': 'Visiteur Touristique',
    'visaLibrary.visas.B2.description': 'Visa de touriste pour le plaisir, les vacances ou rendre visite à la famille et aux amis.',
    'visaLibrary.visas.F1.name': 'Étudiant',
    'visaLibrary.visas.F1.description': 'Visa d\'étudiant pour études académiques dans les institutions américaines accréditées.',
    'visaLibrary.visas.H1B.name': 'Travailleur d\'Occupation Spécialisée',
    'visaLibrary.visas.H1B.description': 'Visa d\'occupation spécialisée pour professionnels avec diplôme universitaire ou supérieur.'
  },
  'de-DE': {
    // Visa Library keys
    'visaLibrary.title': 'US-Visa-Typen Bibliothek',
    'visaLibrary.description': 'Erkunden Sie umfassende Informationen über verschiedene US-Visa-Kategorien. Klicken Sie auf einen beliebigen Visa-Typ, um mehr über Berechtigung, Antragsverfahren und Vorteile zu erfahren.',
    'visaLibrary.loading': 'Lade Visa-Informationen...',
    'visaLibrary.learnMore': 'Mehr Erfahren',
    'visaLibrary.categories.nonimmigrant': 'Nichteinwanderer-Visa',
    'visaLibrary.categories.immigrant': 'Einwanderer-Visa',
    'visaLibrary.cta.title': 'Brauchen Sie Hilfe bei der Auswahl des richtigen Visas?',
    'visaLibrary.cta.description': 'Unsere Einwanderungsexperten können Ihnen helfen zu bestimmen, welche Visa-Kategorie am besten zu Ihrer Situation passt.',
    'visaLibrary.cta.button': 'Ihren Antrag Starten',
    'visaLibrary.modal.category': 'Kategorie',
    'visaLibrary.modal.description': 'Beschreibung',
    'visaLibrary.modal.nextSteps': 'Nächste Schritte',
    'visaLibrary.modal.readyToApply': 'Bereit, das {{code}}-Visa zu beantragen? Unsere Einwanderungsanwälte können Sie durch den gesamten Prozess führen.',
    'visaLibrary.modal.applyFor': '{{code}}-Visa Beantragen',
    // Basic visa translations
    'visaLibrary.visas.B1.name': 'Geschäftsbesucher',
    'visaLibrary.visas.B1.description': 'Geschäftsbesucher-Visa für temporäre Geschäftstätigkeiten in den Vereinigten Staaten.',
    'visaLibrary.visas.B2.name': 'Tourist',
    'visaLibrary.visas.B2.description': 'Touristen-Visa für Vergnügen, Urlaub oder den Besuch von Familie und Freunden.',
    'visaLibrary.visas.F1.name': 'Student',
    'visaLibrary.visas.F1.description': 'Studenten-Visa für akademische Studien an akkreditierten US-Institutionen.',
    'visaLibrary.visas.H1B.name': 'Facharbeiter',
    'visaLibrary.visas.H1B.description': 'Spezialberufs-Visa für Fachkräfte mit Bachelor-Abschluss oder höher.'
  }
};

// Add basic visa translations to all other languages
const basicVisaTranslations = {
  'ar-SA': {
    'visaLibrary.title': 'مكتبة أنواع التأشيرات الأمريكية',
    'visaLibrary.description': 'استكشف معلومات شاملة حول فئات التأشيرات الأمريكية المختلفة.',
    'visaLibrary.loading': 'تحميل معلومات التأشيرة...',
    'visaLibrary.learnMore': 'تعلم المزيد',
    'visaLibrary.categories.nonimmigrant': 'تأشيرات غير المهاجرين',
    'visaLibrary.categories.immigrant': 'تأشيرات المهاجرين',
    'visaLibrary.cta.title': 'هل تحتاج مساعدة في اختيار التأشيرة المناسبة؟',
    'visaLibrary.cta.description': 'خبراؤنا في الهجرة يمكنهم مساعدتك.',
    'visaLibrary.cta.button': 'ابدأ طلبك',
    'visaLibrary.modal.category': 'الفئة',
    'visaLibrary.modal.description': 'الوصف',
    'visaLibrary.modal.nextSteps': 'الخطوات التالية',
    'visaLibrary.modal.readyToApply': 'مستعد للتقدم للحصول على تأشيرة {{code}}؟',
    'visaLibrary.modal.applyFor': 'تقدم للحصول على تأشيرة {{code}}'
  },
  'hi-IN': {
    'visaLibrary.title': 'अमेरिकी वीज़ा प्रकार पुस्तकालय',
    'visaLibrary.description': 'विभिन्न अमेरिकी वीज़ा श्रेणियों के बारे में व्यापक जानकारी प्राप्त करें।',
    'visaLibrary.loading': 'वीज़ा जानकारी लोड हो रही है...',
    'visaLibrary.learnMore': 'और जानें',
    'visaLibrary.categories.nonimmigrant': 'गैर-आप्रवासी वीज़ा',
    'visaLibrary.categories.immigrant': 'आप्रवासी वीज़ा',
    'visaLibrary.cta.title': 'सही वीज़ा चुनने में मदद चाहिए?',
    'visaLibrary.cta.description': 'हमारे आप्रवासन विशेषज्ञ आपकी सहायता कर सकते हैं।',
    'visaLibrary.cta.button': 'अपना आवेदन शुरू करें',
    'visaLibrary.modal.category': 'श्रेणी',
    'visaLibrary.modal.description': 'विवरण',
    'visaLibrary.modal.nextSteps': 'अगले कदम',
    'visaLibrary.modal.readyToApply': '{{code}} वीज़ा के लिए आवेदन करने के लिए तैयार?',
    'visaLibrary.modal.applyFor': '{{code}} वीज़ा के लिए आवेदन करें'
  }
};

// Add all translations
const allTranslations = { ...visaTranslations, ...basicVisaTranslations };

// Function to add translations to a specific language section
function addTranslationsToLanguage(content, langCode, translations) {
  const langRegex = new RegExp(`'${langCode}':\\s*\\{`, 'g');
  const matches = [...content.matchAll(langRegex)];
  
  if (matches.length === 0) {
    console.log(`Language ${langCode} not found`);
    return content;
  }
  
  // Find the main language section (not nested ones like nav or auth)
  let bestMatch = null;
  for (const match of matches) {
    const beforeMatch = content.substring(0, match.index);
    const lines = beforeMatch.split('\n');
    const lastLine = lines[lines.length - 1];
    
    // Check if this is a top-level language definition
    if (lastLine.trim() === '' || lastLine.includes('resources: {')) {
      bestMatch = match;
      break;
    }
  }
  
  if (!bestMatch) {
    console.log(`Could not find main section for ${langCode}`);
    return content;
  }
  
  const insertPos = bestMatch.index + bestMatch[0].length;
  
  // Find where the nav object starts to insert before it
  const afterLang = content.substring(insertPos);
  const navMatch = afterLang.match(/\s*nav:\s*\{/);
  
  if (navMatch) {
    const navPos = insertPos + navMatch.index;
    
    // Build translation string
    const translationLines = Object.entries(translations).map(([key, value]) => 
      `      '${key}': '${value.replace(/'/g, "\\'")}',`
    ).join('\n');
    
    const translationBlock = `\n      // Visa Library keys\n${translationLines}\n`;
    
    return content.substring(0, navPos) + translationBlock + content.substring(navPos);
  }
  
  return content;
}

console.log('Adding visa library translations to all languages...');

// Add translations for each language
let updatedContent = content;
Object.entries(allTranslations).forEach(([langCode, translations]) => {
  console.log(`Adding translations for ${langCode}...`);
  updatedContent = addTranslationsToLanguage(updatedContent, langCode, translations);
});

// Write the updated content back
fs.writeFileSync(filePath, updatedContent, 'utf8');
console.log('Visa library translations added successfully!');
const fs = require('fs');

// Read the current i18n file
const filePath = 'web/shared-ui/src/i18n-enhanced.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Define comprehensive visa library translations for all languages
const visaTranslations = {
  'es-ES': {
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
    'visaLibrary.visas.B1.name': 'Visitante de Negocios',
    'visaLibrary.visas.B1.description': 'Visa de visitante de negocios para actividades comerciales temporales en Estados Unidos.',
    'visaLibrary.visas.B2.name': 'Visitante Turista',
    'visaLibrary.visas.B2.description': 'Visa de turista para placer, vacaciones o visitar familiares y amigos.',
    'visaLibrary.visas.F1.name': 'Estudiante',
    'visaLibrary.visas.F1.description': 'Visa de estudiante para estudios académicos en instituciones estadounidenses acreditadas.',
    'visaLibrary.visas.H1B.name': 'Trabajador de Ocupación Especializada',
    'visaLibrary.visas.H1B.description': 'Visa de ocupación especializada para profesionales con licenciatura o superior.'
  },
  'bn-BD': {
    'visaLibrary.title': 'মার্কিন ভিসার প্রকারভেদ লাইব্রেরি',
    'visaLibrary.description': 'বিভিন্ন মার্কিন ভিসা বিভাগ সম্পর্কে বিস্তৃত তথ্য অন্বেষণ করুন।',
    'visaLibrary.loading': 'ভিসা তথ্য লোড হচ্ছে...',
    'visaLibrary.learnMore': 'আরও জানুন',
    'visaLibrary.categories.nonimmigrant': 'অ-অভিবাসী ভিসা',
    'visaLibrary.categories.immigrant': 'অভিবাসী ভিসা',
    'visaLibrary.cta.title': 'সঠিক ভিসা বেছে নিতে সাহায্য দরকার?',
    'visaLibrary.cta.description': 'আমাদের ইমিগ্রেশন বিশেষজ্ঞরা আপনাকে সাহায্য করতে পারেন।',
    'visaLibrary.cta.button': 'আপনার আবেদন শুরু করুন',
    'visaLibrary.modal.category': 'বিভাগ',
    'visaLibrary.modal.description': 'বিবরণ',
    'visaLibrary.modal.nextSteps': 'পরবর্তী পদক্ষেপ',
    'visaLibrary.modal.readyToApply': '{{code}} ভিসার জন্য আবেদন করতে প্রস্তুত?',
    'visaLibrary.modal.applyFor': '{{code}} ভিসার জন্য আবেদন করুন'
  },
  'id-ID': {
    'visaLibrary.title': 'Perpustakaan Jenis Visa Amerika Serikat',
    'visaLibrary.description': 'Jelajahi informasi komprehensif tentang berbagai kategori visa AS.',
    'visaLibrary.loading': 'Memuat informasi visa...',
    'visaLibrary.learnMore': 'Pelajari Lebih Lanjut',
    'visaLibrary.categories.nonimmigrant': 'Visa Non-Imigran',
    'visaLibrary.categories.immigrant': 'Visa Imigran',
    'visaLibrary.cta.title': 'Butuh bantuan memilih visa yang tepat?',
    'visaLibrary.cta.description': 'Ahli imigrasi kami dapat membantu Anda.',
    'visaLibrary.cta.button': 'Mulai Aplikasi Anda',
    'visaLibrary.modal.category': 'Kategori',
    'visaLibrary.modal.description': 'Deskripsi',
    'visaLibrary.modal.nextSteps': 'Langkah Selanjutnya',
    'visaLibrary.modal.readyToApply': 'Siap mengajukan visa {{code}}?',
    'visaLibrary.modal.applyFor': 'Ajukan Visa {{code}}'
  },
  'it-IT': {
    'visaLibrary.title': 'Biblioteca Tipi di Visto Americani',
    'visaLibrary.description': 'Esplora informazioni complete sulle diverse categorie di visto americane.',
    'visaLibrary.loading': 'Caricamento informazioni visto...',
    'visaLibrary.learnMore': 'Scopri di Più',
    'visaLibrary.categories.nonimmigrant': 'Visti Non-Immigranti',
    'visaLibrary.categories.immigrant': 'Visti Immigranti',
    'visaLibrary.cta.title': 'Hai bisogno di aiuto per scegliere il visto giusto?',
    'visaLibrary.cta.description': 'I nostri esperti di immigrazione possono aiutarti.',
    'visaLibrary.cta.button': 'Inizia la Tua Domanda',
    'visaLibrary.modal.category': 'Categoria',
    'visaLibrary.modal.description': 'Descrizione',
    'visaLibrary.modal.nextSteps': 'Prossimi Passi',
    'visaLibrary.modal.readyToApply': 'Pronto a fare domanda per il visto {{code}}?',
    'visaLibrary.modal.applyFor': 'Fai Domanda per il Visto {{code}}'
  },
  'ja-JP': {
    'visaLibrary.title': 'アメリカビザタイプライブラリ',
    'visaLibrary.description': 'アメリカのビザカテゴリーに関する包括的な情報をご覧ください。',
    'visaLibrary.loading': 'ビザ情報を読み込んでいます...',
    'visaLibrary.learnMore': '詳細を見る',
    'visaLibrary.categories.nonimmigrant': '非移民ビザ',
    'visaLibrary.categories.immigrant': '移民ビザ',
    'visaLibrary.cta.title': '適切なビザの選択にお困りですか？',
    'visaLibrary.cta.description': '移民専門家がお手伝いします。',
    'visaLibrary.cta.button': 'アプリケーションを開始',
    'visaLibrary.modal.category': 'カテゴリー',
    'visaLibrary.modal.description': '説明',
    'visaLibrary.modal.nextSteps': '次のステップ',
    'visaLibrary.modal.readyToApply': '{{code}}ビザの申請準備はできましたか？',
    'visaLibrary.modal.applyFor': '{{code}}ビザを申請する'
  },
  'ko-KR': {
    'visaLibrary.title': '미국 비자 종류 라이브러리',
    'visaLibrary.description': '다양한 미국 비자 카테고리에 대한 포괄적인 정보를 탐색하세요.',
    'visaLibrary.loading': '비자 정보를 로딩 중...',
    'visaLibrary.learnMore': '더 알아보기',
    'visaLibrary.categories.nonimmigrant': '비이민 비자',
    'visaLibrary.categories.immigrant': '이민 비자',
    'visaLibrary.cta.title': '올바른 비자 선택에 도움이 필요하신가요?',
    'visaLibrary.cta.description': '저희 이민 전문가들이 도와드릴 수 있습니다.',
    'visaLibrary.cta.button': '신청 시작하기',
    'visaLibrary.modal.category': '카테고리',
    'visaLibrary.modal.description': '설명',
    'visaLibrary.modal.nextSteps': '다음 단계',
    'visaLibrary.modal.readyToApply': '{{code}} 비자 신청 준비가 되셨나요?',
    'visaLibrary.modal.applyFor': '{{code}} 비자 신청하기'
  },
  'mr-IN': {
    'visaLibrary.title': 'अमेरिकन व्हिसा प्रकार ग्रंथालय',
    'visaLibrary.description': 'विविध अमेरिकन व्हिसा श्रेणींबद्दल सर्वसमावेशक माहिती एक्सप्लोर करा.',
    'visaLibrary.loading': 'व्हिसा माहिती लोड होत आहे...',
    'visaLibrary.learnMore': 'अधिक जाणून घ्या',
    'visaLibrary.categories.nonimmigrant': 'गैर-इमिग्रंट व्हिसा',
    'visaLibrary.categories.immigrant': 'इमिग्रंट व्हिसा',
    'visaLibrary.cta.title': 'योग्य व्हिसा निवडण्यासाठी मदत हवी आहे?',
    'visaLibrary.cta.description': 'आमचे इमिग्रेशन तज्ञ तुम्हाला मदत करू शकतात.',
    'visaLibrary.cta.button': 'तुमचा अर्ज सुरू करा',
    'visaLibrary.modal.category': 'श्रेणी',
    'visaLibrary.modal.description': 'वर्णन',
    'visaLibrary.modal.nextSteps': 'पुढची पायरी',
    'visaLibrary.modal.readyToApply': '{{code}} व्हिसासाठी अर्ज करण्यास तयार आहात?',
    'visaLibrary.modal.applyFor': '{{code}} व्हिसासाठी अर्ज करा'
  },
  'pl-PL': {
    'visaLibrary.title': 'Biblioteka Typów Wiz Amerykańskich',
    'visaLibrary.description': 'Poznaj kompleksowe informacje o różnych kategoriach wiz amerykańskich.',
    'visaLibrary.loading': 'Ładowanie informacji o wizach...',
    'visaLibrary.learnMore': 'Dowiedz się więcej',
    'visaLibrary.categories.nonimmigrant': 'Wizy nieimigracyjne',
    'visaLibrary.categories.immigrant': 'Wizy imigracyjne',
    'visaLibrary.cta.title': 'Potrzebujesz pomocy w wyborze odpowiedniej wizy?',
    'visaLibrary.cta.description': 'Nasi eksperci imigracyjni mogą Ci pomóc.',
    'visaLibrary.cta.button': 'Rozpocznij aplikację',
    'visaLibrary.modal.category': 'Kategoria',
    'visaLibrary.modal.description': 'Opis',
    'visaLibrary.modal.nextSteps': 'Następne kroki',
    'visaLibrary.modal.readyToApply': 'Gotowy do złożenia wniosku o wizę {{code}}?',
    'visaLibrary.modal.applyFor': 'Złóż wniosek o wizę {{code}}'
  },
  'pt-PT': {
    'visaLibrary.title': 'Biblioteca de Tipos de Visto Americanos',
    'visaLibrary.description': 'Explore informações abrangentes sobre diferentes categorias de visto americano.',
    'visaLibrary.loading': 'Carregando informações de visto...',
    'visaLibrary.learnMore': 'Saiba Mais',
    'visaLibrary.categories.nonimmigrant': 'Vistos de Não-Imigrante',
    'visaLibrary.categories.immigrant': 'Vistos de Imigrante',
    'visaLibrary.cta.title': 'Precisa de ajuda para escolher o visto certo?',
    'visaLibrary.cta.description': 'Os nossos especialistas em imigração podem ajudá-lo.',
    'visaLibrary.cta.button': 'Iniciar Candidatura',
    'visaLibrary.modal.category': 'Categoria',
    'visaLibrary.modal.description': 'Descrição',
    'visaLibrary.modal.nextSteps': 'Próximos Passos',
    'visaLibrary.modal.readyToApply': 'Pronto para candidatar-se ao visto {{code}}?',
    'visaLibrary.modal.applyFor': 'Candidatar-se ao Visto {{code}}'
  },
  'ru-RU': {
    'visaLibrary.title': 'Библиотека типов американских виз',
    'visaLibrary.description': 'Изучите исчерпывающую информацию о различных категориях американских виз.',
    'visaLibrary.loading': 'Загрузка информации о визах...',
    'visaLibrary.learnMore': 'Узнать больше',
    'visaLibrary.categories.nonimmigrant': 'Неиммиграционные визы',
    'visaLibrary.categories.immigrant': 'Иммиграционные визы',
    'visaLibrary.cta.title': 'Нужна помощь в выборе правильной визы?',
    'visaLibrary.cta.description': 'Наши эксперты по иммиграции могут помочь вам.',
    'visaLibrary.cta.button': 'Начать заявку',
    'visaLibrary.modal.category': 'Категория',
    'visaLibrary.modal.description': 'Описание',
    'visaLibrary.modal.nextSteps': 'Следующие шаги',
    'visaLibrary.modal.readyToApply': 'Готовы подать заявку на визу {{code}}?',
    'visaLibrary.modal.applyFor': 'Подать заявку на визу {{code}}'
  },
  'ta-IN': {
    'visaLibrary.title': 'அமெரிக்க வீசா வகைகள் நூலகம்',
    'visaLibrary.description': 'பல்வேறு அமெரிக்க வீசா பிரிவுகள் பற்றிய விரிவான தகவலை அறியுங்கள்.',
    'visaLibrary.loading': 'வீசா தகவல்களை ஏற்றுகிறது...',
    'visaLibrary.learnMore': 'மேலும் அறிக',
    'visaLibrary.categories.nonimmigrant': 'குடியேறாத வீசா',
    'visaLibrary.categories.immigrant': 'குடியேறும் வீசா',
    'visaLibrary.cta.title': 'சரியான வீசா தேர்வு செய்ய உதவி தேவையா?',
    'visaLibrary.cta.description': 'எங்கள் குடியேற்ற நிபுணர்கள் உங்களுக்கு உதவ முடியும்.',
    'visaLibrary.cta.button': 'உங்கள் விண்ணப்பத்தை தொடங்குங்கள்',
    'visaLibrary.modal.category': 'வகை',
    'visaLibrary.modal.description': 'விளக்கம்',
    'visaLibrary.modal.nextSteps': 'அடுத்த படிகள்',
    'visaLibrary.modal.readyToApply': '{{code}} வீசாவிற்கு விண்ணப்பிக்க தயாராக இருக்கிறீர்களா?',
    'visaLibrary.modal.applyFor': '{{code}} வீசாவிற்கு விண்ணப்பிக்கவும்'
  },
  'te-IN': {
    'visaLibrary.title': 'అమెరికన్ వీసా రకాల లైబ్రరీ',
    'visaLibrary.description': 'వివిధ అమెరికన్ వీసా వర్గాల గురించి సమగ్ర సమాచారాన్ని అన్వేషించండి.',
    'visaLibrary.loading': 'వీసా సమాచారాన్ని లోడ్ చేస్తోంది...',
    'visaLibrary.learnMore': 'మరింత తెలుసుకోండి',
    'visaLibrary.categories.nonimmigrant': 'నాన్-ఇమ్మిగ్రంట్ వీసాలు',
    'visaLibrary.categories.immigrant': 'ఇమ్మిగ్రంట్ వీసాలు',
    'visaLibrary.cta.title': 'సరైన వీసా ఎంచుకోవడంలో సహాయం కావాలా?',
    'visaLibrary.cta.description': 'మా ఇమ్మిగ్రేషన్ నిపుణులు మీకు సహాయం చేయగలరు.',
    'visaLibrary.cta.button': 'మీ అప్లికేషన్ ప్రారంభించండి',
    'visaLibrary.modal.category': 'వర్గం',
    'visaLibrary.modal.description': 'వివరణ',
    'visaLibrary.modal.nextSteps': 'తదుపరి దశలు',
    'visaLibrary.modal.readyToApply': '{{code}} వీసా కోసం దరఖాస్తు చేసుకోవడానికి సిద్ధంగా ఉన్నారా?',
    'visaLibrary.modal.applyFor': '{{code}} వీసా కోసం దరఖాస్తు చేయండి'
  },
  'tr-TR': {
    'visaLibrary.title': 'Amerikan Vize Türleri Kütüphanesi',
    'visaLibrary.description': 'Farklı Amerikan vize kategorileri hakkında kapsamlı bilgileri keşfedin.',
    'visaLibrary.loading': 'Vize bilgileri yükleniyor...',
    'visaLibrary.learnMore': 'Daha Fazla Bilgi',
    'visaLibrary.categories.nonimmigrant': 'Göçmen Olmayan Vizeler',
    'visaLibrary.categories.immigrant': 'Göçmen Vizeleri',
    'visaLibrary.cta.title': 'Doğru vizeyi seçmek için yardıma mı ihtiyacınız var?',
    'visaLibrary.cta.description': 'Göçmenlik uzmanlarımız size yardımcı olabilir.',
    'visaLibrary.cta.button': 'Başvurunuzu Başlatın',
    'visaLibrary.modal.category': 'Kategori',
    'visaLibrary.modal.description': 'Açıklama',
    'visaLibrary.modal.nextSteps': 'Sonraki Adımlar',
    'visaLibrary.modal.readyToApply': '{{code}} vizesi için başvurmaya hazır mısınız?',
    'visaLibrary.modal.applyFor': '{{code}} Vizesi İçin Başvur'
  },
  'ur-PK': {
    'visaLibrary.title': 'امریکی ویزا اقسام کی لائبریری',
    'visaLibrary.description': 'مختلف امریکی ویزا کیٹگریز کے بارے میں تفصیلی معلومات حاصل کریں۔',
    'visaLibrary.loading': 'ویزا کی معلومات لوڈ ہو رہی ہیں...',
    'visaLibrary.learnMore': 'مزید جانیں',
    'visaLibrary.categories.nonimmigrant': 'غیر امیگرنٹ ویزے',
    'visaLibrary.categories.immigrant': 'امیگرنٹ ویزے',
    'visaLibrary.cta.title': 'صحیح ویزا منتخب کرنے میں مدد درکار ہے؟',
    'visaLibrary.cta.description': 'ہمارے امیگریشن ماہرین آپ کی مدد کر سکتے ہیں۔',
    'visaLibrary.cta.button': 'اپنی درخواست شروع کریں',
    'visaLibrary.modal.category': 'کیٹگری',
    'visaLibrary.modal.description': 'تفصیل',
    'visaLibrary.modal.nextSteps': 'اگلے قدم',
    'visaLibrary.modal.readyToApply': '{{code}} ویزا کے لیے درخواست دینے کے لیے تیار ہیں؟',
    'visaLibrary.modal.applyFor': '{{code}} ویزا کے لیے درخواست دیں'
  },
  'vi-VN': {
    'visaLibrary.title': 'Thư viện các loại Visa Mỹ',
    'visaLibrary.description': 'Khám phá thông tin toàn diện về các danh mục visa Mỹ khác nhau.',
    'visaLibrary.loading': 'Đang tải thông tin visa...',
    'visaLibrary.learnMore': 'Tìm hiểu thêm',
    'visaLibrary.categories.nonimmigrant': 'Visa không di trú',
    'visaLibrary.categories.immigrant': 'Visa di trú',
    'visaLibrary.cta.title': 'Cần giúp đỡ để chọn visa phù hợp?',
    'visaLibrary.cta.description': 'Các chuyên gia nhập cư của chúng tôi có thể giúp bạn.',
    'visaLibrary.cta.button': 'Bắt đầu đơn của bạn',
    'visaLibrary.modal.category': 'Danh mục',
    'visaLibrary.modal.description': 'Mô tả',
    'visaLibrary.modal.nextSteps': 'Các bước tiếp theo',
    'visaLibrary.modal.readyToApply': 'Sẵn sàng nộp đơn xin visa {{code}}?',
    'visaLibrary.modal.applyFor': 'Nộp đơn xin Visa {{code}}'
  },
  'zh-CN': {
    'visaLibrary.title': '美国签证类型库',
    'visaLibrary.description': '探索有关不同美国签证类别的全面信息。',
    'visaLibrary.loading': '正在加载签证信息...',
    'visaLibrary.learnMore': '了解更多',
    'visaLibrary.categories.nonimmigrant': '非移民签证',
    'visaLibrary.categories.immigrant': '移民签证',
    'visaLibrary.cta.title': '需要帮助选择正确的签证吗？',
    'visaLibrary.cta.description': '我们的移民专家可以为您提供帮助。',
    'visaLibrary.cta.button': '开始申请',
    'visaLibrary.modal.category': '类别',
    'visaLibrary.modal.description': '描述',
    'visaLibrary.modal.nextSteps': '下一步',
    'visaLibrary.modal.readyToApply': '准备申请{{code}}签证？',
    'visaLibrary.modal.applyFor': '申请{{code}}签证'
  }
};

// Function to add translations to a specific language section
function addTranslationsToLanguage(content, langCode, translations) {
  // Look for the pattern: language section start
  const langPattern = new RegExp(`('${langCode}':\\s*\\{[\\s\\S]*?)(\\s+nav:\\s*\\{)`, 'g');
  const match = langPattern.exec(content);
  
  if (!match) {
    console.log(`Could not find pattern for ${langCode}`);
    return content;
  }
  
  // Build translation string
  const translationLines = Object.entries(translations).map(([key, value]) => 
    `      '${key}': '${value.replace(/'/g, "\\'")}',`
  ).join('\n');
  
  const translationBlock = `\n      // Visa Library keys\n${translationLines}\n`;
  
  // Insert before the nav section
  const beforeNav = match[1];
  const navSection = match[2];
  const replacement = beforeNav + translationBlock + navSection;
  
  return content.replace(match[0], replacement);
}

console.log('Adding visa library translations to all missing languages...');

// Get list of languages that are missing visa library translations
const missingLanguages = [];
Object.keys(visaTranslations).forEach(langCode => {
  if (!content.includes(`'visaLibrary.title'`) || !content.includes(`${langCode}`) || !content.includes(`visaLibrary.title': '`)) {
    missingLanguages.push(langCode);
  }
});

// Add translations for each missing language
let updatedContent = content;
Object.entries(visaTranslations).forEach(([langCode, translations]) => {
  console.log(`Adding translations for ${langCode}...`);
  updatedContent = addTranslationsToLanguage(updatedContent, langCode, translations);
});

// Write the updated content back
fs.writeFileSync(filePath, updatedContent, 'utf8');
console.log('All visa library translations added successfully!');
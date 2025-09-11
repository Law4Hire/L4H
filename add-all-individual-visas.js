const fs = require('fs');

// Read the current i18n file
const filePath = 'web/shared-ui/src/i18n-enhanced.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Define individual visa translations for all languages that are missing them
const individualVisaTranslations = {
  'ar-SA': {
    'visaLibrary.visas.B1.name': 'زائر أعمال',
    'visaLibrary.visas.B1.description': 'تأشيرة زائر أعمال للأنشطة التجارية المؤقتة في الولايات المتحدة.',
    'visaLibrary.visas.B2.name': 'زائر سياحي',
    'visaLibrary.visas.B2.description': 'تأشيرة سياحية للمتعة والإجازة أو زيارة الأسرة والأصدقاء.',
    'visaLibrary.visas.F1.name': 'طالب',
    'visaLibrary.visas.F1.description': 'تأشيرة طالب للدراسات الأكاديمية في المؤسسات الأمريكية المعتمدة.',
    'visaLibrary.visas.F2.name': 'معال طالب',
    'visaLibrary.visas.F2.description': 'تأشيرة معال للأزواج والأطفال غير المتزوجين تحت 21 سنة من طلاب F1.',
    'visaLibrary.visas.H1B.name': 'عامل في مهنة متخصصة',
    'visaLibrary.visas.H1B.description': 'تأشيرة مهنة متخصصة للمهنيين الحاصلين على درجة البكالوريوس أو أعلى.',
    'visaLibrary.visas.H2A.name': 'عامل زراعي',
    'visaLibrary.visas.H2A.description': 'تأشيرة عامل زراعي مؤقت للعمالة الزراعية الموسمية.',
    'visaLibrary.visas.H4.name': 'معال H1B',
    'visaLibrary.visas.H4.description': 'تأشيرة معال للأزواج والأطفال غير المتزوجين تحت 21 سنة من حاملي تأشيرة H1B.',
    'visaLibrary.visas.J1.name': 'زائر تبادل',
    'visaLibrary.visas.J1.description': 'تأشيرة زائر تبادل لبرامج التبادل الثقافي.',
    'visaLibrary.visas.L1A.name': 'منقول داخل الشركة - تنفيذي',
    'visaLibrary.visas.L1A.description': 'تأشيرة نقل داخل الشركة للمديرين والتنفيذيين.',
    'visaLibrary.visas.L1B.name': 'منقول داخل الشركة - متخصص',
    'visaLibrary.visas.L1B.description': 'تأشيرة نقل داخل الشركة للموظفين ذوي المعرفة المتخصصة.',
    'visaLibrary.visas.L2.name': 'معال L1',
    'visaLibrary.visas.L2.description': 'تأشيرة معال للأزواج والأطفال غير المتزوجين تحت 21 سنة من حاملي تأشيرة L1.',
    'visaLibrary.visas.O1.name': 'قدرة استثنائية',
    'visaLibrary.visas.O1.description': 'تأشيرة قدرة استثنائية للأفراد ذوي المهارات الاستثنائية في العلوم أو الفنون أو التعليم أو الأعمال أو الألعاب الرياضية.',
    'visaLibrary.visas.TN.name': 'مهني نافتا',
    'visaLibrary.visas.TN.description': 'تأشيرة مهني نافتا للمواطنين الكنديين والمكسيكيين.',
    'visaLibrary.visas.E2.name': 'مستثمر بمعاهدة',
    'visaLibrary.visas.E2.description': 'تأشيرة مستثمر بمعاهدة للاستثمار الكبير في الأعمال الأمريكية.',
    'visaLibrary.visas.EB1.name': 'عمال أولويات',
    'visaLibrary.visas.EB1.description': 'بطاقة خضراء قائمة على العمل للأولوية الأولى للعمال ذوي الأولوية.',
    'visaLibrary.visas.EB2.name': 'مهنيون بدرجة متقدمة',
    'visaLibrary.visas.EB2.description': 'بطاقة خضراء قائمة على العمل للأولوية الثانية للمهنيين بدرجة متقدمة.',
    'visaLibrary.visas.EB3.name': 'عمال مهرة',
    'visaLibrary.visas.EB3.description': 'بطاقة خضراء قائمة على العمل للأولوية الثالثة للعمال المهرة.',
    'visaLibrary.visas.EB4.name': 'مهاجرون خاصون',
    'visaLibrary.visas.EB4.description': 'بطاقة خضراء قائمة على العمل للأولوية الرابعة للمهاجرين الخاصين.',
    'visaLibrary.visas.EB5.name': 'مستثمرون مهاجرون',
    'visaLibrary.visas.EB5.description': 'بطاقة خضراء قائمة على العمل للأولوية الخامسة للمستثمرين.'
  },
  'bn-BD': {
    'visaLibrary.visas.B1.name': 'ব্যবসায়িক দর্শনার্থী',
    'visaLibrary.visas.B1.description': 'মার্কিন যুক্তরাষ্ট্রে অস্থায়ী ব্যবসায়িক কার্যকলাপের জন্য ব্যবসায়িক দর্শনার্থী ভিসা।',
    'visaLibrary.visas.B2.name': 'পর্যটক দর্শনার্থী',
    'visaLibrary.visas.B2.description': 'আনন্দ, ছুটি বা পরিবার ও বন্ধুদের সাথে দেখা করার জন্য পর্যটন ভিসা।',
    'visaLibrary.visas.F1.name': 'ছাত্র',
    'visaLibrary.visas.F1.description': 'স্বীকৃত মার্কিন প্রতিষ্ঠানে একাডেমিক অধ্যয়নের জন্য ছাত্র ভিসা।',
    'visaLibrary.visas.H1B.name': 'বিশেষত্ব পেশা কর্মী',
    'visaLibrary.visas.H1B.description': 'স্নাতক ডিগ্রি বা উচ্চতর যোগ্যতাসম্পন্ন পেশাদারদের জন্য বিশেষত্ব পেশা ভিসা।'
  },
  'hi-IN': {
    'visaLibrary.visas.B1.name': 'व्यापारिक आगंतुक',
    'visaLibrary.visas.B1.description': 'संयुक्त राज्य अमेरिका में अस्थायी व्यापारिक गतिविधियों के लिए व्यापारिक आगंतुक वीज़ा।',
    'visaLibrary.visas.B2.name': 'पर्यटक आगंतुक',
    'visaLibrary.visas.B2.description': 'आनंद, छुट्टी या परिवार और मित्रों से मिलने के लिए पर्यटक वीज़ा।',
    'visaLibrary.visas.F1.name': 'छात्र',
    'visaLibrary.visas.F1.description': 'मान्यता प्राप्त अमेरिकी संस्थानों में शैक्षणिक अध्ययन के लिए छात्र वीज़ा।',
    'visaLibrary.visas.H1B.name': 'विशेषता व्यवसाय कार्यकर्ता',
    'visaLibrary.visas.H1B.description': 'स्नातक डिग्री या उच्चतर योग्यता वाले पेशेवरों के लिए विशेषता व्यवसाय वीज़ा।'
  },
  'id-ID': {
    'visaLibrary.visas.B1.name': 'Pengunjung Bisnis',
    'visaLibrary.visas.B1.description': 'Visa pengunjung bisnis untuk aktivitas bisnis sementara di Amerika Serikat.',
    'visaLibrary.visas.B2.name': 'Pengunjung Wisata',
    'visaLibrary.visas.B2.description': 'Visa wisata untuk kesenangan, liburan, atau mengunjungi keluarga dan teman.',
    'visaLibrary.visas.F1.name': 'Pelajar',
    'visaLibrary.visas.F1.description': 'Visa pelajar untuk studi akademik di institusi Amerika yang terakreditasi.',
    'visaLibrary.visas.H1B.name': 'Pekerja Okupasi Khusus',
    'visaLibrary.visas.H1B.description': 'Visa okupasi khusus untuk profesional dengan gelar sarjana atau lebih tinggi.'
  },
  'it-IT': {
    'visaLibrary.visas.B1.name': 'Visitatore d\'Affari',
    'visaLibrary.visas.B1.description': 'Visto per visitatori d\'affari per attività commerciali temporanee negli Stati Uniti.',
    'visaLibrary.visas.B2.name': 'Visitatore Turistico',
    'visaLibrary.visas.B2.description': 'Visto turistico per piacere, vacanze o visite a famiglia e amici.',
    'visaLibrary.visas.F1.name': 'Studente',
    'visaLibrary.visas.F1.description': 'Visto per studenti per studi accademici in istituzioni americane accreditate.',
    'visaLibrary.visas.H1B.name': 'Lavoratore di Occupazione Specializzata',
    'visaLibrary.visas.H1B.description': 'Visto per occupazione specializzata per professionisti con laurea o superiore.'
  },
  'ja-JP': {
    'visaLibrary.visas.B1.name': 'ビジネス訪問者',
    'visaLibrary.visas.B1.description': 'アメリカでの一時的な商用活動のためのビジネス訪問者ビザ。',
    'visaLibrary.visas.B2.name': '観光訪問者',
    'visaLibrary.visas.B2.description': '娯楽、休暇、または家族や友人の訪問のための観光ビザ。',
    'visaLibrary.visas.F1.name': '学生',
    'visaLibrary.visas.F1.description': '認定されたアメリカの教育機関での学術研究のための学生ビザ。',
    'visaLibrary.visas.H1B.name': '専門職業労働者',
    'visaLibrary.visas.H1B.description': '学士号以上を持つ専門家のための専門職業ビザ。'
  },
  'ko-KR': {
    'visaLibrary.visas.B1.name': '사업 방문자',
    'visaLibrary.visas.B1.description': '미국에서의 임시 사업 활동을 위한 사업 방문자 비자.',
    'visaLibrary.visas.B2.name': '관광 방문자',
    'visaLibrary.visas.B2.description': '오락, 휴가 또는 가족과 친구 방문을 위한 관광 비자.',
    'visaLibrary.visas.F1.name': '학생',
    'visaLibrary.visas.F1.description': '인증된 미국 교육기관에서의 학업을 위한 학생 비자.',
    'visaLibrary.visas.H1B.name': '전문직 근로자',
    'visaLibrary.visas.H1B.description': '학사 학위 이상을 가진 전문가를 위한 전문직 비자.'
  },
  'mr-IN': {
    'visaLibrary.visas.B1.name': 'व्यावसायिक भेटीदार',
    'visaLibrary.visas.B1.description': 'युनायटेड स्टेट्समध्ये तात्पुरत्या व्यावसायिक क्रियाकलापांसाठी व्यावसायिक भेटीदार व्हिसा.',
    'visaLibrary.visas.B2.name': 'पर्यटक भेटीदार',
    'visaLibrary.visas.B2.description': 'आनंद, सुट्टी किंवा कुटुंब आणि मित्रांना भेटण्यासाठी पर्यटक व्हिसा.',
    'visaLibrary.visas.F1.name': 'विद्यार्थी',
    'visaLibrary.visas.F1.description': 'मान्यताप्राप्त अमेरिकन संस्थांमध्ये शैक्षणिक अभ्यासासाठी विद्यार्थी व्हिसा.',
    'visaLibrary.visas.H1B.name': 'विशेष व्यवसाय कामगार',
    'visaLibrary.visas.H1B.description': 'पदवी किंवा उच्च पात्रता असलेल्या व्यावसायिकांसाठी विशेष व्यवसाय व्हिसा.'
  },
  'pl-PL': {
    'visaLibrary.visas.B1.name': 'Odwiedzający Biznesowy',
    'visaLibrary.visas.B1.description': 'Wiza dla odwiedzających biznesowych na tymczasowe działania biznesowe w Stanach Zjednoczonych.',
    'visaLibrary.visas.B2.name': 'Odwiedzający Turystyczny',
    'visaLibrary.visas.B2.description': 'Wiza turystyczna na przyjemność, wakacje lub odwiedziny rodziny i przyjaciół.',
    'visaLibrary.visas.F1.name': 'Student',
    'visaLibrary.visas.F1.description': 'Wiza studencka na studia akademickie w akredytowanych amerykańskich instytucjach.',
    'visaLibrary.visas.H1B.name': 'Pracownik Specjalistyczny',
    'visaLibrary.visas.H1B.description': 'Wiza specjalistyczna dla profesjonalistów z tytułem licencjata lub wyższym.'
  },
  'pt-PT': {
    'visaLibrary.visas.B1.name': 'Visitante de Negócios',
    'visaLibrary.visas.B1.description': 'Visto de visitante de negócios para atividades comerciais temporárias nos Estados Unidos.',
    'visaLibrary.visas.B2.name': 'Visitante Turístico',
    'visaLibrary.visas.B2.description': 'Visto turístico para prazer, férias ou visitar família e amigos.',
    'visaLibrary.visas.F1.name': 'Estudante',
    'visaLibrary.visas.F1.description': 'Visto de estudante para estudos académicos em instituições americanas credenciadas.',
    'visaLibrary.visas.H1B.name': 'Trabalhador de Ocupação Especializada',
    'visaLibrary.visas.H1B.description': 'Visto de ocupação especializada para profissionais com licenciatura ou superior.'
  },
  'ru-RU': {
    'visaLibrary.visas.B1.name': 'Деловой посетитель',
    'visaLibrary.visas.B1.description': 'Виза делового посетителя для временной коммерческой деятельности в Соединенных Штатах.',
    'visaLibrary.visas.B2.name': 'Туристический посетитель',
    'visaLibrary.visas.B2.description': 'Туристическая виза для удовольствия, отпуска или посещения семьи и друзей.',
    'visaLibrary.visas.F1.name': 'Студент',
    'visaLibrary.visas.F1.description': 'Студенческая виза для академических исследований в аккредитованных американских учреждениях.',
    'visaLibrary.visas.H1B.name': 'Работник специальности',
    'visaLibrary.visas.H1B.description': 'Виза специальности для профессионалов со степенью бакалавра или выше.'
  },
  'ta-IN': {
    'visaLibrary.visas.B1.name': 'வணிக பார்வையாளர்',
    'visaLibrary.visas.B1.description': 'அமெரிக்காவில் தற்காலிக வணிக செயல்பாடுகளுக்கான வணிக பார்வையாளர் வீசா.',
    'visaLibrary.visas.B2.name': 'சுற்றுலா பார்வையாளர்',
    'visaLibrary.visas.B2.description': 'மகிழ்ச்சி, விடுமுறை அல்லது குடும்பம் மற்றும் நண்பர்களைப் பார்க்க சுற்றுலா வீசா.',
    'visaLibrary.visas.F1.name': 'மாணவர்',
    'visaLibrary.visas.F1.description': 'அங்கீகரிக்கப்பட்ட அமெரிக்க நிறுவனங்களில் கல்வி ஆய்வுகளுக்கான மாணவர் வீசா.',
    'visaLibrary.visas.H1B.name': 'சிறப்பு தொழில் தொழிலாளி',
    'visaLibrary.visas.H1B.description': 'இளங்கலை பட்டம் அல்லது அதற்கு மேல் உள்ள தொழில் வல்லுநர்களுக்கான சிறப்பு தொழில் வீசா.'
  },
  'te-IN': {
    'visaLibrary.visas.B1.name': 'వ్యాపార సందర్శకుడు',
    'visaLibrary.visas.B1.description': 'యునైటెడ్ స్టేట్స్‌లో తాత్కాలిక వ్యాపార కార్యకలాపాల కోసం వ్యాపార సందర్శకుడి వీసా.',
    'visaLibrary.visas.B2.name': 'పర్యాటక సందర్శకుడు',
    'visaLibrary.visas.B2.description': 'ఆనందం, వేకేషన్లు లేదా కుటుంబం మరియు స్నేహితులను చూడటానికి పర్యాటక వీసా.',
    'visaLibrary.visas.F1.name': 'విద్యార్థి',
    'visaLibrary.visas.F1.description': 'గుర్తింపు పొందిన అమెరికన్ సంస్థలలో అకాడమిక్ అధ్యయనాల కోసం విద్యార్థి వీసా.',
    'visaLibrary.visas.H1B.name': 'ప్రత్యేక వృత్తి కార్మికుడు',
    'visaLibrary.visas.H1B.description': 'బ్యాచిలర్ డిగ్రీ లేదా అంతకంటే ఎక్కువ ఉన్న నిపుణుల కోసం ప్రత్యేక వృత్తి వీసా.'
  },
  'tr-TR': {
    'visaLibrary.visas.B1.name': 'İş Ziyaretçisi',
    'visaLibrary.visas.B1.description': 'Amerika Birleşik Devletleri\'nde geçici ticari faaliyetler için iş ziyaretçisi vizesi.',
    'visaLibrary.visas.B2.name': 'Turist Ziyaretçi',
    'visaLibrary.visas.B2.description': 'Eğlence, tatil veya aile ve arkadaşları ziyaret etmek için turist vizesi.',
    'visaLibrary.visas.F1.name': 'Öğrenci',
    'visaLibrary.visas.F1.description': 'Akredite Amerikan kurumlarında akademik çalışmalar için öğrenci vizesi.',
    'visaLibrary.visas.H1B.name': 'Uzmanlık Meslek Çalışanı',
    'visaLibrary.visas.H1B.description': 'Lisans derecesi veya üstü olan profesyoneller için uzmanlık meslek vizesi.'
  },
  'ur-PK': {
    'visaLibrary.visas.B1.name': 'کاروباری ملاقاتی',
    'visaLibrary.visas.B1.description': 'ریاستہائے متحدہ میں عارضی کاروباری سرگرمیوں کے لیے کاروباری ملاقاتی ویزا۔',
    'visaLibrary.visas.B2.name': 'سیاحتی ملاقاتی',
    'visaLibrary.visas.B2.description': 'تفریح، چھٹیاں یا خاندان اور دوستوں سے ملنے کے لیے سیاحتی ویزا۔',
    'visaLibrary.visas.F1.name': 'طالب علم',
    'visaLibrary.visas.F1.description': 'تسلیم شدہ امریکی اداروں میں تعلیمی مطالعات کے لیے طالب علم ویزا۔',
    'visaLibrary.visas.H1B.name': 'خصوصی پیشے کا کارکن',
    'visaLibrary.visas.H1B.description': 'بیچلر ڈگری یا اعلیٰ رکھنے والے پیشہ ور افراد کے لیے خصوصی پیشے کا ویزا۔'
  },
  'vi-VN': {
    'visaLibrary.visas.B1.name': 'Khách Thăm Quan Kinh Doanh',
    'visaLibrary.visas.B1.description': 'Visa khách thăm quan kinh doanh cho các hoạt động thương mại tạm thời tại Hoa Kỳ.',
    'visaLibrary.visas.B2.name': 'Khách Thăm Quan Du Lịch',
    'visaLibrary.visas.B2.description': 'Visa du lịch cho mục đích giải trí, nghỉ dưỡng hoặc thăm gia đình và bạn bè.',
    'visaLibrary.visas.F1.name': 'Sinh Viên',
    'visaLibrary.visas.F1.description': 'Visa sinh viên cho các nghiên cứu học thuật tại các tổ chức Mỹ được công nhận.',
    'visaLibrary.visas.H1B.name': 'Lao Động Chuyên Môn',
    'visaLibrary.visas.H1B.description': 'Visa chuyên môn cho các chuyên gia có bằng cử nhân hoặc cao hơn.'
  },
  'zh-CN': {
    'visaLibrary.visas.B1.name': '商务访客',
    'visaLibrary.visas.B1.description': '用于在美国进行临时商业活动的商务访客签证。',
    'visaLibrary.visas.B2.name': '旅游访客',
    'visaLibrary.visas.B2.description': '用于娱乐、度假或探访家人朋友的旅游签证。',
    'visaLibrary.visas.F1.name': '学生',
    'visaLibrary.visas.F1.description': '用于在认可的美国机构进行学术研究的学生签证。',
    'visaLibrary.visas.H1B.name': '专业职业工作者',
    'visaLibrary.visas.H1B.description': '适用于拥有学士学位或更高学历的专业人士的专业职业签证。'
  }
};

// Function to add individual visa translations to a specific language section
function addIndividualVisaTranslations(content, langCode, translations) {
  // Look for the pattern: language visa library section that ends before nav
  const visaLibraryEndPattern = new RegExp(`('${langCode}':[\\s\\S]*?'visaLibrary\\.modal\\.applyFor':[^,]+,)([\\s\\S]*?)(\\s+nav:\\s*\\{)`, 'g');
  const match = visaLibraryEndPattern.exec(content);
  
  if (!match) {
    console.log(`Could not find visa library pattern for ${langCode}`);
    return content;
  }
  
  // Build translation string
  const translationLines = Object.entries(translations).map(([key, value]) => 
    `      '${key}': '${value.replace(/'/g, "\\'")}',`
  ).join('\n');
  
  const translationBlock = `\n      // Individual visa translations\n${translationLines}\n`;
  
  // Insert the individual visa translations after the visa library modal section
  const beforeNav = match[1] + translationBlock + match[2];
  const navSection = match[3];
  const replacement = beforeNav + navSection;
  
  return content.replace(match[0], replacement);
}

console.log('Adding individual visa translations to all languages...');

// Add individual visa translations for each language
let updatedContent = content;
Object.entries(individualVisaTranslations).forEach(([langCode, translations]) => {
  console.log(`Adding individual visa translations for ${langCode}...`);
  updatedContent = addIndividualVisaTranslations(updatedContent, langCode, translations);
});

// Write the updated content back
fs.writeFileSync(filePath, updatedContent, 'utf8');
console.log('All individual visa translations added successfully!');
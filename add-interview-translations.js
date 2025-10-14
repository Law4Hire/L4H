/**
 * Add interview translations to all languages that are missing them
 */

const fs = require('fs');
const path = require('path');

const i18nFile = path.join(__dirname, 'web', 'shared-ui', 'src', 'i18n-enhanced.ts');

// Interview translations for each language
const interviewTranslations = {
  'ar-SA': {
    title: 'مقابلة أهلية التأشيرة',
    question: 'سؤال',
    nextQuestion: 'السؤال التالي',
    previousQuestion: 'السؤال السابق',
    complete: 'إكمال المقابلة',
    restart: 'إعادة تعيين',
    selectOption: 'اختر خيارًا',
    loading: 'جاري التحميل...',
    progress: {
      title: 'تقدم المقابلة التكيفية',
      stats: 'السؤال {{current}} | {{remaining}} أنواع التأشيرات المتبقية'
    },
    next: 'السؤال التالي'
  },
  'bn-BD': {
    title: 'ভিসা যোগ্যতা সাক্ষাত্কার',
    question: 'প্রশ্ন',
    nextQuestion: 'পরবর্তী প্রশ্ন',
    previousQuestion: 'পূর্ববর্তী প্রশ্ন',
    complete: 'সাক্ষাত্কার সম্পূর্ণ করুন',
    restart: 'রিসেট',
    selectOption: 'একটি বিকল্প নির্বাচন করুন',
    loading: 'লোডিং...',
    progress: {
      title: 'অভিযোজনযোগ্য সাক্ষাত্কার অগ্রগতি',
      stats: 'প্রশ্ন {{current}} | {{remaining}} ভিসা প্রকার বাকি'
    },
    next: 'পরবর্তী প্রশ্ন'
  },
  'zh-CN': {
    title: '签证资格面试',
    question: '问题',
    nextQuestion: '下一个问题',
    previousQuestion: '上一个问题',
    complete: '完成面试',
    restart: '重置',
    selectOption: '选择一个选项',
    loading: '加载中...',
    progress: {
      title: '自适应面试进度',
      stats: '问题 {{current}} | 剩余 {{remaining}} 种签证类型'
    },
    next: '下一个问题'
  },
  'de-DE': {
    title: 'Visa-Berechtigung Interview',
    question: 'Frage',
    nextQuestion: 'Nächste Frage',
    previousQuestion: 'Vorherige Frage',
    complete: 'Interview abschließen',
    restart: 'Zurücksetzen',
    selectOption: 'Option auswählen',
    loading: 'Laden...',
    progress: {
      title: 'Adaptiver Interview-Fortschritt',
      stats: 'Frage {{current}} | {{remaining}} Visa-Typen verbleibend'
    },
    next: 'Nächste Frage'
  },
  'es-ES': {
    title: 'Entrevista de Elegibilidad de Visa',
    question: 'Pregunta',
    nextQuestion: 'Siguiente Pregunta',
    previousQuestion: 'Pregunta Anterior',
    complete: 'Completar Entrevista',
    restart: 'Reiniciar',
    selectOption: 'Selecciona una opción',
    loading: 'Cargando...',
    progress: {
      title: 'Progreso de Entrevista Adaptativa',
      stats: 'Pregunta {{current}} | {{remaining}} tipos de visa restantes'
    },
    next: 'Siguiente Pregunta'
  },
  'hi-IN': {
    title: 'वीज़ा योग्यता साक्षात्कार',
    question: 'प्रश्न',
    nextQuestion: 'अगला प्रश्न',
    previousQuestion: 'पिछला प्रश्न',
    complete: 'साक्षात्कार पूरा करें',
    restart: 'रीसेट',
    selectOption: 'एक विकल्प चुनें',
    loading: 'लोड हो रहा है...',
    progress: {
      title: 'अनुकूली साक्षात्कार प्रगति',
      stats: 'प्रश्न {{current}} | {{remaining}} वीज़ा प्रकार शेष'
    },
    next: 'अगला प्रश्न'
  },
  'id-ID': {
    title: 'Wawancara Kelayakan Visa',
    question: 'Pertanyaan',
    nextQuestion: 'Pertanyaan Berikutnya',
    previousQuestion: 'Pertanyaan Sebelumnya',
    complete: 'Selesaikan Wawancara',
    restart: 'Reset',
    selectOption: 'Pilih opsi',
    loading: 'Memuat...',
    progress: {
      title: 'Kemajuan Wawancara Adaptif',
      stats: 'Pertanyaan {{current}} | {{remaining}} jenis visa tersisa'
    },
    next: 'Pertanyaan Berikutnya'
  },
  'it-IT': {
    title: 'Intervista di Idoneità Visto',
    question: 'Domanda',
    nextQuestion: 'Prossima Domanda',
    previousQuestion: 'Domanda Precedente',
    complete: 'Completa Intervista',
    restart: 'Reset',
    selectOption: 'Seleziona un\'opzione',
    loading: 'Caricamento...',
    progress: {
      title: 'Progresso Intervista Adattiva',
      stats: 'Domanda {{current}} | {{remaining}} tipi di visto rimanenti'
    },
    next: 'Prossima Domanda'
  },
  'ja-JP': {
    title: 'ビザ適格性面接',
    question: '質問',
    nextQuestion: '次の質問',
    previousQuestion: '前の質問',
    complete: '面接を完了',
    restart: 'リセット',
    selectOption: 'オプションを選択',
    loading: '読み込み中...',
    progress: {
      title: '適応型面接の進行状況',
      stats: '質問 {{current}} | 残り {{remaining}} のビザタイプ'
    },
    next: '次の質問'
  },
  'ko-KR': {
    title: '비자 자격 면접',
    question: '질문',
    nextQuestion: '다음 질문',
    previousQuestion: '이전 질문',
    complete: '면접 완료',
    restart: '재설정',
    selectOption: '옵션 선택',
    loading: '로딩 중...',
    progress: {
      title: '적응형 면접 진행상황',
      stats: '질문 {{current}} | 남은 비자 유형 {{remaining}}개'
    },
    next: '다음 질문'
  },
  'mr-IN': {
    title: 'व्हिसा पात्रता मुलाखत',
    question: 'प्रश्न',
    nextQuestion: 'पुढील प्रश्न',
    previousQuestion: 'मागील प्रश्न',
    complete: 'मुलाखत पूर्ण करा',
    restart: 'रीसेट',
    selectOption: 'एक पर्याय निवडा',
    loading: 'लोड होत आहे...',
    progress: {
      title: 'अनुकूल मुलाखत प्रगती',
      stats: 'प्रश्न {{current}} | {{remaining}} व्हिसा प्रकार उरले'
    },
    next: 'पुढील प्रश्न'
  },
  'pl-PL': {
    title: 'Rozmowa Kwalifikacyjna Wizy',
    question: 'Pytanie',
    nextQuestion: 'Następne Pytanie',
    previousQuestion: 'Poprzednie Pytanie',
    complete: 'Zakończ Rozmowę',
    restart: 'Resetuj',
    selectOption: 'Wybierz opcję',
    loading: 'Ładowanie...',
    progress: {
      title: 'Postęp Adaptacyjnej Rozmowy',
      stats: 'Pytanie {{current}} | {{remaining}} typów wiz pozostało'
    },
    next: 'Następne Pytanie'
  },
  'pt-BR': {
    title: 'Entrevista de Elegibilidade de Visto',
    question: 'Pergunta',
    nextQuestion: 'Próxima Pergunta',
    previousQuestion: 'Pergunta Anterior',
    complete: 'Completar Entrevista',
    restart: 'Resetar',
    selectOption: 'Selecione uma opção',
    loading: 'Carregando...',
    progress: {
      title: 'Progresso da Entrevista Adaptativa',
      stats: 'Pergunta {{current}} | {{remaining}} tipos de visto restantes'
    },
    next: 'Próxima Pergunta'
  },
  'ru-RU': {
    title: 'Собеседование по Визе',
    question: 'Вопрос',
    nextQuestion: 'Следующий Вопрос',
    previousQuestion: 'Предыдущий Вопрос',
    complete: 'Завершить Собеседование',
    restart: 'Сброс',
    selectOption: 'Выберите опцию',
    loading: 'Загрузка...',
    progress: {
      title: 'Прогресс Адаптивного Собеседования',
      stats: 'Вопрос {{current}} | {{remaining}} типов виз осталось'
    },
    next: 'Следующий Вопрос'
  },
  'ta-IN': {
    title: 'வீசா தகுதி நேர்காணல்',
    question: 'கேள்வி',
    nextQuestion: 'அடுத்த கேள்வி',
    previousQuestion: 'முந்தைய கேள்வி',
    complete: 'நேர்காணலை முடிக்கவும்',
    restart: 'மீட்டமை',
    selectOption: 'ஒரு விருப்பத்தைத் தேர்ந்தெடுக்கவும்',
    loading: 'ஏற்றுகிறது...',
    progress: {
      title: 'தகவமைப்பு நேர்காணல் முன்னேற்றம்',
      stats: 'கேள்வி {{current}} | {{remaining}} வீசா வகைகள் மீதமுள்ளன'
    },
    next: 'அடுத்த கேள்வி'
  },
  'te-IN': {
    title: 'వీసా అర్హత ఇంటర్వ్యూ',
    question: 'ప్రశ్న',
    nextQuestion: 'తదుపరి ప్రశ్న',
    previousQuestion: 'మునుపటి ప్రశ్న',
    complete: 'ఇంటర్వ్యూను పూర్తి చేయండి',
    restart: 'రీసెట్',
    selectOption: 'ఒక ఎంపికను ఎంచుకోండి',
    loading: 'లోడ్ అవుతోంది...',
    progress: {
      title: 'అడాప్టివ్ ఇంటర్వ్యూ పురోగతి',
      stats: 'ప్రశ్న {{current}} | {{remaining}} వీసా రకాలు మిగిలివున్నాయి'
    },
    next: 'తదుపరి ప్రశ్న'
  },
  'tr-TR': {
    title: 'Vize Uygunluk Mülakatı',
    question: 'Soru',
    nextQuestion: 'Sonraki Soru',
    previousQuestion: 'Önceki Soru',
    complete: 'Mülakatı Tamamla',
    restart: 'Sıfırla',
    selectOption: 'Bir seçenek seçin',
    loading: 'Yükleniyor...',
    progress: {
      title: 'Uyarlanabilir Mülakat İlerlemesi',
      stats: 'Soru {{current}} | {{remaining}} vize türü kaldı'
    },
    next: 'Sonraki Soru'
  },
  'ur-PK': {
    title: 'ویزا اہلیت انٹرویو',
    question: 'سوال',
    nextQuestion: 'اگلا سوال',
    previousQuestion: 'پچھلا سوال',
    complete: 'انٹرویو مکمل کریں',
    restart: 'ری سیٹ',
    selectOption: 'ایک آپشن منتخب کریں',
    loading: 'لوڈ ہو رہا ہے...',
    progress: {
      title: 'ایڈاپٹو انٹرویو پیش قدمی',
      stats: 'سوال {{current}} | {{remaining}} ویزا کی اقسام باقی ہیں'
    },
    next: 'اگلا سوال'
  },
  'vi-VN': {
    title: 'Phỏng vấn Điều kiện Visa',
    question: 'Câu hỏi',
    nextQuestion: 'Câu hỏi Tiếp theo',
    previousQuestion: 'Câu hỏi Trước',
    complete: 'Hoàn thành Phỏng vấn',
    restart: 'Đặt lại',
    selectOption: 'Chọn một tùy chọn',
    loading: 'Đang tải...',
    progress: {
      title: 'Tiến trình Phỏng vấn Thích ứng',
      stats: 'Câu hỏi {{current}} | {{remaining}} loại visa còn lại'
    },
    next: 'Câu hỏi Tiếp theo'
  }
};

console.log('🌍 Adding interview translations to all languages...');

// Read the file
let content = fs.readFileSync(i18nFile, 'utf8');

// For each language that needs interview translations
Object.keys(interviewTranslations).forEach(langCode => {
  const translations = interviewTranslations[langCode];

  // Create the interview block
  const interviewBlock = `    interview: {
      title: '${translations.title}',
      question: '${translations.question}',
      nextQuestion: '${translations.nextQuestion}',
      previousQuestion: '${translations.previousQuestion}',
      complete: '${translations.complete}',
      restart: '${translations.restart}',
      selectOption: '${translations.selectOption}',
      loading: '${translations.loading}',
      progress: {
        title: '${translations.progress.title}',
        stats: '${translations.progress.stats}'
      },
      next: '${translations.next}'
    },`;

  // Find the pattern where we need to add the interview section
  // Look for languages that don't have interview: { section
  const langPattern = new RegExp(`'${langCode}':\\s*{([\\s\\S]*?)(?=},\\s*'[a-z-]+':|},\\s*}\\s*;)`, 'g');

  content = content.replace(langPattern, (match) => {
    // Check if this language already has interview translations
    if (match.includes('interview: {')) {
      console.log(`✅ ${langCode}: Already has interview translations`);
      return match;
    }

    // Find where to insert the interview block (after dashboard or admin section)
    if (match.includes('dashboard: {') || match.includes('admin: {')) {
      // Find the end of the last section and add interview before the closing
      const insertPoint = match.lastIndexOf('    },');
      if (insertPoint !== -1) {
        const before = match.substring(0, insertPoint + 6); // Include the },
        const after = match.substring(insertPoint + 6);
        console.log(`✅ ${langCode}: Added interview translations`);
        return before + '\n' + interviewBlock + after;
      }
    }

    console.log(`⚠️ ${langCode}: Could not find insertion point`);
    return match;
  });
});

// Write the file back
fs.writeFileSync(i18nFile, content, 'utf8');

console.log('✅ Interview translations added to all languages!');
console.log('🔧 Remember to rebuild shared-ui package: cd web/shared-ui && npm run build');
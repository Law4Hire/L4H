const fs = require('fs');
const path = require('path');

// Define all visa translations for each language
const visaTranslations = {
  'ar-SA': {
    "B1": { "name": "زائر أعمال", "description": "تأشيرة زائر أعمال للأنشطة التجارية المؤقتة في الولايات المتحدة." },
    "B2": { "name": "زائر سياحي", "description": "تأشيرة سياحية للمتعة والإجازات أو زيارة الأهل والأصدقاء." },
    "F1": { "name": "طالب", "description": "تأشيرة طالب للدراسات الأكاديمية في المؤسسات المعتمدة في الولايات المتحدة." },
    "F2": { "name": "معال طالب", "description": "تأشيرة معال للأزواج والأطفال غير المتزوجين تحت سن 21 من طلاب F1." },
    "H1B": { "name": "عامل مهنة متخصصة", "description": "تأشيرة مهنة متخصصة للمهنيين الحاصلين على درجة البكالوريوس أو أعلى." },
    "H2A": { "name": "عامل زراعي", "description": "تأشيرة عامل زراعي مؤقت للعمل الزراعي الموسمي." },
    "H4": { "name": "معال H1B", "description": "تأشيرة معال للأزواج والأطفال غير المتزوجين تحت سن 21 من حاملي تأشيرة H1B." },
    "J1": { "name": "زائر تبادل", "description": "تأشيرة زائر تبادل لبرامج التبادل الثقافي." },
    "L1A": { "name": "منقول داخل الشركة تنفيذي", "description": "تأشيرة منقول داخل الشركة للمديرين والتنفيذيين." },
    "L1B": { "name": "منقول داخل الشركة متخصص", "description": "تأشيرة منقول داخل الشركة للموظفين ذوي المعرفة المتخصصة." },
    "L2": { "name": "معال L1", "description": "تأشيرة معال للأزواج والأطفال غير المتزوجين تحت سن 21 من حاملي تأشيرة L1." },
    "O1": { "name": "قدرة استثنائية", "description": "تأشيرة قدرة استثنائية للأفراد ذوي المهارات الاستثنائية." },
    "TN": { "name": "مهني نافتا", "description": "تأشيرة مهني نافتا للمواطنين الكنديين والمكسيكيين." },
    "E2": { "name": "مستثمر معاهدة", "description": "تأشيرة مستثمر معاهدة للاستثمار الكبير في الأعمال الأمريكية." },
    "EB1": { "name": "عمال أولوية", "description": "البطاقة الخضراء القائمة على العمل من الأولوية الأولى للعمال ذوي الأولوية." },
    "EB2": { "name": "مهنيون بدرجة متقدمة", "description": "البطاقة الخضراء القائمة على العمل من الأولوية الثانية لحاملي الدرجات المتقدمة." },
    "EB3": { "name": "عمال مهرة", "description": "البطاقة الخضراء القائمة على العمل من الأولوية الثالثة للعمال المهرة." },
    "EB4": { "name": "مهاجرون خاصون", "description": "البطاقة الخضراء القائمة على العمل من الأولوية الرابعة للمهاجرين الخاصين." },
    "EB5": { "name": "مستثمرون مهاجرون", "description": "البطاقة الخضراء القائمة على العمل من الأولوية الخامسة للمستثمرين." }
  },
  'it-IT': {
    "B1": { "name": "Visitatore d'Affari", "description": "Visto per visitatore d'affari per attività commerciali temporanee negli Stati Uniti." },
    "B2": { "name": "Visitatore Turistico", "description": "Visto turistico per piacere, vacanze o visitare famiglia e amici." },
    "F1": { "name": "Studente", "description": "Visto per studente per studi accademici presso istituzioni accreditate negli Stati Uniti." },
    "F2": { "name": "Dipendente Studente", "description": "Visto per dipendente per coniugi e figli non sposati sotto i 21 anni di studenti F1." },
    "H1B": { "name": "Lavoratore Occupazione Specializzata", "description": "Visto per occupazione specializzata per professionisti con laurea o superiore." },
    "H2A": { "name": "Lavoratore Agricolo", "description": "Visto per lavoratore agricolo temporaneo per lavoro agricolo stagionale." },
    "H4": { "name": "Dipendente H1B", "description": "Visto per dipendente per coniugi e figli non sposati sotto i 21 anni di possessori di visto H1B." },
    "J1": { "name": "Visitatore di Scambio", "description": "Visto per visitatore di scambio per programmi di scambio culturale." },
    "L1A": { "name": "Trasferito Intraaziendale Esecutivo", "description": "Visto per trasferito intraaziendale per manager ed esecutivi." },
    "L1B": { "name": "Trasferito Intraaziendale Specialista", "description": "Visto per trasferito intraaziendale per dipendenti con conoscenze specializzate." },
    "L2": { "name": "Dipendente L1", "description": "Visto per dipendente per coniugi e figli non sposati sotto i 21 anni di possessori di visto L1." },
    "O1": { "name": "Abilità Straordinaria", "description": "Visto per abilità straordinaria per individui con competenze eccezionali." },
    "TN": { "name": "Professionista NAFTA", "description": "Visto per professionista NAFTA per cittadini canadesi e messicani." },
    "E2": { "name": "Investitore per Trattato", "description": "Visto per investitore per trattato per investimenti sostanziali in attività statunitensi." },
    "EB1": { "name": "Lavoratori Prioritari", "description": "Carta verde basata sull'impiego di prima preferenza per lavoratori prioritari." },
    "EB2": { "name": "Professionisti con Laurea Avanzata", "description": "Carta verde basata sull'impiego di seconda preferenza per possessori di lauree avanzate." },
    "EB3": { "name": "Lavoratori Qualificati", "description": "Carta verde basata sull'impiego di terza preferenza per lavoratori qualificati." },
    "EB4": { "name": "Immigrati Speciali", "description": "Carta verde basata sull'impiego di quarta preferenza per immigrati speciali." },
    "EB5": { "name": "Investitori Immigrati", "description": "Carta verde basata sull'impiego di quinta preferenza per investitori." }
  },
  'ru-RU': {
    "B1": { "name": "Деловой посетитель", "description": "Виза делового посетителя для временной деловой деятельности в Соединенных Штатах." },
    "B2": { "name": "Туристический посетитель", "description": "Туристическая виза для удовольствия, отпуска или посещения семьи и друзей." },
    "F1": { "name": "Студент", "description": "Студенческая виза для академических занятий в аккредитованных учреждениях США." },
    "F2": { "name": "Иждивенец студента", "description": "Виза иждивенца для супругов и неженатых детей до 21 года студентов F1." },
    "H1B": { "name": "Работник специальной профессии", "description": "Виза специальной профессии для профессионалов со степенью бакалавра или выше." },
    "H2A": { "name": "Сельскохозяйственный работник", "description": "Временная виза сельскохозяйственного работника для сезонной фермерской работы." },
    "H4": { "name": "Иждивенец H1B", "description": "Виза иждивенца для супругов и неженатых детей до 21 года держателей визы H1B." },
    "J1": { "name": "Участник обмена", "description": "Виза участника обмена для программ культурного обмена." },
    "L1A": { "name": "Внутрикорпоративный переводчик-руководитель", "description": "Виза внутрикорпоративного перевода для менеджеров и руководителей." },
    "L1B": { "name": "Внутрикорпоративный переводчик-специалист", "description": "Виза внутрикорпоративного перевода для сотрудников со специализированными знаниями." },
    "L2": { "name": "Иждивенец L1", "description": "Виза иждивенца для супругов и неженатых детей до 21 года держателей визы L1." },
    "O1": { "name": "Выдающиеся способности", "description": "Виза выдающихся способностей для лиц с исключительными навыками." },
    "TN": { "name": "Профессионал НАФТА", "description": "Виза профессионала НАФТА для канадских и мексиканских граждан." },
    "E2": { "name": "Инвестор по договору", "description": "Виза инвестора по договору для существенных инвестиций в американский бизнес." },
    "EB1": { "name": "Приоритетные работники", "description": "Грин-карта на основе трудоустройства первого приоритета для приоритетных работников." },
    "EB2": { "name": "Профессионалы с продвинутой степенью", "description": "Грин-карта на основе трудоустройства второго приоритета для обладателей продвинутых степеней." },
    "EB3": { "name": "Квалифицированные работники", "description": "Грин-карта на основе трудоустройства третьего приоритета для квалифицированных работников." },
    "EB4": { "name": "Особые иммигранты", "description": "Грин-карта на основе трудоустройства четвертого приоритета для особых иммигрантов." },
    "EB5": { "name": "Инвесторы-иммигранты", "description": "Грин-карта на основе трудоустройства пятого приоритета для инвесторов." }
  }
};

// Languages that need visa translations added
const languages = [
  'ar-SA', 'bn-BD', 'hi-IN', 'id-ID', 'it-IT', 'ja-JP', 'ko-KR', 
  'mr-IN', 'pl-PL', 'ru-RU', 'ta-IN', 'te-IN', 'tr-TR', 'ur-PK', 
  'vi-VN', 'zh-CN'
];

// Generic English translations for languages not specifically defined
const genericVisaTranslations = {
  "B1": { "name": "Business Visitor", "description": "Business visitor visa for temporary business activities in the United States." },
  "B2": { "name": "Tourist Visitor", "description": "Tourist visa for pleasure, vacation, or visiting family and friends." },
  "F1": { "name": "Student", "description": "Student visa for academic studies at accredited US institutions." },
  "F2": { "name": "Student Dependent", "description": "Dependent visa for spouses and unmarried children under 21 of F1 students." },
  "H1B": { "name": "Specialty Occupation Worker", "description": "Specialty occupation visa for professionals with bachelor's degree or higher." },
  "H2A": { "name": "Agricultural Worker", "description": "Temporary agricultural worker visa for seasonal farm labor." },
  "H4": { "name": "H1B Dependent", "description": "Dependent visa for spouses and unmarried children under 21 of H1B visa holders." },
  "J1": { "name": "Exchange Visitor", "description": "Exchange visitor visa for cultural exchange programs." },
  "L1A": { "name": "Intracompany Transferee Executive", "description": "Intracompany transferee visa for managers and executives." },
  "L1B": { "name": "Intracompany Transferee Specialist", "description": "Intracompany transferee visa for employees with specialized knowledge." },
  "L2": { "name": "L1 Dependent", "description": "Dependent visa for spouses and unmarried children under 21 of L1 visa holders." },
  "O1": { "name": "Extraordinary Ability", "description": "Extraordinary ability visa for individuals with exceptional skills." },
  "TN": { "name": "NAFTA Professional", "description": "NAFTA professional visa for Canadian and Mexican citizens." },
  "E2": { "name": "Treaty Investor", "description": "Treaty investor visa for substantial investment in US business." },
  "EB1": { "name": "Priority Workers", "description": "First preference employment-based green card for priority workers." },
  "EB2": { "name": "Advanced Degree Professionals", "description": "Second preference employment-based green card for advanced degree holders." },
  "EB3": { "name": "Skilled Workers", "description": "Third preference employment-based green card for skilled workers." },
  "EB4": { "name": "Special Immigrants", "description": "Fourth preference employment-based green card for special immigrants." },
  "EB5": { "name": "Immigrant Investors", "description": "Fifth preference employment-based green card for investors." }
};

function addVisaTranslations() {
  languages.forEach(lang => {
    const filePath = path.join(__dirname, 'web', 'l4h', 'public', 'locales', lang, 'common.json');
    
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);
        
        // Check if visaLibrary section exists and doesn't already have visas
        if (data.visaLibrary && !data.visaLibrary.visas) {
          // Use specific translations if available, otherwise use generic English
          const translations = visaTranslations[lang] || genericVisaTranslations;
          data.visaLibrary.visas = translations;
          
          // Write back to file
          fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
          console.log(`✅ Added visa translations to ${lang}`);
        } else if (!data.visaLibrary) {
          console.log(`⚠️  No visaLibrary section found in ${lang}`);
        } else {
          console.log(`ℹ️  Visa translations already exist in ${lang}`);
        }
      } catch (error) {
        console.error(`❌ Error processing ${lang}:`, error.message);
      }
    } else {
      console.log(`⚠️  File not found: ${filePath}`);
    }
  });
}

console.log('🚀 Adding visa translations to all languages...');
addVisaTranslations();
console.log('✨ Done!');
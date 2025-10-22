const fs = require('fs');
const path = require('path');

// Translation data for each language
const translations = {
  'ko-KR': {
    title: "미국 비자 유형 라이브러리",
    description: "다양한 미국 비자 카테고리에 대한 종합적인 정보를 살펴보세요. 모든 비자 유형을 클릭하여 자격 요건, 신청 절차 및 혜택에 대해 알아보세요.",
    loading: "비자 정보 로드 중...",
    learnMore: "자세히 알아보기",
    categories: {
      nonimmigrant: "비이민 비자",
      immigrant: "이민 비자"
    },
    modal: {
      category: "카테고리",
      description: "설명",
      nextSteps: "다음 단계",
      readyToApply: "{{code}} 비자 신청 준비가 되셨나요? 당사의 이민 변호사가 전체 과정을 안내해 드립니다.",
      applyFor: "{{code}} 비자 신청"
    },
    cta: {
      title: "올바른 비자 선택에 도움이 필요하신가요?",
      description: "당사의 이민 전문가가 귀하의 상황에 가장 적합한 비자 카테고리를 결정하는 데 도움을 드립니다.",
      button: "신청 시작"
    },
    visas: {
      B1: { name: "비즈니스 방문자", description: "미국 내 임시 비즈니스 활동을 위한 비즈니스 방문자 비자." },
      B2: { name: "관광 방문자", description: "여행, 휴가 또는 가족 및 친구 방문을 위한 관광 비자." },
      F1: { name: "학생", description: "인가된 미국 교육 기관에서의 학업을 위한 학생 비자." },
      F2: { name: "학생 부양 가족", description: "F1 학생의 배우자 및 21세 미만 미혼 자녀를 위한 부양 가족 비자." },
      H1B: { name: "전문직 종사자", description: "학사 학위 이상의 전문가를 위한 전문직 비자." },
      H2A: { name: "농업 근로자", description: "계절별 농장 노동을 위한 임시 농업 근로자 비자." },
      H4: { name: "H1B 부양 가족", description: "H1B 비자 소지자의 배우자 및 21세 미만 미혼 자녀를 위한 부양 가족 비자." },
      J1: { name: "교환 방문자", description: "문화 교류 프로그램을 위한 교환 방문자 비자." },
      L1A: { name: "사내 전근자 임원", description: "관리자 및 임원을 위한 사내 전근자 비자." },
      L1B: { name: "사내 전근자 전문가", description: "전문 지식을 가진 직원을 위한 사내 전근자 비자." },
      L2: { name: "L1 부양 가족", description: "L1 비자 소지자의 배우자 및 21세 미만 미혼 자녀를 위한 부양 가족 비자." },
      O1: { name: "탁월한 능력", description: "뛰어난 기술을 가진 개인을 위한 탁월한 능력 비자." },
      TN: { name: "NAFTA 전문가", description: "캐나다 및 멕시코 시민을 위한 NAFTA 전문가 비자." },
      E2: { name: "조약 투자자", description: "미국 사업에 대한 실질적인 투자를 위한 조약 투자자 비자." },
      EB1: { name: "우선 근로자", description: "우선 근로자를 위한 제1 우선 고용 기반 영주권." },
      EB2: { name: "고급 학위 전문가", description: "고급 학위 소지자를 위한 제2 우선 고용 기반 영주권." },
      EB3: { name: "숙련 근로자", description: "숙련 근로자를 위한 제3 우선 고용 기반 영주권." },
      EB4: { name: "특별 이민자", description: "특별 이민자를 위한 제4 우선 고용 기반 영주권." },
      EB5: { name: "투자 이민자", description: "투자자를 위한 제5 우선 고용 기반 영주권." }
    }
  },
  'zh-CN': {
    title: "美国签证类型库",
    description: "探索有关不同美国签证类别的全面信息。点击任何签证类型以了解资格要求、申请流程和好处。",
    loading: "加载签证信息中...",
    learnMore: "了解更多",
    categories: {
      nonimmigrant: "非移民签证",
      immigrant: "移民签证"
    },
    modal: {
      category: "类别",
      description: "描述",
      nextSteps: "下一步",
      readyToApply: "准备申请{{code}}签证了吗？我们的移民律师将指导您完成整个过程。",
      applyFor: "申请{{code}}签证"
    },
    cta: {
      title: "需要帮助选择合适的签证吗？",
      description: "我们的移民专家可以帮助您确定最适合您情况的签证类别。",
      button: "开始申请"
    },
    visas: {
      B1: { name: "商务访客", description: "用于在美国进行临时商务活动的商务访客签证。" },
      B2: { name: "旅游访客", description: "用于旅游、度假或拜访家人和朋友的旅游签证。" },
      F1: { name: "学生", description: "用于在经认可的美国教育机构进行学术研究的学生签证。" },
      F2: { name: "学生家属", description: "F1学生的配偶及21岁以下未婚子女的家属签证。" },
      H1B: { name: "专业职业工作者", description: "适用于拥有学士学位或更高学历的专业人士的专业职业签证。" },
      H2A: { name: "农业工作者", description: "用于季节性农场劳动的临时农业工作者签证。" },
      H4: { name: "H1B家属", description: "H1B签证持有者的配偶及21岁以下未婚子女的家属签证。" },
      J1: { name: "交流访问者", description: "用于文化交流项目的交流访问者签证。" },
      L1A: { name: "公司内部调动者（高管）", description: "适用于经理和高管的公司内部调动者签证。" },
      L1B: { name: "公司内部调动者（专家）", description: "适用于具有专业知识的员工的公司内部调动者签证。" },
      L2: { name: "L1家属", description: "L1签证持有者的配偶及21岁以下未婚子女的家属签证。" },
      O1: { name: "杰出能力", description: "适用于具有卓越技能的个人的杰出能力签证。" },
      TN: { name: "NAFTA专业人士", description: "适用于加拿大和墨西哥公民的NAFTA专业人士签证。" },
      E2: { name: "条约投资者", description: "用于在美国企业进行大量投资的条约投资者签证。" },
      EB1: { name: "优先工作者", description: "适用于优先工作者的第一优先职业移民绿卡。" },
      EB2: { name: "高级学位专业人士", description: "适用于高级学位持有者的第二优先职业移民绿卡。" },
      EB3: { name: "熟练工人", description: "适用于熟练工人的第三优先职业移民绿卡。" },
      EB4: { name: "特殊移民", description: "适用于特殊移民的第四优先职业移民绿卡。" },
      EB5: { name: "投资移民", description: "适用于投资者的第五优先职业移民绿卡。" }
    }
  },
  'vi-VN': {
    title: "Thư viện các loại thị thực Hoa Kỳ",
    description: "Khám phá thông tin toàn diện về các loại thị thực Hoa Kỳ khác nhau. Nhấp vào bất kỳ loại thị thực nào để tìm hiểu về các yêu cầu đủ điều kiện, quy trình đăng ký và lợi ích.",
    loading: "Đang tải thông tin thị thực...",
    learnMore: "Tìm hiểu thêm",
    categories: {
      nonimmigrant: "Thị thực không định cư",
      immigrant: "Thị thực định cư"
    },
    modal: {
      category: "Danh mục",
      description: "Mô tả",
      nextSteps: "Các bước tiếp theo",
      readyToApply: "Sẵn sàng đăng ký thị thực {{code}}? Các luật sư di trú của chúng tôi có thể hướng dẫn bạn trong suốt quá trình.",
      applyFor: "Đăng ký thị thực {{code}}"
    },
    cta: {
      title: "Cần giúp đỡ chọn đúng thị thực?",
      description: "Các chuyên gia di trú của chúng tôi có thể giúp bạn xác định loại thị thực phù hợp nhất với tình huống của bạn.",
      button: "Bắt đầu đăng ký"
    },
    visas: {
      B1: { name: "Khách thăm kinh doanh", description: "Thị thực khách thăm kinh doanh cho các hoạt động kinh doanh tạm thời tại Hoa Kỳ." },
      B2: { name: "Khách thăm du lịch", description: "Thị thực du lịch cho mục đích giải trí, nghỉ mát hoặc thăm gia đình và bạn bè." },
      F1: { name: "Sinh viên", description: "Thị thực sinh viên cho việc học tập tại các trường được công nhận ở Hoa Kỳ." },
      F2: { name: "Người phụ thuộc sinh viên", description: "Thị thực người phụ thuộc cho vợ/chồng và con chưa kết hôn dưới 21 tuổi của sinh viên F1." },
      H1B: { name: "Nhân viên chuyên môn", description: "Thị thực chuyên môn cho các chuyên gia có bằng cử nhân trở lên." },
      H2A: { name: "Công nhân nông nghiệp", description: "Thị thực công nhân nông nghiệp tạm thời cho lao động nông trại theo mùa." },
      H4: { name: "Người phụ thuộc H1B", description: "Thị thực người phụ thuộc cho vợ/chồng và con chưa kết hôn dưới 21 tuổi của người có thị thực H1B." },
      J1: { name: "Khách trao đổi", description: "Thị thực khách trao đổi cho các chương trình trao đổi văn hóa." },
      L1A: { name: "Điều chuyển nội bộ (Giám đốc)", description: "Thị thực điều chuyển nội bộ cho các nhà quản lý và giám đốc." },
      L1B: { name: "Điều chuyển nội bộ (Chuyên gia)", description: "Thị thực điều chuyển nội bộ cho nhân viên có kiến thức chuyên môn." },
      L2: { name: "Người phụ thuộc L1", description: "Thị thực người phụ thuộc cho vợ/chồng và con chưa kết hôn dưới 21 tuổi của người có thị thực L1." },
      O1: { name: "Năng lực đặc biệt", description: "Thị thực năng lực đặc biệt cho những cá nhân có kỹ năng xuất sắc." },
      TN: { name: "Chuyên gia NAFTA", description: "Thị thực chuyên gia NAFTA cho công dân Canada và Mexico." },
      E2: { name: "Nhà đầu tư hiệp ước", description: "Thị thực nhà đầu tư hiệp ước cho đầu tư đáng kể vào doanh nghiệp Hoa Kỳ." },
      EB1: { name: "Công nhân ưu tiên", description: "Thẻ xanh việc làm ưu tiên đầu tiên cho công nhân ưu tiên." },
      EB2: { name: "Chuyên gia bằng cấp cao", description: "Thẻ xanh việc làm ưu tiên thứ hai cho người có bằng cấp cao." },
      EB3: { name: "Công nhân lành nghề", description: "Thẻ xanh việc làm ưu tiên thứ ba cho công nhân lành nghề." },
      EB4: { name: "Người nhập cư đặc biệt", description: "Thẻ xanh việc làm ưu tiên thứ tư cho người nhập cư đặc biệt." },
      EB5: { name: "Nhà đầu tư định cư", description: "Thẻ xanh việc làm ưu tiên thứ năm cho nhà đầu tư." }
    }
  },
  'tr-TR': {
    title: "ABD Vize Türleri Kütüphanesi",
    description: "Farklı ABD vize kategorileri hakkında kapsamlı bilgileri keşfedin. Uygunluk gereksinimleri, başvuru süreci ve avantajlar hakkında bilgi edinmek için herhangi bir vize türüne tıklayın.",
    loading: "Vize bilgisi yükleniyor...",
    learnMore: "Daha fazla bilgi",
    categories: {
      nonimmigrant: "Göçmen Olmayan Vizeler",
      immigrant: "Göçmen Vizeleri"
    },
    modal: {
      category: "Kategori",
      description: "Açıklama",
      nextSteps: "Sonraki Adımlar",
      readyToApply: "{{code}} vizesi için başvurmaya hazır mısınız? Göçmenlik avukatlarımız tüm süreçte size rehberlik edebilir.",
      applyFor: "{{code}} Vizesi için Başvur"
    },
    cta: {
      title: "Doğru vizeyi seçmek için yardıma mı ihtiyacınız var?",
      description: "Göçmenlik uzmanlarımız, durumunuza en uygun vize kategorisini belirlemenize yardımcı olabilir.",
      button: "Başvurunuza başlayın"
    },
    visas: {
      B1: { name: "İş Ziyaretçisi", description: "Amerika Birleşik Devletleri'nde geçici iş faaliyetleri için iş ziyaretçisi vizesi." },
      B2: { name: "Turist Ziyaretçisi", description: "Eğlence, tatil veya aile ve arkadaşları ziyaret etmek için turist vizesi." },
      F1: { name: "Öğrenci", description: "Akredite ABD kurumlarında akademik çalışmalar için öğrenci vizesi." },
      F2: { name: "Öğrenci Bağımlısı", description: "F1 öğrencilerin eşleri ve 21 yaşın altındaki evli olmayan çocukları için bağımlı vize." },
      H1B: { name: "Özel Meslek Çalışanı", description: "Lisans veya daha yüksek dereceye sahip profesyoneller için özel meslek vizesi." },
      H2A: { name: "Tarım Çalışanı", description: "Mevsimlik çiftlik işçiliği için geçici tarım çalışanı vizesi." },
      H4: { name: "H1B Bağımlısı", description: "H1B vize sahiplerinin eşleri ve 21 yaşın altındaki evli olmayan çocukları için bağımlı vize." },
      J1: { name: "Değişim Ziyaretçisi", description: "Kültür değişim programları için değişim ziyaretçisi vizesi." },
      L1A: { name: "Şirket İçi Transfer (Yönetici)", description: "Yöneticiler ve yürütücüler için şirket içi transfer vizesi." },
      L1B: { name: "Şirket İçi Transfer (Uzman)", description: "Uzman bilgiye sahip çalışanlar için şirket içi transfer vizesi." },
      L2: { name: "L1 Bağımlısı", description: "L1 vize sahiplerinin eşleri ve 21 yaşın altındaki evli olmayan çocukları için bağımlı vize." },
      O1: { name: "Olağanüstü Yetenek", description: "İstisnai beceriler ile bireyler için olağanüstü yetenek vizesi." },
      TN: { name: "NAFTA Profesyoneli", description: "Kanada ve Meksika vatandaşları için NAFTA profesyonel vizesi." },
      E2: { name: "Antlaşma Yatırımcısı", description: "ABD işine önemli yatırım için antlaşma yatırımcısı vizesi." },
      EB1: { name: "Öncelikli Çalışanlar", description: "Öncelikli çalışanlar için birinci tercih istihdam tabanlı yeşil kart." },
      EB2: { name: "İleri Derece Profesyonelleri", description: "İleri derece sahipleri için ikinci tercih istihdam tabanlı yeşil kart." },
      EB3: { name: "Nitelikli Çalışanlar", description: "Nitelikli çalışanlar için üçüncü tercih istihdam tabanlı yeşil kart." },
      EB4: { name: "Özel Göçmenler", description: "Özel göçmenler için dördüncü tercih istihdam tabanlı yeşil kart." },
      EB5: { name: "Yatırımcı Göçmenler", description: "Yatırımcılar için beşinci tercih istihdam tabanlı yeşil kart." }
    }
  },
  'pl-PL': {
    title: "Biblioteka typów wiz do USA",
    description: "Poznaj kompleksowe informacje o różnych kategoriach wiz do USA. Kliknij dowolny typ wizy, aby dowiedzieć się więcej o wymaganiach kwalifikacyjnych, procesie aplikacyjnym i korzyściach.",
    loading: "Ładowanie informacji o wizach...",
    learnMore: "Dowiedz się więcej",
    categories: {
      nonimmigrant: "Wizy nieimigracyjne",
      immigrant: "Wizy imigracyjne"
    },
    modal: {
      category: "Kategoria",
      description: "Opis",
      nextSteps: "Kolejne kroki",
      readyToApply: "Gotowy do aplikacji o wizę {{code}}? Nasi prawnicy imigracyjni poprowadzą Cię przez cały proces.",
      applyFor: "Aplikuj o wizę {{code}}"
    },
    cta: {
      title: "Potrzebujesz pomocy w wyborze odpowiedniej wizy?",
      description: "Nasi eksperci ds. imigracji mogą pomóc Ci określić, która kategoria wizy najlepiej pasuje do Twojej sytuacji.",
      button: "Rozpocznij aplikację"
    },
    visas: {
      B1: { name: "Gość biznesowy", description: "Wiza gościa biznesowego dla tymczasowych działań biznesowych w Stanach Zjednoczonych." },
      B2: { name: "Gość turystyczny", description: "Wiza turystyczna dla przyjemności, wakacji lub odwiedzin rodziny i przyjaciół." },
      F1: { name: "Student", description: "Wiza studencka dla studiów akademickich w akredytowanych instytucjach amerykańskich." },
      F2: { name: "Osoba zależna studenta", description: "Wiza dla osób zależnych dla małżonków i niezamężnych dzieci poniżej 21 roku życia studentów F1." },
      H1B: { name: "Pracownik specjalistyczny", description: "Wiza specjalistyczna dla profesjonalistów z tytułem licencjata lub wyższym." },
      H2A: { name: "Pracownik rolny", description: "Wiza tymczasowego pracownika rolnego dla sezonowej pracy na farmie." },
      H4: { name: "Osoba zależna H1B", description: "Wiza dla osób zależnych dla małżonków i niezamężnych dzieci poniżej 21 roku życia posiadaczy wizy H1B." },
      J1: { name: "Gość wymiany", description: "Wiza gościa wymiany dla programów wymiany kulturalnej." },
      L1A: { name: "Transferowany wewnątrz firmy (Dyrektor)", description: "Wiza transferu wewnątrzfirmowego dla menedżerów i dyrektorów." },
      L1B: { name: "Transferowany wewnątrz firmy (Specjalista)", description: "Wiza transferu wewnątrzfirmowego dla pracowników z wyspecjalizowaną wiedzą." },
      L2: { name: "Osoba zależna L1", description: "Wiza dla osób zależnych dla małżonków i niezamężnych dzieci poniżej 21 roku życia posiadaczy wizy L1." },
      O1: { name: "Nadzwyczajne zdolności", description: "Wiza nadzwyczajnych zdolności dla osób o wyjątkowych umiejętnościach." },
      TN: { name: "Profesjonalista NAFTA", description: "Wiza profesjonalisty NAFTA dla obywateli kanadyjskich i meksykańskich." },
      E2: { name: "Inwestor traktatowy", description: "Wiza inwestora traktatowego dla znacznych inwestycji w przedsiębiorstwo w USA." },
      EB1: { name: "Pracownicy priorytetowi", description: "Zielona karta oparta na zatrudnieniu pierwszej preferencji dla pracowników priorytetowych." },
      EB2: { name: "Profesjonaliści z wyższym wykształceniem", description: "Zielona karta oparta na zatrudnieniu drugiej preferencji dla osób z wyższym wykształceniem." },
      EB3: { name: "Wykwalifikowani pracownicy", description: "Zielona karta oparta na zatrudnieniu trzeciej preferencji dla wykwalifikowanych pracowników." },
      EB4: { name: "Specjalni imigranci", description: "Zielona karta oparta na zatrudnieniu czwartej preferencji dla specjalnych imigrantów." },
      EB5: { name: "Imigranci inwestorzy", description: "Zielona karta oparta na zatrudnieniu piątej preferencji dla inwestorów." }
    }
  }
};

// Add remaining Indian languages
const indianLanguages = {
  'mr-IN': {
    title: "यूएस व्हिसा प्रकार ग्रंथालय",
    description: "विविध यूएस व्हिसा श्रेणींबद्दल सर्वसमावेशक माहिती जाणून घ्या. पात्रता आवश्यकता, अर्ज प्रक्रिया आणि फायदे जाणून घेण्यासाठी कोणत्याही व्हिसा प्रकारावर क्लिक करा.",
    loading: "व्हिसा माहिती लोड होत आहे...",
    learnMore: "अधिक जाणून घ्या",
    categories: {
      nonimmigrant: "अस्थायी व्हिसा",
      immigrant: "कायमस्वरूपी व्हिसा"
    },
    modal: {
      category: "श्रेणी",
      description: "वर्णन",
      nextSteps: "पुढील पायऱ्या",
      readyToApply: "{{code}} व्हिसासाठी अर्ज करण्यास तयार आहात? आमचे इमिग्रेशन वकील संपूर्ण प्रक्रियेत आपल्याला मार्गदर्शन करू शकतात.",
      applyFor: "{{code}} व्हिसासाठी अर्ज करा"
    },
    cta: {
      title: "योग्य व्हिसा निवडण्यासाठी मदत हवी आहे?",
      description: "आमचे इमिग्रेशन तज्ञ आपल्या परिस्थितीला सर्वोत्तम व्हिसा श्रेणी ठरवण्यात मदत करू शकतात.",
      button: "आपला अर्ज सुरू करा"
    },
    visas: {
      B1: { name: "व्यवसाय पाहुणे", description: "युनायटेड स्टेट्समध्ये तात्पुरत्या व्यावसायिक क्रियाकलापांसाठी व्यवसाय पाहुणे व्हिसा." },
      B2: { name: "पर्यटक पाहुणे", description: "आनंद, सुट्टी किंवा कुटुंब आणि मित्रांना भेटण्यासाठी पर्यटक व्हिसा." },
      F1: { name: "विद्यार्थी", description: "मान्यताप्राप्त यूएस संस्थांमध्ये शैक्षणिक अभ्यासासाठी विद्यार्थी व्हिसा." },
      F2: { name: "विद्यार्थी आश्रित", description: "F1 विद्यार्थ्यांच्या जोडीदार आणि 21 वर्षाखालील अविवाहित मुलांसाठी आश्रित व्हिसा." },
      H1B: { name: "विशेष व्यावसायिक कामगार", description: "स्नातक पदवी किंवा त्यापेक्षा जास्त असलेल्या व्यावसायिकांसाठी विशेष व्यवसाय व्हिसा." },
      H2A: { name: "कृषी कामगार", description: "हंगामी शेती कामासाठी तात्पुरते कृषी कामगार व्हिसा." },
      H4: { name: "H1B आश्रित", description: "H1B व्हिसा धारकांच्या जोडीदार आणि 21 वर्षाखालील अविवाहित मुलांसाठी आश्रित व्हिसा." },
      J1: { name: "देवाणघेवाण पाहुणे", description: "सांस्कृतिक देवाणघेवाण कार्यक्रमांसाठी देवाणघेवाण पाहुणे व्हिसा." },
      L1A: { name: "कंपनी-आंतर स्थानांतरण कार्यकारी", description: "व्यवस्थापक आणि कार्यकारी अधिकाऱ्यांसाठी कंपनी-आंतर स्थानांतरण व्हिसा." },
      L1B: { name: "कंपनी-आंतर स्थानांतरण तज्ञ", description: "विशेष ज्ञान असलेल्या कर्मचाऱ्यांसाठी कंपनी-आंतर स्थानांतरण व्हिसा." },
      L2: { name: "L1 आश्रित", description: "L1 व्हिसा धारकांच्या जोडीदार आणि 21 वर्षाखालील अविवाहित मुलांसाठी आश्रित व्हिसा." },
      O1: { name: "असाधारण क्षमता", description: "अपवादात्मक कौशल्ये असलेल्या व्यक्तींसाठी असाधारण क्षमता व्हिसा." },
      TN: { name: "NAFTA व्यावसायिक", description: "कॅनेडियन आणि मेक्सिकन नागरिकांसाठी NAFTA व्यावसायिक व्हिसा." },
      E2: { name: "करार गुंतवणूकदार", description: "यूएस व्यवसायात भरीव गुंतवणुकीसाठी करार गुंतवणूकदार व्हिसा." },
      EB1: { name: "प्राधान्य कामगार", description: "प्राधान्य कामगारांसाठी पहिले प्राधान्य रोजगार-आधारित ग्रीन कार्ड." },
      EB2: { name: "उच्च पदवी व्यावसायिक", description: "उच्च पदवी धारकांसाठी दुसरे प्राधान्य रोजगार-आधारित ग्रीन कार्ड." },
      EB3: { name: "कुशल कामगार", description: "कुशल कामगारांसाठी तिसरे प्राधान्य रोजगार-आधारित ग्रीन कार्ड." },
      EB4: { name: "विशेष इमिग्रंट्स", description: "विशेष इमिग्रंट्ससाठी चौथे प्राधान्य रोजगार-आधारित ग्रीन कार्ड." },
      EB5: { name: "गुंतवणूकदार इमिग्रंट्स", description: "गुंतवणूकदारांसाठी पाचवे प्राधान्य रोजगार-आधारित ग्रीन कार्ड." }
    }
  },
  'ta-IN': {
    title: "அமெரிக்க விசா வகைகள் நூலகம்",
    description: "பல்வேறு அமெரிக்க விசா வகைகள் பற்றிய விரிவான தகவல்களை ஆராயுங்கள். தகுதி தேவைகள், விண்ணப்ப செயல்முறை மற்றும் நன்மைகள் பற்றி அறிய எந்த விசா வகையிலும் கிளிக் செய்யவும்.",
    loading: "விசா தகவல் ஏற்றப்படுகிறது...",
    learnMore: "மேலும் அறிக",
    categories: {
      nonimmigrant: "குடியேற்றமற்ற விசாக்கள்",
      immigrant: "குடியேற்ற விசாக்கள்"
    },
    modal: {
      category: "வகை",
      description: "விளக்கம்",
      nextSteps: "அடுத்த படிகள்",
      readyToApply: "{{code}} விசாவிற்கு விண்ணப்பிக்க தயாரா? எங்கள் குடியேற்ற வழக்கறிஞர்கள் முழு செயல்முறையிலும் உங்களுக்கு வழிகாட்ட முடியும்.",
      applyFor: "{{code}} விசாவிற்கு விண்ணப்பிக்கவும்"
    },
    cta: {
      title: "சரியான விசாவை தேர்ந்தெடுக்க உதவி தேவையா?",
      description: "எங்கள் குடியேற்ற நிபுணர்கள் உங்கள் சூழ்நிலைக்கு ஏற்ற விசா வகையை தீர்மானிக்க உதவ முடியும்.",
      button: "உங்கள் விண்ணப்பத்தை தொடங்குங்கள்"
    },
    visas: {
      B1: { name: "வணிக பார்வையாளர்", description: "அமெரிக்காவில் தற்காலிக வணிக நடவடிக்கைகளுக்கான வணிக பார்வையாளர் விசா." },
      B2: { name: "சுற்றுலா பார்வையாளர்", description: "மகிழ்ச்சி, விடுமுறை அல்லது குடும்பம் மற்றும் நண்பர்களை சந்திப்பதற்கான சுற்றுலா விசா." },
      F1: { name: "மாணவர்", description: "அங்கீகரிக்கப்பட்ட அமெரிக்க நிறுவனங்களில் கல்வி படிப்புகளுக்கான மாணவர் விசா." },
      F2: { name: "மாணவர் சார்ந்தவர்", description: "F1 மாணவர்களின் வாழ்க்கைத் துணைவர்கள் மற்றும் 21 வயதுக்கு குறைவான திருமணமாகாத குழந்தைகளுக்கான சார்ந்த விசா." },
      H1B: { name: "சிறப்பு தொழில் தொழிலாளி", description: "இளங்கலை பட்டம் அல்லது அதற்கு மேல் உள்ள வல்லுநர்களுக்கான சிறப்பு தொழில் விசா." },
      H2A: { name: "விவசாய தொழிலாளி", description: "பருவகால பண்ணை வேலைக்கான தற்காலிக விவசாய தொழிலாளி விசா." },
      H4: { name: "H1B சார்ந்தவர்", description: "H1B விசா வைத்திருப்பவர்களின் வாழ்க்கைத் துணைவர்கள் மற்றும் 21 வயதுக்கு குறைவான திருமணமாகாத குழந்தைகளுக்கான சார்ந்த விசா." },
      J1: { name: "பரிமாற்ற பார்வையாளர்", description: "கலாசார பரிமாற்ற திட்டங்களுக்கான பரிமாற்ற பார்வையாளர் விசா." },
      L1A: { name: "நிறுவனத்திற்குள் மாற்றம் நிர்வாகி", description: "மேலாளர்கள் மற்றும் நிர்வாகிகளுக்கான நிறுவனத்திற்குள் மாற்றம் விசா." },
      L1B: { name: "நிறுவனத்திற்குள் மாற்றம் நிபுணர்", description: "சிறப்பு அறிவு கொண்ட பணியாளர்களுக்கான நிறுவனத்திற்குள் மாற்றம் விசா." },
      L2: { name: "L1 சார்ந்தவர்", description: "L1 விசா வைத்திருப்பவர்களின் வாழ்க்கைத் துணைவர்கள் மற்றும் 21 வயதுக்கு குறைவான திருமணமாகாத குழந்தைகளுக்கான சார்ந்த விசா." },
      O1: { name: "அசாதாரண திறன்", description: "விதிவிலக்கான திறன்களைக் கொண்ட தனிநபர்களுக்கான அசாதாரண திறன் விசா." },
      TN: { name: "NAFTA வல்லுநர்", description: "கனடா மற்றும் மெக்சிக்கோ குடிமக்களுக்கான NAFTA வல்லுநர் விசா." },
      E2: { name: "ஒப்பந்த முதலீட்டாளர்", description: "அமெரிக்க வணிகத்தில் கணிசமான முதலீட்டுக்கான ஒப்பந்த முதலீட்டாளர் விசா." },
      EB1: { name: "முன்னுரிமை தொழிலாளர்கள்", description: "முன்னுரிமை தொழிலாளர்களுக்கான முதல் முன்னுரிமை வேலைவாய்ப்பு அடிப்படையிலான பசுமை அட்டை." },
      EB2: { name: "உயர் பட்டம் வல்லுநர்கள்", description: "உயர் பட்டம் வைத்திருப்பவர்களுக்கான இரண்டாவது முன்னுரிமை வேலைவாய்ப்பு அடிப்படையிலான பசுமை அட்டை." },
      EB3: { name: "திறமையான தொழிலாளர்கள்", description: "திறமையான தொழிலாளர்களுக்கான மூன்றாவது முன்னுரிமை வேலைவாய்ப்பு அடிப்படையிலான பசுமை அட்டை." },
      EB4: { name: "சிறப்பு குடியேறியவர்கள்", description: "சிறப்பு குடியேறியவர்களுக்கான நான்காவது முன்னுரிமை வேலைவாய்ப்பு அடிப்படையிலான பசுமை அட்டை." },
      EB5: { name: "முதலீட்டாளர் குடியேறியவர்கள்", description: "முதலீட்டாளர்களுக்கான ஐந்தாவது முன்னுரிமை வேலைவாய்ப்பு அடிப்படையிலான பசுமை அட்டை." }
    }
  },
  'te-IN': {
    title: "US వీసా రకాల లైబ్రరీ",
    description: "విభిన్న US వీసా వర్గాల గురించి సమగ్ర సమాచారాన్ని అన్వేషించండి. అర్హత అవసరాలు, దరఖాస్తు ప్రక్రియ మరియు ప్రయోజనాల గురించి తెలుసుకోవడానికి ఏదైనా వీసా రకాన్ని క్లిక్ చేయండి.",
    loading: "వీసా సమాచారం లోడ్ అవుతోంది...",
    learnMore: "మరింత తెలుసుకోండి",
    categories: {
      nonimmigrant: "నాన్-ఇమ్మిగ్రేంట్ వీసాలు",
      immigrant: "ఇమ్మిగ్రేంట్ వీసాలు"
    },
    modal: {
      category: "వర్గం",
      description: "వివరణ",
      nextSteps: "తదుపరి దశలు",
      readyToApply: "{{code}} వీసాకు దరఖాస్తు చేయడానికి సిద్ధంగా ఉన్నారా? మా ఇమ్మిగ్రేషన్ న్యాయవాదులు మొత్తం ప్రక్రియలో మీకు మార్గదర్శకత్వం చేయగలరు.",
      applyFor: "{{code}} వీసాకు దరఖాస్తు చేయండి"
    },
    cta: {
      title: "సరైన వీసా ఎంచుకోవడానికి సహాయం అవసరమా?",
      description: "మా ఇమ్మిగ్రేషన్ నిపుణులు మీ పరిస్థితికి ఉత్తమంగా సరిపోయే వీసా వర్గాన్ని నిర్ణయించడంలో మీకు సహాయపడగలరు.",
      button: "మీ దరఖాస్తును ప్రారంభించండి"
    },
    visas: {
      B1: { name: "వ్యాపార సందర్శకుడు", description: "యునైటెడ్ స్టేట్స్లో తాత్కాలిక వ్యాపార కార్యకలాపాల కోసం వ్యాపార సందర్శకుడి వీసా." },
      B2: { name: "టూరిస్ట్ సందర్శకుడు", description: "ఆనందం, సెలవుదినం లేదా కుటుంబం మరియు స్నేహితులను సందర్శించడం కోసం టూరిస్ట్ వీసా." },
      F1: { name: "విద్యార్థి", description: "గుర్తింపు పొందిన US సంస్థలలో అకాడమిక్ అధ్యయనాల కోసం విద్యార్థి వీసా." },
      F2: { name: "విద్యార్థి ఆశ్రితుడు", description: "F1 విద్యార్థుల భాగస్వాములు మరియు 21 సంవత్సరాల కంటే తక్కువ వయస్సు ఉన్న అవివాహిత పిల్లల కోసం ఆశ్రిత వీసా." },
      H1B: { name: "ప్రత్యేక వృత్తి కార్యకర్త", description: "బ్యాచిలర్ డిగ్రీ లేదా అంతకంటే ఎక్కువ ఉన్న నిపుణుల కోసం ప్రత్యేక వృత్తి వీసా." },
      H2A: { name: "వ్యవసాయ కార్మికుడు", description: "కాలానుగుణ వ్యవసాయ పని కోసం తాత్కాలిక వ్యవసాయ కార్మికుల వీసా." },
      H4: { name: "H1B ఆశ్రితుడు", description: "H1B వీసా హోల్డర్ల భాగస్వాములు మరియు 21 సంవత్సరాల కంటే తక్కువ వయస్సు ఉన్న అవివాహిత పిల్లల కోసం ఆశ్రిత వీసా." },
      J1: { name: "మార్పిడి సందర్శకుడు", description: "సాంస్కృతిక మార్పిడి కార్యక్రమాల కోసం మార్పిడి సందర్శకుడి వీసా." },
      L1A: { name: "కంపెనీ-అంతర బదిలీ కార్యనిర్వాహకుడు", description: "నిర్వాహకులు మరియు కార్యనిర్వాహకుల కోసం కంపెనీ-అంతర బదిలీ వీసా." },
      L1B: { name: "కంపెనీ-అంతర బదిలీ నిపుణుడు", description: "ప్రత్యేక జ్ఞానం ఉన్న ఉద్యోగుల కోసం కంపెనీ-అంతర బదిలీ వీసా." },
      L2: { name: "L1 ఆశ్రితుడు", description: "L1 వీసా హోల్డర్ల భాగస్వాములు మరియు 21 సంవత్సరాల కంటే తక్కువ వయస్సు ఉన్న అవివాహిత పిల్లల కోసం ఆశ్రిత వీసా." },
      O1: { name: "అసాధారణ సామర్థ్యం", description: "అసాధారణ నైపుణ్యాలు ఉన్న వ్యక్తుల కోసం అసాధారణ సామర్థ్య వీసా." },
      TN: { name: "NAFTA నిపుణుడు", description: "కెనడియన్ మరియు మెక్సికన్ పౌరుల కోసం NAFTA నిపుణుడు వీసా." },
      E2: { name: "ఒప్పంద పెట్టుబడిదారు", description: "US వ్యాపారంలో గణనీయమైన పెట్టుబడి కోసం ఒప్పంద పెట్టుబడిదారు వీసా." },
      EB1: { name: "ప్రాధాన్యత కార్మికులు", description: "ప్రాధాన్యత కార్మికుల కోసం మొదటి ప్రాధాన్యత ఉపాధి-ఆధారిత గ్రీన్ కార్డ్." },
      EB2: { name: "అధునాతన డిగ్రీ నిపుణులు", description: "అధునాతన డిగ్రీ హోల్డర్ల కోసం రెండవ ప్రాధాన్యత ఉపాధి-ఆధారిత గ్రీన్ కార్డ్." },
      EB3: { name: "నైపుణ్యం కలిగిన కార్మికులు", description: "నైపుణ్యం కలిగిన కార్మికుల కోసం మూడవ ప్రాధాన్యత ఉపాధి-ఆధారిత గ్రీన్ కార్డ్." },
      EB4: { name: "ప్రత్యేక ఇమ్మిగ్రెంట్లు", description: "ప్రత్యేక ఇమ్మిగ్రెంట్ల కోసం నాల్గవ ప్రాధాన్యత ఉపాధి-ఆధారిత గ్రీన్ కార్డ్." },
      EB5: { name: "పెట్టుబడిదారు ఇమ్మిగ్రెంట్లు", description: "పెట్టుబడిదారుల కోసం ఐదవ ప్రాధాన్యత ఉపాధి-ఆధారిత గ్రీన్ కార్డ్." }
    }
  },
  'ur-PK': {
    title: "امریکی ویزا کی اقسام کی لائبریری",
    description: "مختلف امریکی ویزا زمروں کے بارے میں جامع معلومات کو دریافت کریں۔ اہلیت کی ضروریات، درخواست کے عمل اور فوائد کے بارے میں جاننے کے لیے کسی بھی ویزا کی قسم پر کلک کریں۔",
    loading: "ویزا کی معلومات لوڈ ہو رہی ہیں...",
    learnMore: "مزید جانیں",
    categories: {
      nonimmigrant: "غیر تارکین وطن ویزے",
      immigrant: "تارکین وطن ویزے"
    },
    modal: {
      category: "زمرہ",
      description: "تفصیل",
      nextSteps: "اگلے مراحل",
      readyToApply: "{{code}} ویزا کے لیے درخواست دینے کے لیے تیار ہیں؟ ہمارے امیگریشن وکلاء پورے عمل میں آپ کی رہنمائی کر سکتے ہیں۔",
      applyFor: "{{code}} ویزا کے لیے درخواست دیں"
    },
    cta: {
      title: "صحیح ویزا کا انتخاب کرنے میں مدد کی ضرورت ہے؟",
      description: "ہمارے امیگریشن ماہرین آپ کی صورتحال کے لیے سب سے موزوں ویزا زمرہ کا تعین کرنے میں مدد کر سکتے ہیں۔",
      button: "اپنی درخواست شروع کریں"
    },
    visas: {
      B1: { name: "کاروباری زائر", description: "ریاستہائے متحدہ میں عارضی کاروباری سرگرمیوں کے لیے کاروباری زائر ویزا۔" },
      B2: { name: "سیاحتی زائر", description: "تفریح، چھٹی یا خاندان اور دوستوں سے ملنے کے لیے سیاحتی ویزا۔" },
      F1: { name: "طالب علم", description: "منظور شدہ امریکی اداروں میں تعلیمی مطالعہ کے لیے طالب علم ویزا۔" },
      F2: { name: "طالب علم کے زیر کفالت", description: "F1 طلباء کے شریک حیات اور 21 سال سے کم عمر کے غیر شادی شدہ بچوں کے لیے زیر کفالت ویزا۔" },
      H1B: { name: "خصوصی پیشے کا کارکن", description: "بیچلر کی ڈگری یا اس سے اوپر کے پیشہ ور افراد کے لیے خصوصی پیشے کا ویزا۔" },
      H2A: { name: "زرعی کارکن", description: "موسمی فارم مزدوری کے لیے عارضی زرعی کارکن ویزا۔" },
      H4: { name: "H1B کے زیر کفالت", description: "H1B ویزا رکھنے والوں کے شریک حیات اور 21 سال سے کم عمر کے غیر شادی شدہ بچوں کے لیے زیر کفالت ویزا۔" },
      J1: { name: "تبادلہ زائر", description: "ثقافتی تبادلہ پروگراموں کے لیے تبادلہ زائر ویزا۔" },
      L1A: { name: "کمپنی کے اندر منتقلی ایگزیکٹو", description: "مینیجرز اور ایگزیکٹوز کے لیے کمپنی کے اندر منتقلی ویزا۔" },
      L1B: { name: "کمپنی کے اندر منتقلی ماہر", description: "خصوصی علم رکھنے والے ملازمین کے لیے کمپنی کے اندر منتقلی ویزا۔" },
      L2: { name: "L1 کے زیر کفالت", description: "L1 ویزا رکھنے والوں کے شریک حیات اور 21 سال سے کم عمر کے غیر شادی شدہ بچوں کے لیے زیر کفالت ویزا۔" },
      O1: { name: "غیر معمولی صلاحیت", description: "غیر معمولی مہارت رکھنے والے افراد کے لیے غیر معمولی صلاحیت کا ویزا۔" },
      TN: { name: "NAFTA پیشہ ور", description: "کینیڈین اور میکسیکن شہریوں کے لیے NAFTA پیشہ ور ویزا۔" },
      E2: { name: "معاہدہ سرمایہ کار", description: "امریکی کاروبار میں کافی سرمایہ کاری کے لیے معاہدہ سرمایہ کار ویزا۔" },
      EB1: { name: "ترجیحی کارکنان", description: "ترجیحی کارکنان کے لیے پہلی ترجیح روزگار پر مبنی گرین کارڈ۔" },
      EB2: { name: "اعلیٰ ڈگری پیشہ ور", description: "اعلیٰ ڈگری رکھنے والوں کے لیے دوسری ترجیح روزگار پر مبنی گرین کارڈ۔" },
      EB3: { name: "ہنر مند کارکنان", description: "ہنر مند کارکنان کے لیے تیسری ترجیح روزگار پر مبنی گرین کارڈ۔" },
      EB4: { name: "خصوصی تارکین وطن", description: "خصوصی تارکین وطن کے لیے چوتھی ترجیح روزگار پر مبنی گرین کارڈ۔" },
      EB5: { name: "سرمایہ کار تارکین وطن", description: "سرمایہ کاروں کے لیے پانچویں ترجیح روزگار پر مبنی گرین کارڈ۔" }
    }
  }
};

// Merge Indian languages into translations
Object.assign(translations, indianLanguages);

// Function to update a language file
function updateLanguageFile(langCode) {
  const filePath = path.join(__dirname, '..', 'web', 'l4h', 'public', 'locales', langCode, 'common.json');

  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(data);

    // Update visaLibrary section
    json.visaLibrary = translations[langCode];

    // Write back to file
    fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf8');
    console.log(`✅ Updated ${langCode}/common.json`);

    return true;
  } catch (error) {
    console.error(`❌ Error updating ${langCode}:`, error.message);
    return false;
  }
}

// Main execution
const languages = Object.keys(translations);
console.log(`🌍 Updating visa library translations for ${languages.length} languages...\n`);

let successCount = 0;
let failCount = 0;

languages.forEach(lang => {
  if (updateLanguageFile(lang)) {
    successCount++;
  } else {
    failCount++;
  }
});

console.log(`\n📊 Summary:`);
console.log(`   ✅ Successfully updated: ${successCount} languages`);
console.log(`   ❌ Failed: ${failCount} languages`);
console.log(`\nDone!`);

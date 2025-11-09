# Translation Files Export

This archive contains all translation JSON files from the Law4Hire project.

## Archive Information

- **File**: `translations-export.tar.gz`
- **Size**: 210 KB (compressed)
- **Total JSON Files**: 440 files
- **Languages**: 21 languages
- **Created**: 2025-10-31

## Directory Structure

```
translations-export/
├── l4h-locales/              # Law4Hire main application translations
│   ├── ar-SA/                # Arabic (Saudi Arabia) - RTL
│   ├── bn-BD/                # Bengali (Bangladesh)
│   ├── de-DE/                # German (Germany)
│   ├── en-US/                # English (United States)
│   ├── es-ES/                # Spanish (Spain)
│   ├── fr-FR/                # French (France)
│   ├── hi-IN/                # Hindi (India)
│   ├── id-ID/                # Indonesian (Indonesia)
│   ├── it-IT/                # Italian (Italy)
│   ├── ja-JP/                # Japanese (Japan)
│   ├── ko-KR/                # Korean (Korea)
│   ├── mr-IN/                # Marathi (India)
│   ├── pl-PL/                # Polish (Poland)
│   ├── pt-BR/                # Portuguese (Brazil)
│   ├── ru-RU/                # Russian (Russia)
│   ├── ta-IN/                # Tamil (India)
│   ├── te-IN/                # Telugu (India)
│   ├── tl-PH/                # Tagalog (Philippines)
│   ├── tr-TR/                # Turkish (Turkey)
│   ├── ur-PK/                # Urdu (Pakistan)
│   ├── vi-VN/                # Vietnamese (Vietnam)
│   ├── zh-CN/                # Chinese Simplified (China)
│   └── l4h/                  # Law4Hire specific translations
│       └── [same 21 languages]/
│           ├── dashboard.json
│           ├── interview.json
│           ├── pricing.json
│           └── visa-library.json
│
├── shared-ui-locales/        # Shared UI component translations
│   └── shared/
│       └── [21 languages]/
│           ├── auth.json
│           ├── common.json
│           ├── errors.json
│           └── forms.json
│
└── cannlaw-locales/          # Cannlaw website translations
    └── cannlaw/
        └── [21 languages]/
            ├── billing.json
            ├── cases.json
            ├── clients.json
            └── legal.json
```

## Files per Language

### Law4Hire Main (l4h-locales/{language}/)
- `auth.json` - Authentication forms (login, register, profile completion)
- `common.json` - Common UI elements (navigation, buttons, etc.)
- `errors.json` - Error messages
- `forms.json` - Form validation and labels
- `interview.json` - Visa interview questions
- `landing.json` - Landing page content
- `login.json` - Login-specific content (deprecated - merged into auth.json)
- `visaLibrary.json` - Visa library content

**Total per language**: 8 files

### Law4Hire L4H Subdirectory (l4h-locales/l4h/{language}/)
- `dashboard.json` - Dashboard-specific translations
- `interview.json` - L4H interview content
- `pricing.json` - Pricing page content
- `visa-library.json` - Visa library page

**Total per language**: 4 files

### Shared UI (shared-ui-locales/shared/{language}/)
- `auth.json` - Shared authentication
- `common.json` - Shared common elements
- `errors.json` - Shared error messages
- `forms.json` - Shared form content

**Total per language**: 4 files

### Cannlaw (cannlaw-locales/cannlaw/{language}/)
- `billing.json` - Billing and invoicing
- `cases.json` - Case management
- `clients.json` - Client management
- `legal.json` - Legal-specific content

**Total per language**: 4 files

## Language Codes

| Code | Language | Region | RTL |
|------|----------|--------|-----|
| ar-SA | Arabic | Saudi Arabia | ✓ |
| bn-BD | Bengali | Bangladesh | |
| de-DE | German | Germany | |
| en-US | English | United States | |
| es-ES | Spanish | Spain | |
| fr-FR | French | France | |
| hi-IN | Hindi | India | |
| id-ID | Indonesian | Indonesia | |
| it-IT | Italian | Italy | |
| ja-JP | Japanese | Japan | |
| ko-KR | Korean | Korea | |
| mr-IN | Marathi | India | |
| pl-PL | Polish | Poland | |
| pt-BR | Portuguese | Brazil | |
| ru-RU | Russian | Russia | |
| ta-IN | Tamil | India | |
| te-IN | Telugu | India | |
| tl-PH | Tagalog | Philippines | |
| tr-TR | Turkish | Turkey | |
| ur-PK | Urdu | Pakistan | ✓ |
| vi-VN | Vietnamese | Vietnam | |
| zh-CN | Chinese Simplified | China | |

## Translation Completion Status

### Auth.json Files (103 keys per file)

**Fully Translated (10/21 languages):**
- ✅ Arabic (ar-SA)
- ✅ Bengali (bn-BD)
- ✅ Chinese (zh-CN)
- ✅ French (fr-FR)
- ✅ German (de-DE)
- ✅ Hindi (hi-IN)
- ✅ Japanese (ja-JP)
- ✅ Portuguese (pt-BR)
- ✅ Spanish (es-ES)
- ✅ Turkish (tr-TR)

**Pending Translation (11/21 languages):**
- ⏳ Indonesian (id-ID)
- ⏳ Italian (it-IT)
- ⏳ Korean (ko-KR)
- ⏳ Marathi (mr-IN)
- ⏳ Polish (pl-PL)
- ⏳ Russian (ru-RU)
- ⏳ Tamil (ta-IN)
- ⏳ Telugu (te-IN)
- ⏳ Tagalog (tl-PH)
- ⏳ Urdu (ur-PK)
- ⏳ Vietnamese (vi-VN)

Note: Pending languages currently contain English placeholder text in auth.json lines 1-55.

## Usage

### Extracting the Archive

```bash
# Extract to current directory
tar -xzf translations-export.tar.gz

# Extract to specific directory
tar -xzf translations-export.tar.gz -C /path/to/destination
```

### Restoring to Project

To restore these translations to the Law4Hire project:

```bash
# From project root
cp -r translations-export/l4h-locales/* web/l4h/public/locales/
cp -r translations-export/shared-ui-locales/* web/shared-ui/public/locales/
cp -r translations-export/cannlaw-locales/* web/cannlaw/public/locales/
```

## Notes

- All JSON files use UTF-8 encoding
- RTL (Right-to-Left) languages are Arabic (ar-SA) and Urdu (ur-PK)
- Translation keys use dot notation (e.g., `t('auth.email')`)
- Namespaces are specified in i18next configuration
- Each file follows strict JSON formatting standards

## Project Information

- **Project**: Law4Hire Legal Services Platform
- **Technology**: React + i18next
- **Framework**: Vite + TypeScript
- **Translation System**: i18next with react-i18next

## Contact

For questions about translations or to contribute new translations, please contact the development team.

---

*Last Updated: 2025-10-31*
*Version: 1.0*

# L4H Comprehensive UI Test Suite

This comprehensive UI test suite provides complete coverage for the L4H interview system, including visa workflows, localization, adoption processes, and citizenship applications.

## 🎯 Test Coverage

### Visa Type Tests by Country/Nationality
- **Employment Visas**: H-1B (India), L-1A (Japan), O-1 (Andorra), TN (Chile), E-3 (Australia)
- **Investment Visas**: E-2 (Germany), EB-5 (Saudi Arabia)
- **Family Visas**: K-1 (Russia), IR-1 (Philippines)
- **Student Visas**: F-1 (Brazil)
- **Tourism Visas**: B-2 (France)
- **Treaty Visas**: E-1 (Japan), E-2 (Germany)

### Adoption Workflows (US Citizens Only)
- **IR-3 Visas**: Adoption completed abroad (China, Guatemala, India, Ethiopia)
- **IR-4 Visas**: Adoption to be completed in US (Russia, Ukraine)
- **Special Cases**: Single parent adoption, special needs children
- **Documentation**: Home study, adoption agency, legal requirements

### Citizenship/Naturalization Workflows
- **N-400**: Naturalization applications (Mexico, India, Philippines with military service)
- **N-600**: Certificate of citizenship (Korea, Brazil)
- **Eligibility Tests**: Residency requirements, criminal history checks
- **Test Preparation**: English proficiency, civics knowledge

### Localization Testing (21 Languages)
- **All Languages**: ar-SA, bn-BD, zh-CN, de-DE, es-ES, fr-FR, hi-IN, id-ID, it-IT, ja-JP, ko-KR, mr-IN, pl-PL, pt-BR, ru-RU, ta-IN, te-IN, tr-TR, ur-PK, vi-VN, en-US
- **RTL Support**: Arabic (ar-SA), Urdu (ur-PK)
- **Character Encoding**: Native scripts validation
- **Language Switching**: Mid-interview language changes

## 🚀 Running Tests in Visual Studio

### Prerequisites
1. **Visual Studio 2022 or 2026** with .NET 9.0 support
2. **Test Explorer** enabled (View → Test Explorer)
3. **L4H Application** running on `http://localhost:5173`
4. **Playwright Browsers** installed (tests will auto-install if needed)

### Running Individual Tests
1. Open **Test Explorer** (View → Test Explorer)
2. Build the solution (Ctrl+Shift+B)
3. Tests will appear organized by category:
   ```
   📁 L4H.UI.E2E.Tests
   ├── 📁 ComprehensiveVisualStudioUITests
   │   ├── 🇮🇳 India → H-1B Specialty Occupation
   │   ├── 🇯🇵 Japan → L-1A Intracompany Executive
   │   ├── 🇦🇩 Andorra → O-1 Extraordinary Ability
   │   └── ...
   ├── 📁 AdoptionWorkflowTests
   │   ├── 🇺🇸→🇨🇳 US Citizen Adopting Chinese Child (IR-3)
   │   ├── 🇺🇸→🇷🇺 US Citizen Adopting Russian Child (IR-4)
   │   └── ...
   ├── 📁 CitizenshipNaturalizationTests
   │   ├── 🇲🇽→🇺🇸 Mexican Permanent Resident → N-400
   │   ├── 🇰🇷→🇺🇸 Korean Child → N-600 Certificate
   │   └── ...
   └── 📁 LocalizationComprehensiveTests
       ├── 🇸🇦 Arabic (ar-SA) Localization Test
       ├── 🇨🇳 Chinese Simplified (zh-CN) Localization Test
       └── ...
   ```

4. **Right-click** any test to:
   - **Run Selected Tests**: Execute specific tests
   - **Debug Selected Tests**: Run with debugging
   - **Run Tests Until Failure**: Continuous testing

### Visual Test Execution
- Tests run with **non-headless browsers** for visual feedback
- **SlowMo: 500ms** - Actions are slowed down for visibility
- **Console output** appears in Test Explorer output window
- **Screenshots** on failures (if configured)

### Test User Credentials
All test users are created with:
- **Email domains**: `@testing.com` or `@law4hire.com`
- **Password**: `SecureTest123!`
- **Unique identifiers**: Each test creates unique users to avoid conflicts

## 📊 Test Categories

### 1. Employment-Based Visa Tests
Tests visa eligibility for various employment scenarios with country-specific requirements.

**Example Test**: `India_H1B_Specialty_Occupation_Test`
- Creates Indian national user
- Completes profile with education and work details
- Runs interview expecting H-1B recommendation

### 2. Adoption Workflow Tests
Tests complete adoption process for US Citizens adopting foreign children.

**Example Test**: `USCitizen_IR3_Chinese_Child_Adoption_Test`
- Creates US Citizen user profile
- Provides adoption-specific information (child details, agency, home study)
- Validates IR-3 visa recommendation

### 3. Citizenship Tests
Tests naturalization and certificate of citizenship processes.

**Example Test**: `Mexican_PermanentResident_N400_Naturalization_Test`
- Creates permanent resident profile
- Provides residency and eligibility information
- Validates N-400 application recommendation

### 4. Localization Tests
Tests complete localization functionality for all supported languages.

**Example Test**: `Arabic_Localization_Test`
- Switches interface to Arabic
- Validates RTL layout and character encoding
- Confirms proper translation display

## 🔧 Configuration

### Test Settings
- **Parallel Execution**: Disabled for browser stability
- **Test Timeout**: 60 seconds per test
- **Browser**: Chromium (non-headless for visibility)
- **Retry Policy**: No automatic retries (for debugging)

### Environment Requirements
- **Base URL**: `http://localhost:5173` (configurable in test files)
- **API Endpoints**: Tests assume standard L4H API structure
- **Database**: Tests create unique users to avoid conflicts

## 🐛 Troubleshooting

### Common Issues

1. **Tests Not Appearing in Test Explorer**
   - Rebuild solution (Build → Rebuild Solution)
   - Check that .NET 9.0 is installed
   - Verify test project references are correct

2. **Browser Launch Failures**
   - Run `playwright install` in terminal
   - Check Windows Defender/antivirus settings
   - Ensure no other browser automation is running

3. **Application Not Running**
   - Start L4H application on `http://localhost:5173`
   - Verify API endpoints are accessible
   - Check database connectivity

4. **Test Failures Due to Missing Workflows**
   - **Adoption tests failing**: Adoption workflow not implemented
   - **Citizenship tests failing**: Citizenship workflow not implemented
   - **Localization tests failing**: Translation files missing

### Debug Mode
To debug failing tests:
1. Right-click test in Test Explorer
2. Select "Debug Selected Tests"
3. Set breakpoints in test code
4. Browser will pause at breakpoints for inspection

## 📝 Adding New Tests

### Creating Country-Specific Tests
```csharp
[Fact(DisplayName = "🇳🇬 Nigeria → DV Lottery")]
public async Task Nigeria_DV_Lottery_Test()
{
    var page = await CreateNewPage().ConfigureAwait(false);
    try
    {
        var email = $"dv-nigeria-{Guid.NewGuid().ToString()[..8]}@testing.com";
        await RegisterUser(page, email, "Adaora", "Okafor", "Nigeria").ConfigureAwait(false);
        // ... test implementation
    }
    finally
    {
        await page.CloseAsync().ConfigureAwait(false);
    }
}
```

### Adding Language Tests
```csharp
[Fact(DisplayName = "🇹🇭 Thai (th-TH) Localization Test")]
public async Task Thai_Localization_Test()
{
    // Follow pattern from existing localization tests
}
```

## 📈 Test Reporting

### Visual Studio Integration
- Test results appear in **Test Explorer**
- **Output window** shows detailed logs
- **Failed tests** show error details and stack traces
- **Test duration** and **pass/fail counts** displayed

### Continuous Integration
Tests can be run in CI/CD pipelines with:
```bash
dotnet test tests/ui.e2e/L4H.UI.E2E.Tests.csproj --logger "trx;LogFileName=test-results.trx"
```

## 🎯 Success Criteria

### Test Validation
Each test validates:
- ✅ **User Registration**: Successful account creation
- ✅ **Profile Completion**: All required fields filled
- ✅ **Interview Flow**: Questions answered appropriately
- ✅ **Visa Recommendation**: Correct visa type suggested
- ✅ **Localization**: Proper language display and RTL support

### Coverage Goals
- **Visa Types**: All major visa categories covered
- **Countries**: Representative sample of major source countries
- **Languages**: All 21 supported languages tested
- **Workflows**: Adoption and citizenship processes validated
- **Edge Cases**: Error handling and validation tested

This comprehensive test suite ensures the L4H platform works correctly for users from all supported countries and languages, with proper visa recommendations and complete workflow coverage.
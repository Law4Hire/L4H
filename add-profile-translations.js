const fs = require('fs');
const path = require('path');

// All 21 supported languages
const languages = [
  'ar-SA', 'bn-BD', 'de-DE', 'en-US', 'es-ES', 'fr-FR',
  'hi-IN', 'id-ID', 'it-IT', 'ja-JP', 'ko-KR', 'mr-IN',
  'pl-PL', 'pt-BR', 'ru-RU', 'ta-IN', 'te-IN', 'tl-PH',
  'tr-TR', 'ur-PK', 'vi-VN', 'zh-CN'
];

// Profile completion translations (English source)
const profileTranslations = {
  'completeProfile': 'Complete Your Profile',
  'profileCompletionDescription': 'Help us serve you better by completing your profile information.',
  'countryOfResidence': 'Country of Residence',
  'selectCountry': 'Search and select your country...',
  'noCountriesFound': 'No countries found',
  'stateTerritory': 'State/Territory',
  'selectState': 'Search and select your state...',
  'noStatesFound': 'No states found',
  'streetAddress': 'Street Address',
  'streetAddressRequired': 'Street address is required',
  'city': 'City',
  'cityRequired': 'City is required',
  'postalCode': 'Postal Code',
  'postalCodeRequired': 'Postal code is required',
  'passportCountry': 'Passport Country (Nationality)',
  'selectPassportCountry': 'Search and select your passport country...',
  'dateOfBirth': 'Date of Birth',
  'dateOfBirthRequired': 'Date of birth is required',
  'dateOfBirthInvalid': 'Please enter a valid date',
  'dateOfBirthTooOld': 'Please enter a valid date of birth',
  'dateOfBirthFuture': 'Date of birth cannot be in the future',
  'maritalStatus': 'Marital Status',
  'maritalStatusRequired': 'Marital status is required',
  'selectMaritalStatus': 'Select marital status...',
  'single': 'Single',
  'married': 'Married',
  'divorced': 'Divorced',
  'widowed': 'Widowed',
  'gender': 'Gender',
  'genderRequired': 'Gender is required',
  'selectGender': 'Select gender...',
  'male': 'Male',
  'female': 'Female',
  'other': 'Other',
  'preferNotToSay': 'Prefer not to say',
  'guardianEmails': 'Parent/Guardian Email Addresses',
  'guardianEmailsNote': 'Guardians will receive invitations to view your case',
  'guardianEmail': 'Guardian Email',
  'addGuardianEmail': 'Add Another Guardian Email',
  'profileCompleted': 'Profile completed successfully!',
  'profileCompletionFailed': 'Failed to complete profile. Please try again.',
  'skipForNow': 'Skip for now',
  'welcomeBack': 'Welcome Back',
  'checkingEmail': 'Checking email...',
  'loginSuccess': 'Login successful!',
  'registrationSuccess': 'Registration successful! Welcome to Law4Hire.',
  'registrationFailed': 'Registration failed. Please try again.'
};

// Add translations to auth.json for each language
languages.forEach(lang => {
  const authFilePath = path.join(__dirname, 'web', 'l4h', 'public', 'locales', lang, 'auth.json');

  try {
    // Read existing auth.json
    const authContent = fs.readFileSync(authFilePath, 'utf8');
    const authData = JSON.parse(authContent);

    // Add new keys (don't overwrite existing ones)
    let updated = false;
    Object.keys(profileTranslations).forEach(key => {
      if (!authData[key]) {
        authData[key] = profileTranslations[key];
        updated = true;
      }
    });

    if (updated) {
      // Write back to file
      fs.writeFileSync(authFilePath, JSON.stringify(authData, null, 2) + '\n', 'utf8');
      console.log(`✓ Updated ${lang}/auth.json`);
    } else {
      console.log(`- ${lang}/auth.json already has all keys`);
    }
  } catch (error) {
    console.error(`✗ Error updating ${lang}/auth.json:`, error.message);
  }
});

console.log('\nProfile completion translations added to all languages!');
console.log('Note: Translations are in English. Professional translation should be done for non-English languages.');

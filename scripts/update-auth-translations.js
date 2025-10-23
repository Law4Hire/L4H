const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '..', 'web', 'l4h', 'public', 'locales');

const languages = [
  'ar-SA', 'bn-BD', 'de-DE', 'es-ES', 'fr-FR', 'hi-IN',
  'id-ID', 'it-IT', 'ja-JP', 'ko-KR', 'mr-IN', 'pl-PL', 'pt-BR',
  'ru-RU', 'ta-IN', 'te-IN', 'tr-TR', 'ur-PK', 'vi-VN', 'zh-CN'
];

// Root level keys that need to be added
const rootKeys = {
  "createAccount": "Create Account",
  "alreadyHaveAccount": "Already have an account?",
  "firstName": "First Name",
  "lastName": "Last Name",
  "email": "Email Address",
  "password": "Password",
  "confirmPassword": "Confirm Password",
  "signup": "Sign Up",
  "firstNameRequired": "First name is required",
  "lastNameRequired": "Last name is required",
  "emailRequired": "Email is required",
  "emailInvalid": "Please enter a valid email address",
  "passwordRequired": "Password is required",
  "passwordTooShort": "Password must be at least 8 characters",
  "passwordNeedsSpecialChar": "Password must contain at least one special character",
  "passwordConfirmRequired": "Please confirm your password",
  "passwordsMustMatch": "Passwords must match"
};

let updated = 0;
let skipped = 0;

console.log('Updating auth.json files with root-level keys...\n');

languages.forEach(lang => {
  const authPath = path.join(localesDir, lang, 'auth.json');

  if (!fs.existsSync(authPath)) {
    console.log(`⚠️  Skipping ${lang} - auth.json does not exist`);
    skipped++;
    return;
  }

  try {
    const content = JSON.parse(fs.readFileSync(authPath, 'utf8'));
    
    // Add root keys if they don't exist
    let modified = false;
    Object.keys(rootKeys).forEach(key => {
      if (!content[key]) {
        content[key] = rootKeys[key];
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(authPath, JSON.stringify(content, null, 2), 'utf8');
      console.log(`✅ Updated auth.json for ${lang}`);
      updated++;
    } else {
      console.log(`⏭️  auth.json for ${lang} already has all keys`);
      skipped++;
    }
  } catch (error) {
    console.log(`❌ Error updating ${lang}: ${error.message}`);
    skipped++;
  }
});

console.log(`\n=== Summary ===`);
console.log(`Updated: ${updated} files`);
console.log(`Skipped: ${skipped} files`);

const fs = require('fs');
const path = require('path');

// Base directory for translations
const localesDir = path.join(__dirname, '..', 'web', 'l4h', 'public', 'locales');

// All supported languages
const languages = [
  'ar-SA', 'bn-BD', 'de-DE', 'es-ES', 'fr-FR', 'hi-IN',
  'id-ID', 'it-IT', 'ja-JP', 'ko-KR', 'mr-IN', 'pl-PL', 'pt-BR',
  'ru-RU', 'ta-IN', 'te-IN', 'tr-TR', 'ur-PK', 'vi-VN', 'zh-CN'
];

// Template files (using English as base, but keys only - values will be placeholder)
const formsTemplate = {
  "validation": {
    "required": "This field is required",
    "email": "Please enter a valid email address",
    "phone": "Please enter a valid phone number",
    "minLength": "Must be at least {{min}} characters",
    "maxLength": "Must be no more than {{max}} characters",
    "pattern": "Please enter a valid value",
    "number": "Please enter a valid number",
    "min": "Must be at least {{min}}",
    "max": "Must be no more than {{max}}"
  },
  "labels": {
    "firstName": "First Name",
    "lastName": "Last Name",
    "email": "Email Address",
    "phone": "Phone Number",
    "submit": "Submit",
    "cancel": "Cancel",
    "save": "Save",
    "delete": "Delete",
    "edit": "Edit",
    "back": "Back",
    "next": "Next",
    "previous": "Previous"
  }
};

const authTemplate = {
  "login": {
    "title": "Sign In",
    "email": "Email Address",
    "password": "Password",
    "submit": "Sign In",
    "forgotPassword": "Forgot Password?",
    "noAccount": "Don't have an account?",
    "signUp": "Sign Up"
  },
  "register": {
    "title": "Create Account",
    "firstName": "First Name",
    "lastName": "Last Name",
    "email": "Email Address",
    "password": "Password",
    "confirmPassword": "Confirm Password",
    "submit": "Create Account",
    "hasAccount": "Already have an account?",
    "signIn": "Sign In"
  },
  "logout": {
    "title": "Sign Out",
    "confirm": "Are you sure you want to sign out?",
    "submit": "Sign Out",
    "cancel": "Cancel"
  },
  "forgotPassword": {
    "title": "Reset Password",
    "email": "Email Address",
    "submit": "Send Reset Link",
    "back": "Back to Sign In"
  }
};

let created = 0;
let skipped = 0;

console.log('Adding missing translation files...\n');

languages.forEach(lang => {
  const langDir = path.join(localesDir, lang);

  // Check if language directory exists
  if (!fs.existsSync(langDir)) {
    console.log(`⚠️  Skipping ${lang} - directory does not exist`);
    skipped++;
    return;
  }

  // Create forms.json if it doesn't exist
  const formsPath = path.join(langDir, 'forms.json');
  if (!fs.existsSync(formsPath)) {
    fs.writeFileSync(formsPath, JSON.stringify(formsTemplate, null, 2), 'utf8');
    console.log(`✅ Created forms.json for ${lang}`);
    created++;
  } else {
    console.log(`⏭️  forms.json already exists for ${lang}`);
    skipped++;
  }

  // Create auth.json if it doesn't exist
  const authPath = path.join(langDir, 'auth.json');
  if (!fs.existsSync(authPath)) {
    fs.writeFileSync(authPath, JSON.stringify(authTemplate, null, 2), 'utf8');
    console.log(`✅ Created auth.json for ${lang}`);
    created++;
  } else {
    console.log(`⏭️  auth.json already exists for ${lang}`);
    skipped++;
  }
});

console.log(`\n=== Summary ===`);
console.log(`Created: ${created} files`);
console.log(`Skipped: ${skipped} files`);
console.log('\nNote: The created files use English text as placeholders.');
console.log('These should be professionally translated to the target languages.');

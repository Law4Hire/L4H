const fs = require('fs');

// Read the current i18n file
const filePath = 'web/shared-ui/src/i18n-enhanced.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Registration translations for all languages
const translations = {
  'en-US': {
    signup: 'Sign Up',
    register: 'Register',
    firstName: 'First Name',
    lastName: 'Last Name',
    confirmPassword: 'Confirm Password',
    firstNameRequired: 'First name is required',
    lastNameRequired: 'Last name is required',
    passwordsDoNotMatch: 'Passwords do not match',
    alreadyHaveAccount: 'Already have an account?',
    dontHaveAccount: "Don't have an account?",
    signUpNow: 'Sign up now',
    createAccount: 'Create Account',
    registrationSuccess: 'Registration successful',
    registrationFailed: 'Registration failed',
    passwordConfirmRequired: 'Password confirmation is required'
  },
  'de-DE': {
    signup: 'Registrieren',
    register: 'Anmelden',
    firstName: 'Vorname',
    lastName: 'Nachname',
    confirmPassword: 'Passwort bestätigen',
    firstNameRequired: 'Vorname ist erforderlich',
    lastNameRequired: 'Nachname ist erforderlich',
    passwordsDoNotMatch: 'Passwörter stimmen nicht überein',
    alreadyHaveAccount: 'Haben Sie bereits ein Konto?',
    dontHaveAccount: 'Haben Sie noch kein Konto?',
    signUpNow: 'Jetzt registrieren',
    createAccount: 'Konto erstellen',
    registrationSuccess: 'Registrierung erfolgreich',
    registrationFailed: 'Registrierung fehlgeschlagen',
    passwordConfirmRequired: 'Passwort-Bestätigung ist erforderlich'
  },
  'hi-IN': {
    signup: 'साइन अप करें',
    register: 'पंजीकरण करें',
    firstName: 'पहला नाम',
    lastName: 'अंतिम नाम',
    confirmPassword: 'पासवर्ड की पुष्टि करें',
    firstNameRequired: 'पहला नाम आवश्यक है',
    lastNameRequired: 'अंतिम नाम आवश्यक है',
    passwordsDoNotMatch: 'पासवर्ड मेल नहीं खाते',
    alreadyHaveAccount: 'क्या आपका पहले से खाता है?',
    dontHaveAccount: 'खाता नहीं है?',
    signUpNow: 'अभी साइन अप करें',
    createAccount: 'खाता बनाएं',
    registrationSuccess: 'पंजीकरण सफल',
    registrationFailed: 'पंजीकरण असफल',
    passwordConfirmRequired: 'पासवर्ड पुष्टि आवश्यक है'
  }
  // Add more languages as needed...
};

// Find all auth sections that are missing registration keys
const lines = content.split('\n');
const authSections = [];

for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === 'auth: {') {
    // Find the end of this auth section
    let endLine = i;
    let braceCount = 1;
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j].includes('{')) braceCount++;
      if (lines[j].includes('}')) {
        braceCount--;
        if (braceCount === 0) {
          endLine = j;
          break;
        }
      }
    }
    
    // Check if this auth section has createAccount
    const sectionContent = lines.slice(i, endLine + 1).join('\n');
    if (!sectionContent.includes('createAccount')) {
      console.log(`Found incomplete auth section at line ${i + 1}`);
      // Find which language this is by looking backwards for the language code
      for (let k = i - 1; k >= 0; k--) {
        const match = lines[k].match(/'([a-z]{2}-[A-Z]{2})': \{/);
        if (match) {
          console.log(`Language: ${match[1]}`);
          authSections.push({
            lang: match[1],
            startLine: i,
            endLine: endLine
          });
          break;
        }
      }
    }
  }
}

console.log(`Found ${authSections.length} auth sections missing registration translations`);
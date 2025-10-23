const fs = require('fs');
const path = require('path');

// All 21 supported languages
const languages = [
  { code: 'ar-SA', name: 'Arabic (Saudi Arabia)' },
  { code: 'bn-BD', name: 'Bengali (Bangladesh)' },
  { code: 'de-DE', name: 'German (Germany)' },
  { code: 'es-ES', name: 'Spanish (Spain)' },
  { code: 'fr-FR', name: 'French (France)' },
  { code: 'hi-IN', name: 'Hindi (India)' },
  { code: 'id-ID', name: 'Indonesian (Indonesia)' },
  { code: 'it-IT', name: 'Italian (Italy)' },
  { code: 'ja-JP', name: 'Japanese (Japan)' },
  { code: 'ko-KR', name: 'Korean (South Korea)' },
  { code: 'mr-IN', name: 'Marathi (India)' },
  { code: 'pl-PL', name: 'Polish (Poland)' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)' },
  { code: 'ru-RU', name: 'Russian (Russia)' },
  { code: 'ta-IN', name: 'Tamil (India)' },
  { code: 'te-IN', name: 'Telugu (India)' },
  { code: 'tl-PH', name: 'Tagalog (Philippines)' },
  { code: 'tr-TR', name: 'Turkish (Turkey)' },
  { code: 'ur-PK', name: 'Urdu (Pakistan)' },
  { code: 'vi-VN', name: 'Vietnamese (Vietnam)' },
  { code: 'zh-CN', name: 'Chinese (China)' }
];

// Resource template
const resourceTemplate = `<?xml version="1.0" encoding="utf-8"?>
<root>
  <xsd:schema id="root" xmlns="" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:msdata="urn:schemas-microsoft-com:xml-msdata">
    <xsd:import namespace="http://www.w3.org/XML/1998/namespace" />
    <xsd:element name="root" msdata:IsDataSet="true">
      <xsd:complexType>
        <xsd:choice maxOccurs="unbounded">
          <xsd:element name="metadata">
            <xsd:complexType>
              <xsd:sequence>
                <xsd:element name="value" type="xsd:string" minOccurs="0" />
              </xsd:sequence>
              <xsd:attribute name="name" use="required" type="xsd:string" />
              <xsd:attribute name="type" type="xsd:string" />
              <xsd:attribute name="mimetype" type="xsd:string" />
              <xsd:attribute ref="xml:space" />
            </xsd:complexType>
          </xsd:element>
          <xsd:element name="assembly">
            <xsd:complexType>
              <xsd:attribute name="alias" type="xsd:string" />
              <xsd:attribute name="name" type="xsd:string" />
            </xsd:complexType>
          </xsd:element>
          <xsd:element name="data">
            <xsd:complexType>
              <xsd:sequence>
                <xsd:element name="value" type="xsd:string" minOccurs="0" msdata:Ordinal="1" />
                <xsd:element name="comment" type="xsd:string" minOccurs="0" msdata:Ordinal="2" />
              </xsd:sequence>
              <xsd:attribute name="name" type="xsd:string" use="required" msdata:Ordinal="1" />
              <xsd:attribute name="type" type="xsd:string" msdata:Ordinal="3" />
              <xsd:attribute name="mimetype" type="xsd:string" msdata:Ordinal="4" />
              <xsd:attribute ref="xml:space" />
            </xsd:complexType>
          </xsd:element>
          <xsd:element name="resheader">
            <xsd:complexType>
              <xsd:sequence>
                <xsd:element name="value" type="xsd:string" minOccurs="0" msdata:Ordinal="1" />
              </xsd:sequence>
              <xsd:attribute name="name" type="xsd:string" use="required" />
            </xsd:complexType>
          </xsd:element>
        </xsd:choice>
      </xsd:complexType>
    </xsd:element>
  </xsd:schema>
  <resheader name="resmimetype">
    <value>text/microsoft-resx</value>
  </resheader>
  <resheader name="version">
    <value>2.0</value>
  </resheader>
  <resheader name="reader">
    <value>System.Resources.ResXResourceReader, System.Windows.Forms, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089</value>
  </resheader>
  <resheader name="writer">
    <value>System.Resources.ResXResourceWriter, System.Windows.Forms, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089</value>
  </resheader>

  <!-- NOTE: English placeholders - Ready for professional translation -->
  <!-- Language: {{LANGUAGE_NAME}} ({{LANGUAGE_CODE}}) -->

  <!-- Authentication & User Management -->
  <data name="Auth.PasswordRequired" xml:space="preserve">
    <value>Password is required.</value>
    <comment>Validation message when password field is empty</comment>
  </data>
  <data name="Auth.PasswordTooShort" xml:space="preserve">
    <value>Password must be at least {0} characters long.</value>
    <comment>Validation message for password length. {0} = minimum length</comment>
  </data>
  <data name="Auth.PasswordNeedsSpecialChar" xml:space="preserve">
    <value>Password must contain at least one special character.</value>
    <comment>Validation message for password complexity</comment>
  </data>
  <data name="Auth.PasswordNeedsMoreClasses" xml:space="preserve">
    <value>Password must contain at least {0} different character types (uppercase, lowercase, digits, special characters).</value>
    <comment>Validation message for password complexity. {0} = number of required character types</comment>
  </data>
  <data name="Auth.RateLimitExceeded" xml:space="preserve">
    <value>Too many requests. Please try again later.</value>
    <comment>Error message when user exceeds rate limit</comment>
  </data>
  <data name="Auth.UserNotFound" xml:space="preserve">
    <value>User not found.</value>
    <comment>Error message when user account doesn't exist</comment>
  </data>
  <data name="Auth.AccountLocked" xml:space="preserve">
    <value>Account is locked for {0} more minutes due to too many failed login attempts.</value>
    <comment>Error message when account is temporarily locked. {0} = minutes remaining</comment>
  </data>
  <data name="Auth.LockoutCheckFailed" xml:space="preserve">
    <value>Failed to check account lockout status.</value>
    <comment>System error message</comment>
  </data>
  <data name="Auth.FailedLoginRecordFailed" xml:space="preserve">
    <value>Failed to record failed login attempt.</value>
    <comment>System error message</comment>
  </data>
  <data name="Auth.LockoutClearFailed" xml:space="preserve">
    <value>Failed to clear account lockout.</value>
    <comment>System error message</comment>
  </data>
  <data name="Auth.LoginFailed" xml:space="preserve">
    <value>Invalid email or password.</value>
    <comment>Error message for failed login attempt</comment>
  </data>
  <data name="Auth.EmailVerificationRequired" xml:space="preserve">
    <value>Please verify your email address before logging in.</value>
    <comment>Message when user needs to verify email first</comment>
  </data>
  <data name="Auth.InvalidToken" xml:space="preserve">
    <value>Invalid or expired token.</value>
    <comment>Error message for invalid authentication token</comment>
  </data>
  <data name="Auth.EmailVerified" xml:space="preserve">
    <value>Email address verified successfully.</value>
    <comment>Success message after email verification</comment>
  </data>
  <data name="Auth.LoggedOutAllDevices" xml:space="preserve">
    <value>Successfully logged out from all devices.</value>
    <comment>Success message after logging out from all sessions</comment>
  </data>

  <!-- Appointments -->
  <data name="Appointments.CreatedSuccessfully" xml:space="preserve">
    <value>Appointment created successfully.</value>
    <comment>Success message after creating an appointment</comment>
  </data>
  <data name="Appointments.CreationFailed" xml:space="preserve">
    <value>Failed to create appointment.</value>
    <comment>Error message when appointment creation fails</comment>
  </data>
  <data name="Appointments.CreationError" xml:space="preserve">
    <value>An error occurred while creating the appointment.</value>
    <comment>Generic error message for appointment creation</comment>
  </data>

  <!-- Cases -->
  <data name="Cases.NotFound" xml:space="preserve">
    <value>Case not found.</value>
    <comment>Error message when case doesn't exist</comment>
  </data>
  <data name="Cases.Forbidden" xml:space="preserve">
    <value>You do not have permission to access this case.</value>
    <comment>Error message when user lacks permission to view case</comment>
  </data>
  <data name="Cases.InvalidTransition" xml:space="preserve">
    <value>Invalid case status transition.</value>
    <comment>Error message when case status change is not allowed</comment>
  </data>
  <data name="Cases.TransitionApplied" xml:space="preserve">
    <value>Case status updated successfully.</value>
    <comment>Success message after case status update</comment>
  </data>

  <!-- Workflow (Non-Admin) -->
  <data name="Workflow.NotFound" xml:space="preserve">
    <value>Workflow not found.</value>
    <comment>Error message when workflow doesn't exist</comment>
  </data>
  <data name="Workflow.PendingStatus" xml:space="preserve">
    <value>Pending Review</value>
    <comment>Status label for workflow pending review</comment>
  </data>

  <!-- Scraper Service -->
  <data name="Scraper.RunStarted" xml:space="preserve">
    <value>Scraper run started.</value>
    <comment>Log message when scraper begins</comment>
  </data>
  <data name="Scraper.RunCompleted" xml:space="preserve">
    <value>Scraper run completed successfully.</value>
    <comment>Log message when scraper finishes</comment>
  </data>
  <data name="Scraper.NoChange" xml:space="preserve">
    <value>No changes detected.</value>
    <comment>Message when scraper finds no updates</comment>
  </data>
  <data name="Scraper.DraftCreated" xml:space="preserve">
    <value>Draft workflow created with ID {0}. Total changes: {1}.</value>
    <comment>Log message when draft is created. {0} = workflow ID, {1} = number of changes</comment>
  </data>
  <data name="Scraper.AndorraUsesSpain" xml:space="preserve">
    <value>Country {0} uses workflow from {1}.</value>
    <comment>Log message for country workflow mapping. {0} = source country, {1} = target country</comment>
  </data>
</root>
`;

const resourcesDir = path.join(__dirname, '..', 'src', 'infrastructure', 'Resources');

// Ensure directory exists
if (!fs.existsSync(resourcesDir)) {
  fs.mkdirSync(resourcesDir, { recursive: true });
}

let created = 0;
let skipped = 0;

console.log('Creating backend resource files for 21 languages...\n');

languages.forEach(lang => {
  const filename = `Shared.${lang.code}.resx`;
  const filepath = path.join(resourcesDir, filename);

  // Check if file already exists
  if (fs.existsSync(filepath)) {
    console.log(`⏭️  SKIPPED: ${filename} (already exists)`);
    skipped++;
    return;
  }

  // Replace placeholders
  const content = resourceTemplate
    .replace('{{LANGUAGE_NAME}}', lang.name)
    .replace('{{LANGUAGE_CODE}}', lang.code);

  // Write file
  fs.writeFileSync(filepath, content, 'utf8');
  console.log(`✅ CREATED: ${filename}`);
  created++;
});

console.log(`\n📊 Summary:`);
console.log(`   Created: ${created} files`);
console.log(`   Skipped: ${skipped} files (already exist)`);
console.log(`   Total:   ${languages.length} languages\n`);

console.log('✅ All resource files created with English placeholders.');
console.log('📝 Ready for professional translation service.\n');
console.log('📂 Location: src/infrastructure/Resources/\n');

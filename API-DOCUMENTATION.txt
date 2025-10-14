# Law4Hire (L4H) API Documentation

This document provides comprehensive API documentation for the Law4Hire platform API endpoints.

## Base URL

```
https://your-api-domain.com/api/v1
```

## Authentication

Most endpoints require authentication via JWT Bearer tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Common Response Formats

### Error Response
```json
{
  "title": "Error Title",
  "detail": "Detailed error message",
  "status": 400
}
```

### Success Response with Message
```json
{
  "message": "Operation completed successfully"
}
```

---

## Authentication Endpoints

### Get CSRF Token
**GET** `/auth/csrf`

Get CSRF token for cookie-based endpoints.

**Response:**
```json
{
  "token": "csrf_token_string"
}
```

**Headers:** Sets `X-CSRF-TOKEN` header

### Check Email Exists
**GET** `/auth/check-email`

Check if a user exists by email address.

**Query Parameters:**
- `email` (required, string): Email address to check

**Response:**
```json
{
  "exists": true
}
```

### User Registration
**POST** `/auth/signup`

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "country": "US"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "userId": "user-guid",
  "isProfileComplete": false,
  "isInterviewComplete": false,
  "isStaff": false,
  "isAdmin": false
}
```

### User Login
**POST** `/auth/login`

Authenticate user and obtain access token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "UserPassword123!",
  "rememberMe": false
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "userId": "user-guid",
  "isProfileComplete": true,
  "isInterviewComplete": true,
  "isStaff": false,
  "isAdmin": false
}
```

**Response Fields:**
- `token`: JWT access token for authenticated requests
- `userId`: Unique identifier for the user
- `isProfileComplete`: Whether user has completed their profile information (address, citizenship, etc.)
- `isInterviewComplete`: Whether user has completed their visa eligibility interview
- `isStaff`: Whether user is a staff member (legal professional)
- `isAdmin`: Whether user has administrative privileges

**Features:**
- Rate limiting (10 requests per minute per IP)
- Account lockout protection
- Remember-me functionality with secure cookies
- Email verification requirements
- Intelligent workflow routing:
  - Staff/admin users → Dashboard (bypass profile/interview)
  - Regular users with incomplete profile → Profile completion
  - Regular users with complete profile but no interview → Interview
  - Regular users with complete profile and interview → Dashboard

### Remember Me Login
**POST** `/auth/remember`

Exchange remember-me token for new access token.

**Cookies Required:** `l4h_remember` cookie must be present

**Response:**
```json
{
  "token": "new_jwt_token",
  "userId": "user-guid",
  "isProfileComplete": true,
  "isInterviewComplete": true,
  "isStaff": false,
  "isAdmin": false
}
```

### Email Verification
**GET** `/auth/verify`

Verify email address with verification token.

**Query Parameters:**
- `token` (required, string): Verification token from email

**Response:**
```json
{
  "message": "Email verified successfully"
}
```

### Forgot Password
**POST** `/auth/forgot`

Request password reset email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "Password reset email sent"
}
```

### Reset Password
**POST** `/auth/reset`

Reset password with reset token.

**Request Body:**
```json
{
  "token": "reset_token_from_email",
  "newPassword": "NewSecurePassword123!"
}
```

**Response:**
```json
{
  "message": "Password reset successfully"
}
```

### Logout from All Devices
**POST** `/auth/logout-all`

🔒 **Requires Authentication**

Revoke all active sessions for the current user.

**Response:**
```json
{
  "message": "Logged out from all devices"
}
```

### Get Active Sessions
**GET** `/auth/sessions`

🔒 **Requires Authentication**

Get list of active sessions for current user.

**Response:**
```json
[
  {
    "id": "session-guid",
    "deviceInfo": "Chrome on Windows",
    "ipAddress": "192.168.1.1",
    "lastActivity": "2024-01-15T10:30:00Z",
    "isCurrent": true
  }
]
```

### Update Profile
**PUT** `/auth/profile`

🔒 **Requires Authentication**

Update user profile information.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "country": "US"
}
```

**Response:**
```json
{
  "message": "Profile updated successfully"
}
```

---

## Case Management Endpoints

### Get My Cases
**GET** `/cases` or **GET** `/cases/mine`

🔒 **Requires Authentication**

Get all cases for the current user.

**Response:**
```json
[
  {
    "id": "case-guid",
    "status": "active",
    "lastActivityAt": "2024-01-15T10:30:00Z",
    "visaTypeCode": "H1B",
    "visaTypeName": "H-1B Specialty Occupation",
    "packageCode": "H1B_PREMIUM",
    "packageDisplayName": "H-1B Premium Package",
    "createdAt": "2024-01-10T09:00:00Z",
    "latestPriceSnapshot": {
      "id": 123,
      "visaTypeCode": "H1B",
      "packageCode": "H1B_PREMIUM",
      "countryCode": "US",
      "total": 3500.00,
      "currency": "USD",
      "createdAt": "2024-01-10T09:00:00Z"
    }
  }
]
```

### Get Case by ID
**GET** `/cases/{id}`

🔒 **Requires Authentication**

Get detailed information for a specific case.

**Path Parameters:**
- `id` (required, UUID): Case ID

**Response:**
```json
{
  "id": "case-guid",
  "status": "active",
  "lastActivityAt": "2024-01-15T10:30:00Z",
  "visaTypeCode": "H1B",
  "visaTypeName": "H-1B Specialty Occupation",
  "packageCode": "H1B_PREMIUM",
  "packageDisplayName": "H-1B Premium Package",
  "createdAt": "2024-01-10T09:00:00Z",
  "latestPriceSnapshot": {
    "id": 123,
    "visaTypeCode": "H1B",
    "packageCode": "H1B_PREMIUM",
    "countryCode": "US",
    "total": 3500.00,
    "currency": "USD",
    "createdAt": "2024-01-10T09:00:00Z"
  }
}
```

### Update Case Status
**PATCH** `/cases/{id}/status`

🔒 **Requires Authentication**

Update case status with validation for valid transitions.

**Path Parameters:**
- `id` (required, UUID): Case ID

**Request Body:**
```json
{
  "status": "paid"
}
```

**Valid Status Transitions:**
- `pending` → `paid`, `inactive`
- `paid` → `active`, `inactive`
- `active` → `closed`, `denied`, `inactive`
- `inactive` → `paid`
- `closed`, `denied` → (terminal states)

**Response:**
```json
{
  "message": "Case status updated successfully"
}
```

---

## Interview System Endpoints

### Start Interview Session
**POST** `/interview/start`

🔒 **Requires Authentication**

Start a new interview session for a case.

**Request Body:**
```json
{
  "caseId": "case-guid"
}
```

**Response:**
```json
{
  "sessionId": "session-guid",
  "status": "active",
  "startedAt": "2024-01-15T10:30:00Z"
}
```

### Answer Interview Question
**POST** `/interview/answer`

🔒 **Requires Authentication**

Submit an answer to an interview question.

**Request Body:**
```json
{
  "sessionId": "session-guid",
  "stepNumber": 1,
  "questionKey": "employment_status",
  "answerValue": "employed"
}
```

**Response:**
```json
{
  "sessionId": "session-guid",
  "stepNumber": 1,
  "questionKey": "employment_status",
  "answerValue": "employed",
  "answeredAt": "2024-01-15T10:30:00Z"
}
```

### Get Next Question (Adaptive)
**POST** `/interview/next-question`

🔒 **Requires Authentication**

Get the next question in an adaptive interview based on previous answers.

**Request Body:**
```json
{
  "sessionId": "session-guid"
}
```

**Response (Question):**
```json
{
  "isComplete": false,
  "question": {
    "key": "education_level",
    "question": "What is your highest level of education?",
    "type": "single_choice",
    "options": [
      {
        "value": "bachelors",
        "label": "Bachelor's Degree",
        "description": "4-year undergraduate degree"
      },
      {
        "value": "masters",
        "label": "Master's Degree",
        "description": "Graduate degree"
      }
    ],
    "required": true,
    "remainingVisaTypes": ["H1B", "O1", "EB2"]
  },
  "recommendation": null
}
```

**Response (Complete):**
```json
{
  "isComplete": true,
  "question": null,
  "recommendation": {
    "visaType": "H-1B Specialty Occupation",
    "rationale": "Based on your education and employment status, H-1B is the most suitable visa type."
  }
}
```

### Complete Interview
**POST** `/interview/complete`

🔒 **Requires Authentication**

Complete the interview and get visa recommendation.

**Request Body:**
```json
{
  "sessionId": "session-guid"
}
```

**Response:**
```json
{
  "recommendationVisaType": "H-1B Specialty Occupation",
  "rationale": "Based on your answers, H-1B is the most suitable visa type for your situation."
}
```

### Rerun Interview
**POST** `/interview/rerun`

🔒 **Requires Authentication**

Start a new interview session (cancels any active sessions).

**Request Body:**
```json
{
  "caseId": "case-guid"
}
```

**Response:**
```json
{
  "sessionId": "new-session-guid",
  "status": "active",
  "startedAt": "2024-01-15T10:30:00Z"
}
```

### Lock Interview
**POST** `/interview/lock`

🔒 **Requires Authentication**

Lock the interview for a case to prevent further changes.

**Request Body:**
```json
{
  "caseId": "case-guid"
}
```

**Response:** `204 No Content`

### Get Interview History
**GET** `/interview/history`

🔒 **Requires Authentication**

Get interview history for the current user.

**Response:**
```json
{
  "sessions": [
    {
      "id": "session-guid",
      "status": "completed",
      "startedAt": "2024-01-15T10:00:00Z",
      "finishedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "latestRecommendation": {
    "visaType": "H-1B Specialty Occupation",
    "rationale": "Based on your qualifications...",
    "createdAt": "2024-01-15T10:30:00Z",
    "isLocked": false
  }
}
```

---

## Pricing Endpoints

### Get Pricing Information
**GET** `/pricing`

Get pricing packages for a specific visa type and country.

**Query Parameters:**
- `visaType` (optional, string): Visa type code (e.g., "H1B")
- `country` (optional, string): Country code (e.g., "US")

**Note:** If no parameters provided, returns default pricing examples.

**Response:**
```json
{
  "visaType": "H1B",
  "country": "US",
  "packages": [
    {
      "id": "H1B_BASIC",
      "packageCode": "H1B_BASIC",
      "name": "H-1B Basic Package",
      "displayName": "H-1B Basic Package",
      "description": "Essential H-1B visa services",
      "price": 2500.00,
      "basePrice": 2500.00,
      "taxRate": 0.08,
      "currency": "USD",
      "fxSurchargeMode": null,
      "total": 2700.00,
      "sortOrder": 1,
      "features": [
        "Form preparation and filing",
        "Initial consultation",
        "Basic document review",
        "Email support"
      ]
    }
  ]
}
```

### Select Package for Case
**POST** `/v1/cases/{id}/package`

🔒 **Requires Authentication**

Select a package for a case and create a price snapshot.

**Path Parameters:**
- `id` (required, UUID): Case ID

**Request Body:**
```json
{
  "visaType": "H1B",
  "packageCode": "H1B_PREMIUM",
  "country": "US"
}
```

**Response:**
```json
{
  "id": 123,
  "visaTypeCode": "H1B",
  "packageCode": "H1B_PREMIUM",
  "countryCode": "US",
  "total": 3500.00,
  "currency": "USD",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

---

## Upload Endpoints

### Generate Presigned Upload URL
**POST** `/uploads/presign`

🔒 **Requires Authentication**

Generate a presigned URL for file upload.

**Request Body:**
```json
{
  "caseId": "case-guid",
  "filename": "passport.pdf",
  "contentType": "application/pdf",
  "sizeBytes": 1048576
}
```

**File Constraints:**
- Max size: 25MB
- Allowed extensions: `.pdf`, `.docx`, `.doc`, `.png`, `.jpg`, `.jpeg`, `.tiff`, `.gif`, `.heic`

**Response:**
```json
{
  "key": "upload-key",
  "url": "https://upload-gateway.com/upload-url",
  "headers": {
    "Content-Type": "application/pdf"
  },
  "uploadId": "upload-guid"
}
```

### Confirm Upload
**POST** `/uploads/confirm`

🔒 **Requires Authentication**

Confirm file upload and queue for scanning.

**Request Body:**
```json
{
  "key": "upload-key",
  "caseId": "case-guid"
}
```

**Response:**
```json
{
  "status": "pending",
  "uploadId": "upload-guid"
}
```

### List Case Uploads
**GET** `/uploads/list`

🔒 **Requires Authentication**

List all uploads for a case.

**Query Parameters:**
- `caseId` (required, UUID): Case ID

**Response:**
```json
{
  "uploads": [
    {
      "id": "upload-guid",
      "originalName": "passport.pdf",
      "mime": "application/pdf",
      "sizeBytes": 1048576,
      "status": "clean",
      "createdAt": "2024-01-15T10:30:00Z",
      "verdictAt": "2024-01-15T10:35:00Z",
      "downloadUrl": "/v1/uploads/download/upload-guid"
    }
  ]
}
```

**Upload Statuses:**
- `pending`: Upload in progress
- `scanning`: File being scanned for malware
- `clean`: File passed security scan
- `infected`: File failed security scan

### Get Upload Limits
**GET** `/uploads/limits`

🔒 **Requires Authentication**

Get upload configuration and limits.

**Response:**
```json
{
  "maxSizeMB": 25,
  "allowedExtensions": [".pdf", ".docx", ".doc", ".png", ".jpg", ".jpeg", ".tiff", ".gif", ".heic"]
}
```

---

## Payment Endpoints

### Create Checkout Session
**POST** `/payments/checkout`

🔒 **Requires Authentication**

Create a payment checkout session.

**Request Body:**
```json
{
  "amount": 3500.00,
  "currency": "USD",
  "description": "H-1B Premium Package",
  "successUrl": "https://your-domain.com/success",
  "cancelUrl": "https://your-domain.com/cancel"
}
```

**Response:**
```json
{
  "checkoutUrl": "https://payment-provider.com/checkout/session-id",
  "successUrl": "https://your-domain.com/success",
  "cancelUrl": "https://your-domain.com/cancel",
  "sessionId": "payment-session-id",
  "message": "Checkout session created successfully"
}
```

---

## Public Information Endpoints

### Get Visa Types
**GET** `/public/visa-types`

Get all available visa types for public viewing.

**Response:**
```json
[
  {
    "code": "H1B",
    "name": "H-1B Specialty Occupation",
    "generalCategory": "Work",
    "description": "Specialty occupation visa for professionals with bachelor's degree or higher."
  },
  {
    "code": "B2",
    "name": "B-2 Tourist",
    "generalCategory": "Visit",
    "description": "Tourist visa for pleasure, vacation, or visiting family and friends."
  }
]
```

### Get Visa List
**GET** `/public/visa-list`

Get simple list of all visa type codes and names (raw JSON format).

**Response:**
```json
[
  {
    "code": "B1",
    "name": "B-1 Business Visitor"
  },
  {
    "code": "B2",
    "name": "B-2 Tourist"
  },
  {
    "code": "F1",
    "name": "F-1 Student"
  },
  {
    "code": "H1B",
    "name": "H-1B Specialty Occupation"
  },
  {
    "code": "K1",
    "name": "K-1 Fiancé(e)"
  }
]
```

---

## Workflow Management Endpoints

### Get Workflow
**GET** `/workflows`

🔒 **Requires Authentication**

Get the latest approved workflow for a specific visa type and country.

**Query Parameters:**
- `visaType` (required, string): Visa type code (e.g., "H1B", "K1")
- `country` (required, string): Country code (ISO-2, e.g., "US", "CA")

**Response:**
```json
{
  "id": "workflow-guid",
  "visaTypeId": 1,
  "countryCode": "US",
  "version": 3,
  "status": "approved",
  "source": "USCIS",
  "approvedAt": "2024-01-15T10:30:00Z",
  "steps": [
    {
      "id": "step-guid",
      "ordinal": 1,
      "key": "medical_exam",
      "title": "Medical Examination",
      "description": "Complete medical examination with approved physician",
      "dataJson": "{\"documentType\":\"file\",\"isUserProvided\":false,\"documentName\":\"Medical Exam Report\",\"governmentLink\":\"https://travel.state.gov/medical\"}"
    }
  ],
  "doctors": [
    {
      "id": "doctor-guid",
      "name": "Dr. Smith Medical Center",
      "address": "123 Medical Ave",
      "phone": "+1-555-123-4567",
      "city": "New York",
      "countryCode": "US",
      "sourceUrl": "https://travel.state.gov/doctors"
    }
  ]
}
```

### Create Workflow
**POST** `/workflows`

🔒 **Requires Authentication**

Create a new workflow version with steps and approved doctors.

**Request Body:**
```json
{
  "visaType": "H1B",
  "countryCode": "US",
  "source": "USCIS",
  "notes": "Updated workflow for 2024 requirements",
  "steps": [
    {
      "stepNumber": 1,
      "countryCode": "US",
      "visaType": "H1B",
      "key": "form_filing",
      "title": "Form I-129 Filing",
      "description": "File Form I-129 with USCIS",
      "documentType": "form",
      "isUserProvided": true,
      "documentName": "Form I-129",
      "governmentLink": "https://www.uscis.gov/i-129",
      "additionalData": "{\"deadline\":\"60 days before start date\"}"
    },
    {
      "stepNumber": 2,
      "countryCode": "US",
      "visaType": "H1B",
      "key": "medical_exam",
      "title": "Medical Examination",
      "description": "Complete medical exam with approved physician",
      "documentType": "file",
      "isUserProvided": false,
      "documentName": "Medical Examination Report",
      "governmentLink": "https://travel.state.gov/medical"
    }
  ],
  "doctors": [
    {
      "name": "Dr. John Smith Medical Center",
      "address": "123 Medical Avenue, Suite 200",
      "phone": "+1-555-123-4567",
      "city": "New York",
      "countryCode": "US",
      "sourceUrl": "https://travel.state.gov/content/travel/en/us-visas/immigrate/panel-physicians.html"
    }
  ]
}
```

**Response:**
```json
{
  "id": "workflow-guid",
  "visaTypeId": 1,
  "countryCode": "US",
  "version": 4,
  "status": "draft",
  "stepsCount": 2,
  "doctorsCount": 1,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**Step Fields:**
- `stepNumber`: Order of the step (1, 2, 3, etc.)
- `countryCode`: Country this step applies to
- `visaType`: Visa type this step applies to
- `documentType`: Type of document ("file", "form", "payment", etc.)
- `isUserProvided`: `true` if user provides, `false` if government provides
- `documentName`: Name of required document
- `governmentLink`: Official government source URL (for government-provided documents)

---

## Approved Doctors Endpoints

### Get Approved Doctors
**GET** `/approved-doctors`

Get approved doctors for specific country codes.

**Query Parameters:**
- `countryCodes` (required, string): Comma-separated country codes (e.g., "US,CA" or "ES")

**Special Country Codes:**
- Individual countries: "US", "ES", "CA"
- Multiple countries: "US,CA,MX"
- Shared doctor pools: "AD,ES" (Andorra and Spain use same doctors)
- Universal doctors: "NULL" (doctors that accept patients from any country)

**Response:**
```json
[
  {
    "id": "doctor-guid",
    "name": "Dr. Maria Rodriguez Medical Center",
    "address": "456 Healthcare Blvd, Suite 100",
    "phone": "+1-555-987-6543",
    "email": "contact@rodriguezmedical.com",
    "city": "Miami",
    "stateProvince": "FL",
    "postalCode": "33101",
    "countryCode": "US",
    "website": "https://rodriguezmedical.com",
    "specialties": "Immigration Medical Exams, Vaccinations, TB Testing",
    "languages": "English, Spanish, Portuguese",
    "acceptedCountryCodes": "US,MX,BR,AR",
    "notes": "Specializes in Latin American immigrant populations",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  {
    "id": "doctor-guid-2",
    "name": "Global Health Services",
    "address": "789 International Drive",
    "phone": "+1-555-456-7890",
    "email": "info@globalhealth.com",
    "city": "New York",
    "stateProvince": "NY",
    "postalCode": "10001",
    "countryCode": "NULL",
    "website": "https://globalhealth.com",
    "specialties": "All Immigration Medical Services",
    "languages": "English, Spanish, French, Mandarin, Arabic",
    "acceptedCountryCodes": "ALL",
    "notes": "Accepts patients from any country worldwide",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
]
```

### Create Approved Doctor
**POST** `/approved-doctors`

🔒 **Requires Authentication**

Add a new approved doctor to the system.

**Request Body:**
```json
{
  "name": "Dr. Sarah Johnson Medical Clinic",
  "address": "321 Medical Plaza, Floor 3",
  "phone": "+1-555-111-2222",
  "email": "admin@johnsonmedical.com",
  "city": "Los Angeles",
  "stateProvince": "CA",
  "postalCode": "90210",
  "countryCode": "US",
  "website": "https://johnsonmedical.com",
  "specialties": "Immigration Physicals, Vaccinations, X-rays",
  "languages": "English, Spanish, Korean",
  "acceptedCountryCodes": "US,KR,MX",
  "notes": "Weekend appointments available"
}
```

**Response:**
```json
{
  "id": "doctor-guid",
  "name": "Dr. Sarah Johnson Medical Clinic",
  "address": "321 Medical Plaza, Floor 3",
  "phone": "+1-555-111-2222",
  "email": "admin@johnsonmedical.com",
  "city": "Los Angeles",
  "stateProvince": "CA",
  "postalCode": "90210",
  "countryCode": "US",
  "website": "https://johnsonmedical.com",
  "specialties": "Immigration Physicals, Vaccinations, X-rays",
  "languages": "English, Spanish, Korean",
  "acceptedCountryCodes": "US,KR,MX",
  "notes": "Weekend appointments available",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Fields:**
- `countryCode`: Use "NULL" for doctors accepting patients from any country
- `acceptedCountryCodes`: Comma-separated list of countries this doctor accepts patients from
- `specialties`: Comma-separated medical specialties
- `languages`: Comma-separated languages spoken

---

## Countries and Localization Endpoints

### Get Countries
**GET** `/countries`

Get list of all active countries.

**Response:**
```json
[
  {
    "id": 1,
    "name": "United States",
    "iso2": "US",
    "iso3": "USA",
    "isActive": true
  }
]
```

### Get Country by Code
**GET** `/countries/{countryCode}`

Get specific country by ISO-2 code.

**Path Parameters:**
- `countryCode` (required, string): ISO-2 country code (e.g., "US")

**Response:**
```json
{
  "id": 1,
  "name": "United States",
  "iso2": "US",
  "iso3": "USA",
  "isActive": true
}
```

### Get US Subdivisions
**GET** `/countries/us/subdivisions`

Get US states and territories.

**Response:**
```json
[
  {
    "id": 1,
    "code": "CA",
    "name": "California",
    "type": "State"
  }
]
```

### Get Supported Cultures
**GET** `/i18n/supported`

Get supported languages/cultures for localization.

**Response:**
```json
[
  {
    "code": "en-US",
    "displayName": "English (United States)"
  },
  {
    "code": "es-ES",
    "displayName": "Spanish (Spain)"
  }
]
```

### Set Culture
**POST** `/i18n/culture`

Set user's culture preference.

**Request Body:**
```json
{
  "culture": "es-ES"
}
```

**Response:** `204 No Content`

**Sets Cookie:** `l4h_culture` with 90-day expiration

---

## Admin Endpoints

**Note:** All admin endpoints require admin authentication (`IsAdmin` claim or `Admin` role).

### User Management

#### Get All Users
**GET** `/admin/users`

🔒 **Requires Admin Authentication**

Get all users for admin management.

**Response:**
```json
[
  {
    "id": "user-guid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "isAdmin": false,
    "isStaff": false,
    "isActive": true,
    "emailVerified": true,
    "createdAt": "2024-01-10 09:00:00"
  }
]
```

#### Update User Roles
**PUT** `/admin/users/{id}/roles`

🔒 **Requires Admin Authentication**

Update user administrative roles.

**Path Parameters:**
- `id` (required, string): User ID (GUID)

**Request Body:**
```json
{
  "isAdmin": false,
  "isStaff": true
}
```

**Response:**
```json
{
  "message": "User roles updated successfully"
}
```

#### Change User Password
**PUT** `/admin/users/{id}/password`

🔒 **Requires Admin Authentication**

Change a user's password (admin action).

**Path Parameters:**
- `id` (required, string): User ID (GUID)

**Request Body:**
```json
{
  "newPassword": "NewSecurePassword123!"
}
```

**Response:**
```json
{
  "message": "Password changed successfully"
}
```

#### Toggle User Status
**PUT** `/admin/users/{id}/status`

🔒 **Requires Admin Authentication**

Activate or deactivate a user account.

**Path Parameters:**
- `id` (required, string): User ID (GUID)

**Request Body:**
```json
{
  "isActive": false
}
```

**Response:**
```json
{
  "message": "User deactivated successfully"
}
```

#### Delete User
**DELETE** `/admin/users/{id}`

🔒 **Requires Admin Authentication**

Delete a user and all associated data.

**Path Parameters:**
- `id` (required, string): User ID (GUID)

**Note:** Admin users cannot be deleted for security reasons.

**Response:**
```json
{
  "message": "User deleted successfully"
}
```

#### Generate Verification Token
**POST** `/admin/users/{id}/verification-token`

🔒 **Requires Admin Authentication**

Generate a new email verification token for a user.

**Path Parameters:**
- `id` (required, string): User ID (GUID)

**Response:**
```json
{
  "token": "verification-token-string",
  "userEmail": "user@example.com",
  "userId": "user-guid",
  "verificationUrl": "https://your-domain.com/verify?token=...",
  "expiresAt": "2024-01-16T10:30:00Z"
}
```

### Case Management

#### Get All Cases
**GET** `/admin/cases`

🔒 **Requires Admin Authentication**

Get all cases for admin management.

**Response:**
```json
[
  {
    "id": "case-guid",
    "status": "active",
    "lastActivityAt": "2024-01-15 10:30:00",
    "createdAt": "2024-01-10 09:00:00",
    "userEmail": "user@example.com",
    "userName": "John Doe",
    "visaTypeCode": "H1B",
    "visaTypeName": "H-1B Specialty Occupation",
    "packageCode": "H1B_PREMIUM",
    "packageDisplayName": "H-1B Premium Package",
    "latestPriceSnapshot": {
      "id": 123,
      "visaTypeCode": "H1B",
      "packageCode": "H1B_PREMIUM",
      "countryCode": "US",
      "total": 3500.00,
      "currency": "USD",
      "createdAt": "2024-01-10 09:00:00"
    }
  }
]
```

#### Update Case Status (Admin)
**PATCH** `/admin/cases/{id}/status`

🔒 **Requires Admin Authentication**

Update case status with admin privileges (no transition restrictions).

**Path Parameters:**
- `id` (required, string): Case ID (GUID)

**Request Body:**
```json
{
  "status": "active",
  "reason": "Case approved after review"
}
```

**Response:**
```json
{
  "message": "Case status updated successfully"
}
```

### Pricing Management

#### Get Admin Visa Types
**GET** `/admin/pricing/visa-types`

🔒 **Requires Admin Authentication**

Get all visa types with pricing rules for admin management.

**Response:**
```json
[
  {
    "id": 1,
    "code": "H1B",
    "name": "H-1B Specialty Occupation",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z",
    "pricingRules": [
      {
        "countryCode": "US",
        "rules": [
          {
            "id": 1,
            "packageId": 1,
            "packageCode": "H1B_BASIC",
            "packageDisplayName": "H-1B Basic Package",
            "basePrice": 2500.00,
            "currency": "USD",
            "taxRate": 0.08,
            "fxSurchargeMode": null,
            "isActive": true,
            "createdAt": "2024-01-01T00:00:00Z",
            "updatedAt": "2024-01-01T00:00:00Z"
          }
        ]
      }
    ]
  }
]
```

#### Update Visa Type Pricing
**PATCH** `/admin/pricing/visa-types/{id}`

🔒 **Requires Admin Authentication**

Update visa type and its pricing rules.

**Path Parameters:**
- `id` (required, int): Visa type ID

**Request Body:**
```json
{
  "isActive": true,
  "pricingRuleUpdates": [
    {
      "id": 1,
      "basePrice": 2700.00,
      "taxRate": 0.08,
      "isActive": true
    }
  ]
}
```

**Response:**
```json
{
  "message": "Pricing updated successfully"
}
```

#### Get Admin Packages
**GET** `/admin/pricing/packages`

🔒 **Requires Admin Authentication**

Get all packages for admin management.

**Response:**
```json
[
  {
    "id": 1,
    "code": "H1B_BASIC",
    "displayName": "H-1B Basic Package",
    "description": "Essential H-1B visa services",
    "sortOrder": 1,
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
]
```

### Analytics

#### Dashboard Analytics
**GET** `/admin/analytics/dashboard`

🔒 **Requires Admin Authentication**

Get comprehensive platform analytics for admin dashboard.

**Response:**
```json
{
  "totalUsers": 1250,
  "totalCases": 856,
  "activeCases": 234,
  "totalRevenue": 425000.00,
  "newUsersThisMonth": 87,
  "newCasesThisMonth": 65,
  "revenueThisMonth": 78500.00,
  "recentUserRegistrations": 12,
  "recentCaseActivity": 45,
  "totalInvoices": 234,
  "paidInvoices": 198,
  "pendingInvoices": 36,
  "paymentSuccessRate": 84.62,
  "caseStatusCounts": [
    {
      "status": "active",
      "count": 234
    },
    {
      "status": "pending",
      "count": 156
    }
  ],
  "popularVisaTypes": [
    {
      "visaTypeCode": "H1B",
      "visaTypeName": "H-1B Specialty Occupation",
      "caseCount": 345
    }
  ],
  "generatedAt": "2024-01-15T10:30:00Z"
}
```

#### Financial Analytics
**GET** `/admin/analytics/financial`

🔒 **Requires Admin Authentication**

Get detailed financial analytics and revenue reports.

**Query Parameters:**
- `startDate` (optional, DateTime): Start date for report (default: 90 days ago)
- `endDate` (optional, DateTime): End date for report (default: now)

**Response:**
```json
{
  "startDate": "2023-10-15T00:00:00Z",
  "endDate": "2024-01-15T00:00:00Z",
  "totalRevenue": 425000.00,
  "totalInvoices": 234,
  "paidInvoices": 198,
  "paymentSuccessRate": 84.62,
  "averageInvoiceAmount": 2146.46,
  "revenueByVisaType": [
    {
      "visaTypeCode": "H1B",
      "visaTypeName": "H-1B Specialty Occupation",
      "revenue": 245000.00,
      "count": 98
    }
  ],
  "monthlyRevenue": [
    {
      "year": 2024,
      "month": 1,
      "revenue": 78500.00,
      "invoiceCount": 32
    }
  ],
  "generatedAt": "2024-01-15T10:30:00Z"
}
```

#### User Analytics
**GET** `/admin/analytics/users`

🔒 **Requires Admin Authentication**

Get user activity and engagement analytics.

**Response:**
```json
{
  "totalUsers": 1250,
  "activeUsers7Days": 234,
  "activeUsers30Days": 567,
  "userEngagementRate7Days": 18.72,
  "userEngagementRate30Days": 45.36,
  "registrationTrend": [
    {
      "date": "2024-01-15",
      "count": 12
    }
  ],
  "usersByCountry": [
    {
      "country": "US",
      "userCount": 856
    },
    {
      "country": "IN",
      "userCount": 234
    }
  ],
  "generatedAt": "2024-01-15T10:30:00Z"
}
```

### Demo Tools

#### Generate Demo Verification Token
**POST** `/admin/demo/verification-token`

🔒 **Requires Admin Authentication**

Generate a fresh verification token for the demo verification user.

**Response:**
```json
{
  "token": "demo-verification-token",
  "userEmail": "demo@verification.test",
  "userId": "demo-user-guid",
  "verificationUrl": "https://your-domain.com/verify?token=...",
  "expiresAt": "2024-01-16T10:30:00Z"
}
```

---

## Error Codes

### HTTP Status Codes
- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `202 Accepted`: Request accepted for processing
- `204 No Content`: Successful request with no response body
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required or invalid
- `403 Forbidden`: Access denied (insufficient permissions)
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., invalid state transition)
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

### Common Error Scenarios

#### Authentication Errors
- Invalid JWT token
- Expired token
- Missing authorization header
- Rate limit exceeded for login attempts

#### Validation Errors
- Invalid email format
- Password requirements not met
- Required fields missing
- Invalid file types for uploads

#### Business Logic Errors
- Invalid case status transitions
- Interview already locked
- Upload size exceeds limits
- Case not paid (for premium operations)

---

## Rate Limiting

### Authentication Endpoints
- **Login attempts**: 10 requests per minute per IP address
- **Signup attempts**: 5 requests per minute per IP address
- **Password reset**: 3 requests per hour per email address

### General API
- **Authenticated users**: 1000 requests per hour
- **Public endpoints**: 100 requests per hour per IP

### Headers
Rate limit information is returned in response headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 987
X-RateLimit-Reset: 1642248000
Retry-After: 60
```

---

## Webhooks

The API supports webhooks for real-time event notifications. Webhook endpoints and events will be documented separately.

---

## SDKs and Libraries

Official SDKs are available for:
- JavaScript/TypeScript (recommended for Chaos Coder integration)
- Python
- .NET

---

## Support

For API support and integration questions:
- Email: api-support@law4hire.com
- Documentation: https://docs.law4hire.com/api
- Status Page: https://status.law4hire.com

---

*Last Updated: January 2024*
*API Version: v1*
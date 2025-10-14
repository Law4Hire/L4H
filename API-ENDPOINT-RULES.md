# L4H API Endpoint Rules & Documentation

## ⚠️ CRITICAL RULES - NO EXCEPTIONS

### Port Configuration (CRITICAL - FOLLOW EXACTLY)
- **API Backend**: `http://localhost:8765` (FIXED - DO NOT CHANGE)
- **Law4Hire Frontend**: Let Vite choose naturally (usually 5173) - DO NOT FORCE PORT
- **Cannlaw Frontend**: `http://localhost:5174` (may auto-increment if busy)
- **Upload Gateway**: `http://localhost:7070` (FIXED - DO NOT CHANGE)

### ⚠️ FRONTEND PORT RULE VIOLATION
**NEVER force frontend ports with --port flags unless explicitly requested**
- ❌ Wrong: `npm run dev -- --port 5175`
- ✅ Correct: `npm run dev` (let Vite choose available port)
- **Reason**: Vite automatically finds available ports and handles conflicts

### Route Prefixes (STRICT ENFORCEMENT)
- **Public Routes**: `/v1/` (no auth required)
- **Protected Routes**: `/api/v1/` (requires Authorization header)
- **Admin Routes**: `/v1/admin/` (requires admin privileges)
- **Health Routes**: `/` (root level)

---

## VERIFIED API ENDPOINTS

### 🟢 HEALTH & STATUS ENDPOINTS (Root Level)
| Method | Endpoint | Auth | Purpose | Test Status |
|--------|----------|------|---------|-------------|
| GET | `/healthz` | None | Liveness probe | ✅ Working |
| GET | `/ready` | None | Readiness probe | ✅ Working |
| GET | `/v1/ping` | None | Basic connectivity test | ✅ Working |

### 🟢 AUTHENTICATION ENDPOINTS (`/api/v1/auth`)
| Method | Endpoint | Auth | Purpose | Test Status |
|--------|----------|------|---------|-------------|
| GET | `/api/v1/auth/csrf` | None | Get CSRF token | ✅ Working |
| GET | `/api/v1/auth/check-email` | None | Check if email exists | ✅ Working |
| POST | `/api/v1/auth/signup` | None | Register new user | ✅ Working |
| POST | `/api/v1/auth/login` | None | User login | ✅ Working |
| POST | `/api/v1/auth/remember` | Cookie | Exchange remember token | ✅ Working |
| GET | `/api/v1/auth/verify` | None | Verify email token | ✅ Working |
| POST | `/api/v1/auth/forgot` | None | Request password reset | ✅ Working |
| POST | `/api/v1/auth/reset` | None | Reset password | ✅ Working |
| POST | `/api/v1/auth/logout-all` | Bearer | Logout from all devices | ✅ Working |
| GET | `/api/v1/auth/sessions` | Bearer | Get active sessions | ✅ Working |
| PUT | `/api/v1/auth/profile` | Bearer | Update user profile | ✅ Working |

### 🟢 CASES ENDPOINTS (`/api/v1/cases`)
| Method | Endpoint | Auth | Purpose | Test Status |
|--------|----------|------|---------|-------------|
| GET | `/api/v1/cases/mine` | Bearer | Get user's cases | ✅ Working |
| GET | `/api/v1/cases/{id}` | Bearer | Get specific case | ✅ Working |
| PATCH | `/api/v1/cases/{id}/status` | Bearer | Update case status | ✅ Working |

### 🟢 PRICING ENDPOINTS (`/api/v1/pricing`)
| Method | Endpoint | Auth | Purpose | Test Status |
|--------|----------|------|---------|-------------|
| GET | `/api/v1/pricing` | None | Get visa pricing | ⚠️ No data |
| POST | `/v1/cases/{id}/package` | Bearer | Select package for case | ✅ Working |

### 🟢 INTERVIEW ENDPOINTS (`/api/v1/interview`)
| Method | Endpoint | Auth | Purpose | Test Status |
|--------|----------|------|---------|-------------|
| POST | `/api/v1/interview/start` | Bearer | Start interview session | ✅ Working |
| POST | `/api/v1/interview/answer` | Bearer | Submit interview answer | ✅ Working |
| POST | `/api/v1/interview/complete` | Bearer | Complete interview | ✅ Working |
| POST | `/api/v1/interview/rerun` | Bearer | Restart interview | ✅ Working |
| POST | `/api/v1/interview/lock` | Bearer | Lock interview | ✅ Working |
| GET | `/api/v1/interview/history` | Bearer | Get interview history | ✅ Working |
| POST | `/api/v1/interview/next-question` | Bearer | Get next adaptive question | ✅ Working |

### 🟢 ADMIN ENDPOINTS (`/v1/admin`)
| Method | Endpoint | Auth | Purpose | Test Status |
|--------|----------|------|---------|-------------|
| GET | `/v1/admin/pricing/visa-types` | Admin | Get visa types for admin | ✅ Working |
| PATCH | `/v1/admin/pricing/visa-types/{id}` | Admin | Update visa type pricing | ✅ Working |
| GET | `/v1/admin/pricing/packages` | Admin | Get packages for admin | ✅ Working |
| GET | `/v1/admin/users` | Admin | Get all users | ✅ Working |
| PUT | `/v1/admin/users/{id}/roles` | Admin | Update user roles | ✅ Working |
| GET | `/v1/admin/cases` | Admin | Get all cases | ✅ Working |
| PATCH | `/v1/admin/cases/{id}/status` | Admin | Update case status | ✅ Working |
| GET | `/v1/admin/analytics/dashboard` | Admin | Get analytics dashboard | ✅ Working |
| GET | `/v1/admin/analytics/financial` | Admin | Get financial analytics | ✅ Working |
| GET | `/v1/admin/analytics/users` | Admin | Get user analytics | ✅ Working |

### 🟢 PUBLIC ENDPOINTS (`/v1/public`)
| Method | Endpoint | Auth | Purpose | Test Status |
|--------|----------|------|---------|-------------|
| GET | `/v1/public/visa-types` | None | Get public visa types | ✅ Working |

### 🟢 COUNTRIES ENDPOINTS (`/v1/countries`)
| Method | Endpoint | Auth | Purpose | Test Status |
|--------|----------|------|---------|-------------|
| GET | `/v1/countries` | None | Get all countries | ✅ Working |
| GET | `/v1/countries/{countryCode}` | None | Get specific country | ✅ Working |
| GET | `/v1/countries/us/subdivisions` | None | Get US states | ✅ Working |
| GET | `/v1/countries/{countryCode}/subdivisions` | None | Get country subdivisions | ✅ Working |

### 🟡 STUB/INCOMPLETE ENDPOINTS (Exist but need implementation)
| Method | Endpoint | Auth | Purpose | Status |
|--------|----------|------|---------|--------|
| Appointments | `/api/v1/appointments/*` | Bearer | Appointment management | 🚧 Stub |
| GraphMail | `/api/v1/graphmail/*` | Bearer | Email integration | 🚧 Stub |
| Messaging | `/api/v1/messaging/*` | Bearer | Internal messaging | 🚧 Stub |
| Payments | `/api/v1/payments/*` | Bearer | Payment processing | 🚧 Stub |
| Scheduling | `/api/v1/scheduling/*` | Bearer | Staff scheduling | 🚧 Stub |
| StaffAvailability | `/api/v1/staff/*` | Bearer | Staff availability | 🚧 Stub |
| Uploads | `/api/v1/uploads/*` | Bearer | File upload handling | 🚧 Stub |
| VisaChange | `/api/v1/visa-change/*` | Bearer | Visa status changes | 🚧 Stub |
| Webhooks | `/api/v1/webhooks/*` | None | External integrations | 🚧 Stub |
| WorkflowLookup | `/api/v1/workflow/*` | Bearer | Workflow management | 🚧 Stub |
| Internationalization | `/api/v1/i18n/*` | None | Localization | 🚧 Stub |

---

## ENDPOINT USAGE RULES

### 1. Authentication Requirements
```bash
# No Auth Required (Public)
curl -X GET http://localhost:8765/v1/ping
curl -X GET http://localhost:8765/v1/public/visa-types
curl -X GET http://localhost:8765/v1/countries

# Bearer Token Required (Protected)
curl -X GET http://localhost:8765/api/v1/cases/mine \
  -H "Authorization: Bearer YOUR_TOKEN"

# Admin Required (Admin)
curl -X GET http://localhost:8765/v1/admin/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 2. Token Acquisition
```bash
# Login to get token
TOKEN=$(curl -X POST http://localhost:8765/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dcann@cannlaw.com","password":"SecureTest123!"}' \
  | jq -r '.token')

# Use token in subsequent requests
curl -X GET http://localhost:8765/api/v1/cases/mine \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Common Request Patterns
```bash
# GET with query parameters
curl -X GET "http://localhost:8765/api/v1/pricing?visaType=H1B&country=US"

# POST with JSON body
curl -X POST http://localhost:8765/api/v1/interview/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"caseId":"some-uuid"}'

# PATCH for partial updates
curl -X PATCH http://localhost:8765/api/v1/cases/{id}/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status":"active"}'
```

---

## DEVELOPMENT ENFORCEMENT RULES

### ❌ FORBIDDEN PATTERNS
1. **Wrong Port Usage**:
   - ❌ `http://localhost:3000` (Wrong port)
   - ❌ `http://localhost:5000` (Wrong port)
   - ❌ `http://localhost:5175` (Frontend port, not API)

2. **Wrong Route Prefixes**:
   - ❌ `/api/auth/login` (Missing v1)
   - ❌ `/auth/login` (Missing api/v1)
   - ❌ `/v1/auth/login` (Wrong for protected route)

3. **Incorrect Headers**:
   - ❌ `Authorization: $TOKEN` (Missing "Bearer")
   - ❌ `Content-Type: text/plain` (Should be application/json)

### ✅ CORRECT PATTERNS
1. **Always use correct port**: `http://localhost:8765`
2. **Use proper route prefixes**:
   - Public: `/v1/ping`, `/v1/countries`
   - Protected: `/api/v1/auth/login`, `/api/v1/cases/mine`
   - Admin: `/v1/admin/users`
3. **Include proper headers**:
   - `Content-Type: application/json` for POST/PATCH
   - `Authorization: Bearer TOKEN` for protected routes

---

## QUICK REFERENCE COMMANDS

### Test Basic Connectivity
```bash
curl -X GET http://localhost:8765/healthz
curl -X GET http://localhost:8765/v1/ping
```

### Get Authentication Token
```bash
curl -X POST http://localhost:8765/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dcann@cannlaw.com","password":"SecureTest123!"}'
```

### Test Protected Endpoint
```bash
TOKEN="your-token-here"
curl -X GET http://localhost:8765/api/v1/cases/mine \
  -H "Authorization: Bearer $TOKEN"
```

### Test Admin Endpoint
```bash
curl -X GET http://localhost:8765/v1/admin/users \
  -H "Authorization: Bearer $TOKEN"
```

---

## MISSING ENDPOINTS TO IMPLEMENT

### High Priority (Core Functionality)
1. **File Upload System** (`/api/v1/uploads/*`)
   - POST `/api/v1/uploads/document` - Upload case document
   - GET `/api/v1/uploads/{id}` - Download document
   - DELETE `/api/v1/uploads/{id}` - Delete document

2. **Payment Processing** (`/api/v1/payments/*`)
   - POST `/api/v1/payments/create-intent` - Create payment intent
   - POST `/api/v1/payments/confirm` - Confirm payment
   - GET `/api/v1/payments/history` - Payment history

3. **Case Creation** (`/api/v1/cases`)
   - POST `/api/v1/cases` - Create new case
   - PUT `/api/v1/cases/{id}` - Update case details

### Medium Priority (Enhanced Features)
1. **Messaging System** (`/api/v1/messaging/*`)
2. **Appointment Management** (`/api/v1/appointments/*`)
3. **Workflow Management** (`/api/v1/workflow/*`)

### Low Priority (Admin/Staff Features)
1. **Staff Management** (`/api/v1/staff/*`)
2. **Scheduling System** (`/api/v1/scheduling/*`)
3. **Webhook Management** (`/api/v1/webhooks/*`)

---

## TESTING CHECKLIST

Before making any API calls, verify:
- [ ] Using correct port: `8765`
- [ ] Using correct route prefix (`/v1/`, `/api/v1/`, `/v1/admin/`)
- [ ] Including required headers (`Authorization`, `Content-Type`)
- [ ] Using proper HTTP method (GET, POST, PUT, PATCH, DELETE)
- [ ] Valid JSON in request body (if applicable)
- [ ] Valid authentication token (if required)

---

*Last Updated: 2025-09-17*
*Status: Comprehensive endpoint audit completed*
*Next Action: Implement missing high-priority endpoints*
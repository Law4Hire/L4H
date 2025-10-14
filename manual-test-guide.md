# Manual Test Guide - Profile Completion Workflow

## Prerequisites
- API Server running on localhost:8765 ✅
- Frontend Server running on localhost:5173 ✅

## Test Steps

### Step 1: Navigate to Login Page
1. Open browser to: http://localhost:5173/login
2. Verify login form is displayed

### Step 2: Login with Test User
Use the existing test user:
- **Email**: dcann@cannlaw.com
- **Password**: SecureTest123!

This user has `isProfileComplete: false` as verified by API testing.

### Step 3: Expected Behavior
After successful login, the user should be redirected to:
- **Expected URL**: http://localhost:5173/profile-completion
- **NOT**: http://localhost:5173/dashboard

### Step 4: Alternative Test - New User Registration
1. Navigate to: http://localhost:5173/register
2. Create a new user with any email/password
3. After registration, should also be redirected to profile completion

## Technical Details

### Backend Implementation ✅
- `AuthService.IsProfileComplete()` checks required fields:
  - Country
  - Nationality
  - StreetAddress
  - City
  - PostalCode
  - MaritalStatus
  - DateOfBirth

### Frontend Implementation ✅
- `LoginPage.tsx` and `RegisterPage.tsx` both check `result.isProfileComplete`
- If `false`, redirects to `/profile-completion`
- If `true`, redirects to `/dashboard`

### API Response Example
```json
{
  "token": "eyJhbGci...",
  "userId": "fa258161-3ea9-45bb-9424-98a977350050",
  "isProfileComplete": false
}
```

## Test Status
✅ Backend logic implemented and tested
✅ Frontend logic implemented
🔄 Manual testing required to verify end-to-end workflow

Open browser to http://localhost:5173/login and test!
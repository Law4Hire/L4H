# System Irritations & Minor Improvements

This document tracks small UI/UX improvements and quality-of-life features that would enhance the user experience but are not critical for core functionality.

## User Management

### 1. Edit User Profile Information
**Issue**: Currently, admins can only change user passwords and active/inactive status. Cannot edit basic profile information like names.

**Example**: If "Gregg Nielsen" should actually be "Greg Nielsen" (typo), there's no way to fix this through the admin interface.

**Solution Needed**:
- Add admin endpoint for updating user profile fields (firstName, lastName, email, etc.)
- Add edit form in admin user management interface
- Implement proper validation and audit logging

**Priority**: Low
**Complexity**: Medium
**Files Affected**:
- `AdminController.cs` (new endpoint)
- Admin user management UI components

---

## Navigation & Layout

### 2. Persistent Navigation Menu
**Issue**: Navigation menu disappears when scrolling down pages, requiring users to scroll back to top to access navigation.

**Impact**: Poor user experience, especially on long pages like user lists or detailed forms.

**Solution Needed**:
- Make navigation menu sticky/fixed position
- Ensure it remains visible during scroll
- Consider responsive design for mobile devices

**Priority**: Medium
**Complexity**: Low
**Files Affected**:
- Main layout components
- CSS/styling files

---

## User Onboarding Flow

### 3. Direct Interview After Account Creation
**Issue**: After users complete their second page of account information, they're redirected to the dashboard instead of being taken directly to their interview.

**Expected Behavior**: Seamless flow from account creation → interview → dashboard

**Current Flow**: Account creation → Dashboard (user must manually navigate to interview)
**Desired Flow**: Account creation → Interview → Dashboard (after interview completion)

**Solution Needed**:
- Modify post-registration redirect logic
- Add state tracking for new user onboarding
- Ensure interview completion redirects appropriately

**Priority**: Medium
**Complexity**: Medium
**Files Affected**:
- Registration/signup flow components
- Routing logic
- Interview page components

---

## Future Additions

*This section will be updated as more irritations are identified*

---

## Implementation Notes

- These items are intentionally deprioritized in favor of core functionality
- Each item should be implemented with proper testing
- Consider user feedback before implementing changes
- Maintain consistency with existing design patterns

**Last Updated**: 2025-09-19
**Status**: Planning Phase
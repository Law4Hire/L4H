# Requirements Document

## Introduction

This feature expands the Cannlaw system to include comprehensive client management, time tracking, billing, and enhanced attorney management capabilities. The system will support role-based access where administrators have full system access, legal professionals can manage their assigned clients, and both can track billable time in 6-minute increments.

## Requirements

### Requirement 1: Enhanced Attorney Management for Admins

**User Story:** As an administrator, I want to fully manage attorney profiles including adding/removing attorneys, uploading photos, and managing contact information, so that I can maintain accurate and professional attorney listings.

#### Acceptance Criteria

1. WHEN an admin accesses the attorney management page THEN the system SHALL display all attorneys with options to add, edit, or remove
2. WHEN an admin adds a new attorney THEN the system SHALL provide fields for name, title, email, phone, bio, practice areas, credentials, and photo upload
3. WHEN an admin uploads an attorney photo THEN the system SHALL accept common image formats (JPG, PNG, WebP) and resize appropriately
4. WHEN an admin removes an attorney THEN the system SHALL confirm the action and handle any existing client assignments
5. WHEN an admin edits attorney information THEN the system SHALL validate all fields and update the public website immediately

### Requirement 2: Client Management System

**User Story:** As a legal professional, I want to view and manage clients assigned to me, so that I can track their cases and provide appropriate service.

#### Acceptance Criteria

1. WHEN a legal professional accesses their dashboard THEN the system SHALL display only clients assigned to them
2. WHEN a legal professional views a client profile THEN the system SHALL show client details, case status, and billing information
3. WHEN a legal professional updates client information THEN the system SHALL save changes and log the modification
4. WHEN a legal professional accesses client management THEN the system SHALL provide filtering by case status

### Requirement 3: Admin Client Management with Search and Assignment

**User Story:** As an administrator, I want to view all clients with advanced search and assignment capabilities, so that I can efficiently manage the entire client base and workload distribution.

#### Acceptance Criteria

1. WHEN an admin accesses client management THEN the system SHALL display all clients regardless of assignment
2. WHEN an admin searches clients THEN the system SHALL support filtering by name, assigned legal professional, and case status
3. WHEN an admin views case statuses THEN the system SHALL support: Not Started, In Progress, Paid, Forms Completed, Complete, Closed (US Government Rejected)
4. WHEN an admin assigns a client THEN the system SHALL allow assignment to any legal professional or reassignment from one to another
5. WHEN an admin assigns an unassigned client THEN the system SHALL update the assignment and notify the legal professional
6. WHEN an admin searches by legal professional THEN the system SHALL show all clients assigned to that professional

### Requirement 4: Time Tracking and Billing System

**User Story:** As a legal professional, I want to track billable time in 6-minute increments for each client, so that accurate billing records are maintained.

#### Acceptance Criteria

1. WHEN a legal professional accesses a client account THEN the system SHALL provide a "Start Recording" button for time tracking
2. WHEN time recording is started THEN the system SHALL track time in 6-minute increments (0.1 hour billing units)
3. WHEN a legal professional stops time recording THEN the system SHALL save the time entry with description, date, and duration
4. WHEN time is recorded THEN the system SHALL associate it with the specific client and legal professional
5. WHEN viewing time entries THEN the system SHALL display date, duration, description, and billing status
6. WHEN time tracking is active THEN the system SHALL provide visual indication and allow adding notes/descriptions

### Requirement 5: Admin Billing Management Dashboard

**User Story:** As an administrator, I want to view billing information for each legal professional, so that I can monitor productivity and generate accurate billing reports.

#### Acceptance Criteria

1. WHEN an admin accesses the billing dashboard THEN the system SHALL display billing summary for each legal professional
2. WHEN viewing billing information THEN the system SHALL show total hours, billable amount, and time period filters
3. WHEN an admin selects a legal professional THEN the system SHALL display detailed time entries with client breakdown
4. WHEN generating billing reports THEN the system SHALL support date range filtering and export capabilities
5. WHEN viewing time entries THEN the system SHALL show client name, date, duration, description, and billing rate
6. WHEN calculating billing totals THEN the system SHALL use 6-minute increment rounding and configurable hourly rates

### Requirement 6: Client Profile and Case Management

**User Story:** As a legal professional or administrator, I want to access comprehensive client profiles with case tracking, so that I can manage cases effectively from initial contact to completion.

#### Acceptance Criteria

1. WHEN accessing a client profile THEN the system SHALL display personal information, case details, and status history
2. WHEN updating case status THEN the system SHALL log the change with timestamp and user information
3. WHEN a case reaches "Complete" status THEN the system SHALL require confirmation and final notes
4. WHEN a case is marked "Closed (US Government Rejected)" THEN the system SHALL require rejection reason and documentation
5. WHEN viewing case history THEN the system SHALL show all status changes, time entries, and notes chronologically
6. WHEN adding case notes THEN the system SHALL timestamp entries and associate with the current user

### Requirement 7: File Upload and Document Management

**User Story:** As a legal professional, I want to upload and manage client documents, so that all case-related files are organized and accessible.

#### Acceptance Criteria

1. WHEN accessing a client profile THEN the system SHALL provide document upload functionality
2. WHEN uploading documents THEN the system SHALL accept PDF, DOC, DOCX, and image formats
3. WHEN documents are uploaded THEN the system SHALL organize them by category and date
4. WHEN viewing documents THEN the system SHALL provide preview capabilities where possible
5. WHEN managing documents THEN the system SHALL allow renaming, categorizing, and deletion with proper permissions

### Requirement 8: Notification and Communication System

**User Story:** As a legal professional, I want to receive notifications about client assignments and case updates, so that I can respond promptly to important changes.

#### Acceptance Criteria

1. WHEN a client is assigned THEN the system SHALL notify the legal professional via email and in-app notification
2. WHEN case status changes THEN the system SHALL log the change and notify relevant parties
3. WHEN time tracking exceeds certain thresholds THEN the system SHALL provide warnings about billing limits
4. WHEN viewing notifications THEN the system SHALL show unread count and allow marking as read
5. WHEN critical case deadlines approach THEN the system SHALL send reminder notifications

### Requirement 9: Reporting and Analytics

**User Story:** As an administrator, I want to generate reports on case progress, billing, and attorney performance, so that I can make informed business decisions.

#### Acceptance Criteria

1. WHEN generating reports THEN the system SHALL support case status distribution, billing summaries, and attorney workload
2. WHEN viewing analytics THEN the system SHALL display charts for case completion rates and revenue trends
3. WHEN exporting reports THEN the system SHALL support PDF and Excel formats
4. WHEN filtering reports THEN the system SHALL allow date ranges, attorney selection, and case type filtering
5. WHEN viewing performance metrics THEN the system SHALL show average case completion time and client satisfaction indicators

### Requirement 10: Security and Access Control

**User Story:** As a system administrator, I want to ensure proper access control and data security, so that client information is protected and only accessible to authorized personnel.

#### Acceptance Criteria

1. WHEN users access the system THEN the system SHALL enforce role-based permissions (Admin, Legal Professional, Client)
2. WHEN handling sensitive data THEN the system SHALL encrypt client information and maintain audit logs
3. WHEN users attempt unauthorized actions THEN the system SHALL deny access and log the attempt
4. WHEN data is modified THEN the system SHALL maintain complete audit trails with user identification and timestamps
5. WHEN clients access their information THEN the system SHALL show only their own case details and assigned attorney information
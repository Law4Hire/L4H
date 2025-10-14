# Implementation Plan

- [x] 1. Database Schema and Entity Setup




  - Create new database entities for Client, Case, TimeEntry, Document, and BillingRate
  - Enhance existing Attorney entity with photo URL and additional contact fields
  - Set up proper entity relationships and foreign key constraints
  - Create Entity Framework migration for all new tables
  - _Requirements: 1.2, 2.1, 3.1, 4.4, 6.1_

- [x] 1.1 Create Client and Case entities


  - Implement Client entity with personal information, case relationships, and audit fields
  - Implement Case entity with status tracking, government case numbers, and history
  - Define CaseStatus enum with required statuses (Not Started, In Progress, Paid, Forms Completed, Complete, Closed Rejected)
  - _Requirements: 2.1, 3.3, 6.1, 6.2_

- [x] 1.2 Create TimeEntry and billing entities


  - Implement TimeEntry entity with 6-minute increment validation
  - Create BillingRate entity for configurable attorney rates
  - Set up relationships between TimeEntry, Client, and Attorney entities
  - Add billing calculation fields and audit tracking
  - _Requirements: 4.1, 4.2, 4.4, 5.1_

- [x] 1.3 Create Document management entity


  - Implement Document entity with file metadata and categorization
  - Define DocumentCategory enum for organizing client documents
  - Set up relationships with Client entity for document ownership
  - Add security fields for access control and audit trails
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 1.4 Enhance Attorney entity and create migration


  - Add PhotoUrl, DirectPhone, DirectEmail, OfficeLocation fields to Attorney entity
  - Add DefaultHourlyRate and IsActive fields for billing and management
  - Create Entity Framework migration for all schema changes
  - Update DbContext with new DbSets and relationships
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Backend API Controllers and Services





  - Implement enhanced AttorneysController with photo upload capabilities
  - Create ClientsController with role-based access and search functionality
  - Implement TimeTrackingController for time entry management
  - Create BillingController for admin billing dashboard and reporting
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1_

- [x] 2.1 Enhanced Attorneys Controller with file upload


  - Extend existing AttorneysController with photo upload endpoint
  - Implement file validation for image uploads (JPG, PNG, WebP)
  - Add image resizing and optimization for attorney photos
  - Create endpoints for full CRUD operations on attorney profiles
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2.2 Clients Controller with role-based access


  - Implement ClientsController with GET endpoints filtered by user role
  - Create search and filtering endpoints for name, attorney, and case status
  - Add client assignment and reassignment endpoints for admins
  - Implement client profile CRUD operations with proper authorization
  - _Requirements: 2.1, 2.2, 3.1, 3.2, 3.4, 3.5_

- [x] 2.3 Time Tracking Controller and validation


  - Create TimeTrackingController with start/stop timer endpoints
  - Implement 6-minute increment validation and rounding logic
  - Add time entry CRUD operations with client and attorney association
  - Create endpoints for retrieving time entries by client or attorney
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 2.4 Billing Controller and reporting


  - Implement BillingController with admin-only access for billing dashboard
  - Create endpoints for attorney billing summaries and detailed time entries
  - Add billing calculation logic with configurable hourly rates
  - Implement date range filtering and export capabilities for reports
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 2.5 Documents Controller and file management


  - Create DocumentsController for client document upload and management
  - Implement file upload validation for PDF, DOC, DOCX, and image formats
  - Add document categorization and metadata management
  - Create endpoints for document preview and download with access control
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 3. Business Logic Services





  - Create ClientService for client management and assignment logic
  - Implement TimeTrackingService for billing calculations and time validation
  - Create FileUploadService for handling attorney photos and client documents
  - Implement NotificationService for assignment and status change notifications
  - _Requirements: 2.3, 4.3, 5.5, 8.1, 8.2_

- [x] 3.1 Client Service with assignment logic


  - Implement ClientService with methods for client assignment and reassignment
  - Add business logic for case status transitions and validation
  - Create methods for client search and filtering with role-based results
  - Implement audit logging for all client data modifications
  - _Requirements: 2.3, 3.4, 3.5, 6.2, 10.4_

- [x] 3.2 Time Tracking Service with billing calculations


  - Create TimeTrackingService with 6-minute increment rounding logic
  - Implement billing amount calculations using attorney hourly rates
  - Add validation for concurrent time tracking sessions per attorney
  - Create methods for time entry aggregation and reporting
  - _Requirements: 4.2, 4.3, 4.6, 5.5, 5.6_

- [x] 3.3 File Upload Service for photos and documents


  - Implement FileUploadService with support for attorney photos and client documents
  - Add image processing for attorney photo resizing and optimization
  - Create secure file storage with proper access control and virus scanning
  - Implement file organization and metadata management
  - _Requirements: 1.3, 7.1, 7.2, 7.4_

- [x] 3.4 Notification Service for system alerts






  - Create NotificationService for email and in-app notifications
  - Implement notification templates for client assignments and status changes
  - Add notification delivery tracking and user preference management
  - Create methods for billing threshold warnings and deadline reminders
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 4. Frontend Components and Pages






  - Enhance AttorneyManagementPage with photo upload and full CRUD operations
  - Create comprehensive ClientManagementPage with search and role-based filtering
  - Implement TimeTrackingWidget with 6-minute increment timer functionality
  - Create BillingDashboard for admin oversight of all attorney billing
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1_

- [x] 4.1 Enhanced Attorney Management Page



  - Update AttorneyManagementPage with photo upload drag-and-drop interface
  - Add form validation for attorney contact information and credentials
  - Implement attorney activation/deactivation with client reassignment handling
  - Create responsive design for attorney profile cards with photos
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 4.2 Client Management Page with advanced search



  - Create ClientManagementPage with role-based client list display
  - Implement advanced search bar with filters for name, attorney, and case status
  - Add client assignment modal for admins with attorney selection dropdown
  - Create client profile cards with case status indicators and quick actions
  - _Requirements: 2.1, 2.4, 3.1, 3.2, 3.3, 3.4_

- [x] 4.3 Client Profile Page with case management



  - Implement comprehensive ClientProfilePage with personal information and case details
  - Add case status update functionality with validation and history tracking
  - Create document upload section with drag-and-drop and categorization
  - Implement time entry display with filtering and export capabilities
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 4.4 Time Tracking Widget and interface



  - Create TimeTrackingWidget with start/stop timer and 6-minute increment display
  - Implement active timer indicator with elapsed time and description input
  - Add time entry list with editing capabilities and billing status
  - Create time entry form with client selection and activity description
  - _Requirements: 4.1, 4.2, 4.3, 4.5, 4.6_

- [x] 4.5 Admin Billing Dashboard



  - Implement BillingDashboard with attorney billing summary cards
  - Create detailed billing view with time entry breakdown by client
  - Add date range filtering and export functionality for billing reports
  - Implement billing analytics with charts for revenue trends and attorney performance
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 4.6 Document Management Interface



  - Create document upload zone with drag-and-drop functionality and progress indicators
  - Implement document viewer with preview capabilities for supported file types
  - Add document organization with categorization and search functionality
  - Create document sharing interface with access control and download tracking
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 5. React Hooks and State Management






  - Create useClients hook for client data management with role-based filtering
  - Implement useTimeTracking hook for timer functionality and time entry management
  - Create useBilling hook for admin billing data and calculations
  - Implement useFileUpload hook for attorney photos and client document uploads
  - _Requirements: 2.1, 4.1, 5.1, 7.1_

- [x] 5.1 Client management hooks


  - Create useClients hook with role-based filtering and search capabilities
  - Implement useClientAssignment hook for admin client assignment functionality
  - Add useClientProfile hook for comprehensive client data management
  - Create useCaseStatus hook for case status updates and history tracking
  - _Requirements: 2.1, 2.2, 3.1, 3.4, 6.1, 6.2_

- [x] 5.2 Time tracking and billing hooks


  - Implement useTimeTracking hook with timer start/stop and 6-minute increment logic
  - Create useTimeEntries hook for time entry CRUD operations and filtering
  - Add useBilling hook for admin billing dashboard data and calculations
  - Implement useBillingReports hook for report generation and export functionality
  - _Requirements: 4.1, 4.2, 4.3, 5.1, 5.2, 5.3_

- [x] 5.3 File upload and document management hooks


  - Create useFileUpload hook with progress tracking and error handling
  - Implement useDocuments hook for client document management and categorization
  - Add useAttorneyPhotos hook for attorney photo upload and management
  - Create useDocumentViewer hook for document preview and download functionality
  - _Requirements: 1.3, 7.1, 7.2, 7.3, 7.4_

- [x] 5.4 Notification and communication hooks






  - Implement useNotifications hook for in-app notification management
  - Create useEmailNotifications hook for email notification preferences
  - Add useSystemAlerts hook for billing warnings and deadline reminders
  - Create useCommunication hook for client-attorney messaging functionality
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 6. Authentication and Authorization Enhancements





  - Extend JWT claims to include attorney assignment information
  - Implement role-based route protection for admin and legal professional features
  - Add client data access control based on attorney assignments
  - Create authorization policies for billing and time tracking features
  - _Requirements: 10.1, 10.2, 10.3_

- [x] 6.1 Enhanced JWT claims and role management


  - Extend JWT token generation to include attorney ID and client assignments
  - Update authentication middleware to handle new role-based permissions
  - Implement authorization policies for admin-only and legal professional features
  - Add client access validation based on attorney assignments
  - _Requirements: 10.1, 10.2, 10.3_

- [x] 6.2 Route protection and access control


  - Implement protected routes for admin billing dashboard and attorney management
  - Add client data filtering based on user role and attorney assignments
  - Create authorization attributes for API controllers with role validation
  - Implement frontend route guards for role-based navigation
  - _Requirements: 2.1, 3.1, 5.1, 10.1, 10.3_

- [x] 7. Data Initialization and Migration





  - Create database migration with sample client and case data
  - Initialize default billing rates for existing attorneys
  - Set up default case status workflow and validation rules
  - Create admin user with full system access for testing
  - _Requirements: 1.4, 4.4, 6.2_

- [x] 7.1 Database migration and sample data


  - Execute Entity Framework migration to create new tables and relationships
  - Insert sample client data with various case statuses for testing
  - Create default billing rates for existing attorneys in the system
  - Initialize case status workflow rules and validation constraints
  - _Requirements: 1.4, 4.4, 5.6, 6.2_

- [x] 7.2 System configuration and default settings


  - Configure default hourly rates and billing increment settings
  - Set up file upload limits and allowed file types for documents and photos
  - Initialize notification templates and delivery preferences
  - Create system admin user with full access to all features
  - _Requirements: 1.5, 4.4, 7.1, 8.1_

- [x] 8. Integration Testing and Validation







  - Test complete client management workflow from assignment to case completion
  - Validate time tracking accuracy with 6-minute increments and billing calculations
  - Test role-based access control for all user types and features
  - Verify file upload functionality for attorney photos and client documents
  - _Requirements: All requirements validation_

- [x] 8.1 Client management workflow testing


  - Test client assignment and reassignment functionality for admin users
  - Validate case status transitions and history tracking
  - Test client search and filtering with various criteria combinations
  - Verify role-based client access for legal professionals vs admins
  - _Requirements: 2.1, 3.1, 3.4, 6.1, 6.2_

- [x] 8.2 Time tracking and billing validation


  - Test timer functionality with 6-minute increment rounding and validation
  - Validate billing calculations with different attorney rates and time periods
  - Test concurrent time tracking prevention and session management
  - Verify billing report generation and export functionality
  - _Requirements: 4.1, 4.2, 4.3, 5.1, 5.5_

- [ ]* 8.3 Security and access control testing
  - Test role-based permissions for all API endpoints and frontend routes
  - Validate client data isolation between different legal professionals
  - Test file upload security with various file types and sizes
  - Verify audit logging for all data modifications and access attempts
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ]* 8.4 Performance and scalability testing
  - Test client search performance with large datasets and complex filters
  - Validate file upload performance with multiple concurrent uploads
  - Test billing calculation performance with extensive time entry data
  - Verify dashboard load times with real-time data updates
  - _Requirements: Performance optimization goals_
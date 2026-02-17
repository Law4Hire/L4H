# USCIS Forms Management System - Project Plan

## Overview

This feature adds comprehensive USCIS form management to the L4H platform, allowing admins to:
1. Manage USCIS forms database
2. Set pricing for form preparation services
3. Map forms to visa types
4. Define form dependencies (which forms require other forms)

## Database Schema Design

### 1. USCISForms Table
Stores all USCIS form information.

```sql
- Id (Guid, PK)
- FormNumber (string, unique) -- e.g., "I-129", "I-140"
- FormName (string) -- e.g., "Petition for a Nonimmigrant Worker"
- Description (string, nullable) -- Detailed description
- FormUrl (string, nullable) -- Link to official USCIS form PDF
- IsActive (bool) -- Whether form is currently in use
- EstimatedTimeMinutes (int, nullable) -- Estimated time to complete
- CreatedAt (DateTime)
- UpdatedAt (DateTime)
- CreatedByUserId (Guid, nullable, FK to Users)
- UpdatedByUserId (Guid, nullable, FK to Users)
```

**Indexes:**
- Unique index on FormNumber
- Index on IsActive

### 2. FormPricing Table
Stores pricing information for form preparation services.

```sql
- Id (Guid, PK)
- FormId (Guid, FK to USCISForms)
- PriceUSD (decimal(10,2)) -- Base price for form preparation
- ProfessionalPriceUSD (decimal(10,2), nullable) -- Price when attorney/paralegal involved
- Description (string, nullable) -- Pricing notes
- IsActive (bool) -- Whether this pricing is current
- EffectiveDate (DateTime) -- When this pricing became effective
- ExpirationDate (DateTime, nullable) -- When this pricing expires
- CreatedAt (DateTime)
- UpdatedAt (DateTime)
- CreatedByUserId (Guid, nullable, FK to Users)
- UpdatedByUserId (Guid, nullable, FK to Users)
```

**Indexes:**
- Index on FormId
- Index on EffectiveDate
- Index on IsActive

### 3. FormVisaTypeMappings Table
Maps which forms are required for which visa types.

```sql
- Id (Guid, PK)
- FormId (Guid, FK to USCISForms)
- VisaTypeId (Guid, FK to VisaTypes)
- IsRequired (bool) -- Whether form is required or optional
- DisplayOrder (int) -- Order to display forms for this visa
- Notes (string, nullable) -- Special notes for this form-visa combo
- CreatedAt (DateTime)
- UpdatedAt (DateTime)
- CreatedByUserId (Guid, nullable, FK to Users)
- UpdatedByUserId (Guid, nullable, FK to Users)
```

**Indexes:**
- Composite index on (FormId, VisaTypeId) - unique
- Index on VisaTypeId
- Index on DisplayOrder

### 4. FormDependencies Table
Defines which forms require other forms (hierarchy).

```sql
- Id (Guid, PK)
- ParentFormId (Guid, FK to USCISForms) -- The main form
- DependentFormId (Guid, FK to USCISForms) -- The required supporting form
- VisaTypeId (Guid, FK to VisaTypes, nullable) -- Dependency specific to visa type
- IsRequired (bool) -- Whether dependent form is required or recommended
- DependencyReason (string, nullable) -- Why this form is required
- DisplayOrder (int) -- Order to display dependencies
- CreatedAt (DateTime)
- UpdatedAt (DateTime)
```

**Indexes:**
- Index on ParentFormId
- Index on DependentFormId
- Index on VisaTypeId
- Composite index on (ParentFormId, VisaTypeId) for quick lookups

**Business Rule**: Prevent circular dependencies (form A requires B, B requires A)

## Common USCIS Forms by Visa Type

### H-1B Visa
- I-129 (Petition for a Nonimmigrant Worker) - PRIMARY
- I-907 (Request for Premium Processing Service) - OPTIONAL
- I-539 (Application to Extend/Change Nonimmigrant Status) - OPTIONAL
- G-28 (Notice of Entry of Appearance as Attorney) - OPTIONAL
- LCA (Labor Condition Application) - REQUIRED (not USCIS, DOL)

### L-1 Visa
- I-129 (with L Supplement) - PRIMARY
- I-907 (Premium Processing) - OPTIONAL
- I-129S (Nonimmigrant Petition Based on Blanket L Petition) - OPTIONAL

### O-1 Visa
- I-129 (with O Supplement) - PRIMARY
- I-907 (Premium Processing) - OPTIONAL

### E-2 Visa
- DS-160 (Online Nonimmigrant Visa Application) - PRIMARY
- DS-156E (Treaty Trader/Investor Application) - PRIMARY

### EB-2/EB-3 (Green Card)
- I-140 (Immigrant Petition for Alien Workers) - PRIMARY
- I-485 (Application to Register Permanent Residence) - PRIMARY
- I-765 (Application for Employment Authorization) - OPTIONAL
- I-131 (Application for Travel Document) - OPTIONAL
- I-693 (Medical Examination) - REQUIRED
- I-864 (Affidavit of Support) - if family-based

### EB-1 (Green Card)
- I-140 (Immigrant Petition for Alien Workers) - PRIMARY
- I-485 (Application to Register Permanent Residence) - PRIMARY

### TN Visa (NAFTA/USMCA)
- I-129 (for change of status) - OPTIONAL
- No specific form required at border - just documentation

## API Endpoints Design

### Forms Management
```
GET    /api/admin/uscis-forms                    - List all forms
GET    /api/admin/uscis-forms/{id}               - Get form by ID
POST   /api/admin/uscis-forms                    - Create new form
PUT    /api/admin/uscis-forms/{id}               - Update form
DELETE /api/admin/uscis-forms/{id}               - Delete form
GET    /api/admin/uscis-forms/by-visa/{visaId}   - Get forms for visa type
```

### Pricing Management
```
GET    /api/admin/uscis-forms/{id}/pricing       - Get pricing for form
POST   /api/admin/uscis-forms/{id}/pricing       - Create/Update pricing
GET    /api/admin/uscis-forms/pricing/active     - Get all active pricing
```

### Visa Type Mappings
```
GET    /api/admin/uscis-forms/visa-mappings                      - Get all mappings
POST   /api/admin/uscis-forms/visa-mappings                      - Create mapping
PUT    /api/admin/uscis-forms/visa-mappings/{id}                 - Update mapping
DELETE /api/admin/uscis-forms/visa-mappings/{id}                 - Delete mapping
GET    /api/admin/uscis-forms/visa-mappings/by-visa/{visaId}     - Get forms for visa
```

### Form Dependencies
```
GET    /api/admin/uscis-forms/{id}/dependencies          - Get dependencies for form
POST   /api/admin/uscis-forms/{id}/dependencies          - Create dependency
DELETE /api/admin/uscis-forms/dependencies/{id}          - Delete dependency
GET    /api/admin/uscis-forms/{id}/dependency-tree       - Get full dependency tree
POST   /api/admin/uscis-forms/validate-dependencies      - Validate no circular deps
```

## Frontend UI Design

### AdminUSCISFormsPage Components

#### 1. Main Layout
- Search bar (search by form number, name)
- Filter by visa type dropdown
- Filter by active/inactive
- "Create New Form" button
- Forms list table/cards

#### 2. Forms List Table
Columns:
- Form Number (sortable)
- Form Name (sortable)
- Visa Types (tags/chips)
- Current Pricing (if any)
- Dependencies count
- Status (Active/Inactive)
- Actions (Edit, Pricing, Dependencies, Delete)

#### 3. Form Create/Edit Modal
Tabs:
- **Basic Info Tab**:
  - Form Number (input)
  - Form Name (input)
  - Description (textarea)
  - Form URL (input)
  - Estimated Time (number input)
  - Active status (checkbox)

- **Pricing Tab**:
  - Base Price USD (number input)
  - Professional Price USD (number input)
  - Pricing Description (textarea)
  - Effective Date (date picker)
  - Expiration Date (date picker, optional)

- **Visa Types Tab**:
  - Multi-select checkboxes for visa types
  - For each selected visa:
    - Required/Optional toggle
    - Display order (number)
    - Notes (textarea)

- **Dependencies Tab**:
  - Current dependencies list
  - "Add Dependency" button
  - For each dependency:
    - Select dependent form (dropdown)
    - Select visa type (optional - "all" or specific)
    - Required/Recommended toggle
    - Reason (textarea)
    - Display order
  - Visual tree view of dependencies

#### 4. Dependency Tree View Component
- Hierarchical tree display
- Show form number and name
- Indicate required vs optional
- Collapsible nodes
- Visual indicators for circular dependency warnings

## Data Seeding Strategy

Create `USCISFormsSeeder.cs` that:
1. Checks if USCISForms table is empty
2. Seeds common forms (I-129, I-140, I-485, I-765, I-131, I-907, etc.)
3. Seeds default pricing (can be updated later)
4. Seeds form-visa mappings for major visa types
5. Seeds common dependencies (e.g., I-140 → I-485)

## Task Breakdown

### Phase 1: Database & Backend (Tasks 1-10)
1. ✅ Research USCIS forms
2. ✅ Create database schema
3. ✅ Create entities
4. ✅ Create migration
5. ✅ Update DbContext
6. ✅ Seed initial data
7. ✅ Create controller
8. ✅ Implement CRUD endpoints
9. ✅ Implement pricing endpoints
10. ✅ Implement dependency endpoints

### Phase 2: Frontend UI (Tasks 11-17)
11. ✅ Create admin page component
12. ✅ Implement forms list view
13. ✅ Implement form editor modal
14. ✅ Implement pricing UI
15. ✅ Implement visa mapping UI
16. ✅ Implement dependency tree UI
17. ✅ Add to admin navigation

### Phase 3: Testing & Deployment (Tasks 18-20)
18. ✅ Test CRUD operations
19. ✅ Test dependencies
20. ✅ Commit and push

## Success Criteria

- ✅ Admin can view all USCIS forms
- ✅ Admin can create/edit/delete forms
- ✅ Admin can set pricing for each form
- ✅ Admin can map forms to visa types
- ✅ Admin can define form dependencies
- ✅ System prevents circular dependencies
- ✅ Dependency tree displays correctly
- ✅ All data persists to database
- ✅ Changes are reflected immediately in UI

## Estimated Effort

- **Phase 1** (Database & Backend): ~2-3 hours
- **Phase 2** (Frontend UI): ~3-4 hours
- **Phase 3** (Testing): ~1 hour
- **Total**: ~6-8 hours of development

## Next Steps

Once approved, we will:
1. Start with database schema and migrations
2. Build backend API layer
3. Create frontend admin interface
4. Test thoroughly
5. Deploy to production

---

**Status**: Planning Complete - Awaiting Approval to Begin Implementation
**Created**: December 4, 2025
**Author**: Claude Code

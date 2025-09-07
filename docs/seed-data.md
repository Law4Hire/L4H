# Seed Data Management

## Overview

The L4H system requires comprehensive seed data to provide accurate immigration services. This document outlines the planned seeding strategy using EF Core data seeders based on reference SQL files.

## Planned Seed Data Categories

### 1. Countries
**Purpose**: Complete world countries database for nationality and destination selection

**Source**: `SpecSQL/InsertAllCountries.sql` + `SpecSQL/InsertMissing17Countries.sql`

**Data Includes**:
- ISO 3166-1 alpha-2 and alpha-3 country codes
- Official country names (English)
- Regional classifications
- Active/inactive status
- Additional metadata for immigration purposes

**Implementation**: `CountriesSeeder.cs`
- Will seed approximately 195+ countries
- Idempotent operations (safe to run multiple times)
- Uses ISO codes as natural keys to prevent duplicates

### 2. US Subdivisions  
**Purpose**: Complete US states, territories, and administrative divisions

**Source**: `SpecSQL/InsertAllUSStatesFixed.sql`

**Data Includes**:
- All 50 US states
- Federal districts (Washington D.C.)
- US territories (Puerto Rico, US Virgin Islands, etc.)
- Military APO/FPO addresses
- USPS abbreviations and FIPS codes

**Implementation**: `USSubdivisionsSeeder.cs`
- Essential for US immigration processes
- Includes territories important for visa applications
- Linked to Countries seeder via foreign key relationship

### 3. Visa Classes
**Purpose**: Immigration visa categories and classifications

**Source**: `SpecSQL/LoadCategoryClassData.sql`

**Data Includes**:
- Visa categories (Family, Employment, Diversity, etc.)
- Specific visa classifications (H-1B, F-1, EB-5, etc.)
- Category hierarchies and relationships
- Processing requirements and eligibility criteria
- Fee structures and timelines

**Implementation**: `VisaClassesSeeder.cs`
- Critical for visa eligibility determinations
- Used by interview logic and recommendation engine
- Includes both immigrant and non-immigrant classifications

## Seeder Architecture

### Base Seeder Interface
```csharp
public interface IDataSeeder
{
    Task SeedAsync(L4HDbContext context);
    string SeederName { get; }
    int Priority { get; } // Execution order
}
```

### Idempotent Design Principles
All seeders follow these principles:

1. **Natural Key Matching**: Use business keys (ISO codes, USCIS codes) rather than database IDs
2. **Upsert Operations**: Update existing records, insert missing ones
3. **Soft Deletes**: Mark records as inactive rather than deleting
4. **Change Detection**: Only update when actual changes detected
5. **Logging**: Comprehensive logging of seeding operations

### Execution Order
1. **Countries** (Priority: 1) - Foundation data
2. **US Subdivisions** (Priority: 2) - Depends on Countries
3. **Visa Classes** (Priority: 3) - Independent, can run in parallel with subdivisions

## Implementation Plan

### Phase 1: Data Analysis
- ✅ Preserve reference SQL files in SpecSQL directory
- ✅ Clean up legacy/incompatible scripts
- ✅ Document data sources and structure

### Phase 2: EF Core Integration (Next)
```bash
# Create seeder infrastructure
src/api/Data/Seeders/
├── IDataSeeder.cs
├── DataSeederService.cs
├── CountriesSeeder.cs
├── USSubdivisionsSeeder.cs
└── VisaClassesSeeder.cs
```

### Phase 3: Entity Models (Next)
```bash
# Add missing entities to match seed data
src/Infrastructure/Entities/
├── Country.cs (enhance existing)
├── USSubdivision.cs (new)
└── VisaClass.cs (enhance existing)
```

### Phase 4: Integration
- Register seeders in DI container
- Call from Program.cs during startup (Development/Staging only)
- Add database initialization endpoint for production

## Reference Files

### Current Status ✅
The following reference files are preserved in `SpecSQL/`:

1. **InsertAllCountries.sql** (12.7 KB)
   - 195+ countries with ISO codes and metadata
   - Regional classifications and status flags

2. **InsertMissing17Countries.sql** (1.7 KB)  
   - Additional countries not in the main list
   - Special territories and dependencies

3. **InsertAllUSStatesFixed.sql** (3.4 KB)
   - 50 states + DC + territories
   - USPS abbreviations and FIPS codes

4. **LoadCategoryClassData.sql** (3.5 KB)
   - Visa categories and classifications
   - Hierarchical structure with relationships

### Removed Files 🗑️
Cleaned up legacy files (27 files removed):
- Development test scripts
- Schema migration scripts  
- Obsolete data loads
- Duplicate/incorrect versions
- Analysis and verification scripts

## Database Schema Impact

### New Tables Required
```sql
-- US Subdivisions (States, Territories)
CREATE TABLE USSubdivisions (
    Id int IDENTITY PRIMARY KEY,
    CountryId int NOT NULL REFERENCES Countries(Id),
    Code nvarchar(5) NOT NULL,        -- USPS abbreviation
    Name nvarchar(100) NOT NULL,      -- Full name
    Type nvarchar(20) NOT NULL,       -- State, Territory, District
    FipsCode nvarchar(5),             -- FIPS code
    IsActive bit NOT NULL DEFAULT 1,
    UNIQUE(Code),
    INDEX IX_USSubdivisions_CountryId (CountryId)
);
```

### Enhanced Existing Tables
```sql
-- Countries (enhance existing)
ALTER TABLE Countries ADD
    IsoAlpha3 nvarchar(3),           -- 3-letter ISO code
    Region nvarchar(50),             -- Geographic region
    SubRegion nvarchar(50),          -- Sub-region classification
    IsActive bit DEFAULT 1;         -- Active status

-- VisaTypes/Classes (enhance existing)  
ALTER TABLE VisaTypes ADD
    Category nvarchar(50),           -- Family, Employment, etc.
    ProcessingTimeMonths int,        -- Typical processing time
    IsImmigrant bit DEFAULT 0;       -- Immigrant vs non-immigrant
```

## Verification and Testing

### Data Integrity Checks
1. **Referential Integrity**: All foreign key relationships valid
2. **Uniqueness**: No duplicate codes or names within categories
3. **Completeness**: All expected records present (country count, state count, etc.)
4. **Consistency**: Data matches official sources (ISO, USCIS, USPS)

### Test Strategy
```csharp
[Test]
public async Task CountriesSeeder_SeedsAllExpectedCountries()
{
    // Verify 195+ countries seeded
    // Check key countries like US, UK, Canada, Mexico
    // Validate ISO code format and uniqueness
}

[Test]  
public async Task USSubdivisionsSeeder_SeedsAllStatesAndTerritories()
{
    // Verify 50 states + DC + territories  
    // Check USPS abbreviation uniqueness
    // Validate foreign key relationships
}

[Test]
public async Task VisaClassesSeeder_SeedsVisaHierarchy() 
{
    // Verify category structure
    // Check common visa types (H1B, F1, etc.)
    // Validate classification logic
}
```

## Production Deployment

### Strategy
1. **Staging Environment**: Full seed data testing
2. **Production Initialization**: One-time seeding via admin endpoint
3. **Updates**: Incremental updates via versioned migrations
4. **Monitoring**: Seed data health checks and alerts

### Admin Endpoint
```http
POST /admin/seed-data
Authorization: Bearer {admin-jwt}
Content-Type: application/json

{
  "seeders": ["Countries", "USSubdivisions", "VisaClasses"],
  "force": false  // Skip if already seeded
}
```

## Maintenance

### Regular Updates
- **Countries**: Annual review for new nations/status changes
- **US Subdivisions**: Rare changes (new territories)
- **Visa Classes**: Updates per USCIS policy changes

### Version Control
- Seed data versions tracked in `DataSeedVersion` table
- Migration scripts for data updates
- Rollback capability for incorrect seeds

---

*Last Updated: 2025-09-01*
*Status: Reference Files Prepared - Implementation Pending*
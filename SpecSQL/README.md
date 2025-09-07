# SpecSQL - SQL Seed Data Reference

## Overview

The remaining files in this directory are **reference only** for building EF Core seeders. These files contain the source data that will be converted into idempotent EF Core seed data.

## Files

### Countries and Subdivisions
- **InsertAllCountries.sql** - Complete list of countries with ISO codes, names, and metadata
- **InsertMissing17Countries.sql** - Additional country data to supplement the main countries list
- **InsertAllUSStatesFixed.sql** - Complete US states, territories, and subdivisions with proper codes

### Visa Classification Data
- **LoadCategoryClassData.sql** - Visa categories and classifications used by the system

## Important Notes

⚠️ **DO NOT execute these SQL files directly against the database**

These files are legacy SQL scripts that are incompatible with the current EF Core schema. They are preserved as reference material for creating proper EF Core seeders.

## Future Implementation

We will convert these reference files into:
1. **Countries Seeder** - Idempotent seeding of world countries
2. **US Subdivisions Seeder** - States, territories, and administrative divisions  
3. **Visa Classes Seeder** - Immigration visa categories and classifications

All seeders will be implemented as EF Core data seeding operations that can be safely run multiple times without creating duplicates.

## Removed Files

All other SQL files in this directory were removed as they were either:
- Legacy scripts incompatible with current schema
- Development/testing utilities no longer needed
- Superseded by newer implementations
- Containing obsolete or incorrect data

---
*Last Updated: 2025-09-01*
*Status: Reference Data Only*
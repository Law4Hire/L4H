# Immigration Interview Decision Tree - Complete Path Map

This document maps all possible paths through the L4H immigration interview system based on the DecisionTreeQuestionEngine implementation.

## Overview

The interview follows a hierarchical structure:
1. **Foundation Questions** (2 questions - everyone gets these)
2. **Category-Specific Questions** (varies by category selected)
3. **Contact Information** (5-6 questions based on location)

---

## Foundation Questions (Everyone)

### Question 1: Location
**Key**: `location`
**Question**: "Are you currently inside or outside the United States?"

**Options**:
- `inside_us` - Inside the United States
- `outside_us` - Outside the United States

### Question 2: Category
**Key**: `category`
**Question**: "What is your primary immigration purpose?"

**Options**:
- `nonimmigrant` - Nonimmigrant (Temporary stay/work)
- `immigrant` - Immigrant (Permanent residence/Green Card)
- `family` - Family-based immigration
- `student` - Student visa
- `investor` - Investor visa
- `citizen` - US Citizenship/Naturalization

---

## Path 1: Nonimmigrant (Temporary Stay/Work)

### Q3: Nonimmigrant Type
**Key**: `nonimmigrant_type`
**Question**: "What type of nonimmigrant visa are you seeking?"

**Options**:
- `work` - Work/Employment → **Go to Q4**
- `business` - Business visitor → **Go to Contact Info**
- `tourism` - Tourism/Visit → **Go to Contact Info**
- `exchange` - Exchange visitor program → **Go to Contact Info**
- `other` - Other temporary purpose → **Go to Contact Info**

### Q4: Work Visa Type (if `nonimmigrant_type` = work)
**Key**: `work_visa_type`
**Question**: "Which work visa category best describes your situation?"

**Options**:
- `H-1B` - Specialty occupation requiring bachelor's degree or higher → **Go to Q5a**
- `L-1` - Intracompany transferee → **Go to Q5b**
- `O-1` - Extraordinary ability → **Go to Q5c**
- `E-2` - Treaty investor → **Go to Contact Info**
- `TN` - NAFTA professional (Canadian or Mexican) → **Go to Contact Info**
- `H-2A` - Temporary agricultural worker → **Go to Contact Info**
- `H-2B` - Temporary non-agricultural worker → **Go to Contact Info**
- `other` - Other work visa → **Go to Contact Info**

### Q5a: H-1B Employer Status (if `work_visa_type` = H-1B)
**Key**: `h1b_employer`
**Question**: "Do you have a US employer willing to sponsor your H-1B visa?"

**Options**:
- `yes` - Yes, I have an employer sponsor → **Go to Contact Info**
- `no` - No, but I'm looking for one → **Go to Contact Info**
- `unsure` - Not sure yet → **Go to Contact Info**

### Q5b: L-1 Company Relationship (if `work_visa_type` = L-1)
**Key**: `l1_company_relationship`
**Question**: "Have you worked for a related foreign company for at least 1 year in the past 3 years?"

**Options**:
- `yes` - Yes → **Go to Contact Info**
- `no` - No → **Go to Contact Info**

### Q5c: O-1 Recognition (if `work_visa_type` = O-1)
**Key**: `o1_recognition`
**Question**: "Do you have sustained national or international acclaim in your field?"

**Options**:
- `yes` - Yes, with documentation (awards, media coverage, etc.) → **Go to Contact Info**
- `maybe` - I'm not sure if I qualify → **Go to Contact Info**
- `no` - No → **Go to Contact Info**

**Total Nonimmigrant Paths**: 15 possible variations

---

## Path 2: Immigrant (Permanent Residence/Green Card)

### Q3: Immigrant Basis
**Key**: `immigrant_basis`
**Question**: "What is the basis for your immigrant visa application?"

**Options**:
- `employment` - Employment-based (EB) → **Go to Q4**
- `family` - Family-based → **Go to Contact Info**
- `diversity` - Diversity Visa Lottery → **Go to Contact Info**
- `humanitarian` - Humanitarian (refugee, asylee) → **Go to Contact Info**
- `other` - Other → **Go to Contact Info**

### Q4: EB Category (if `immigrant_basis` = employment)
**Key**: `eb_category`
**Question**: "Which employment-based category best describes your qualifications?"

**Options**:
- `EB-1` - Extraordinary ability, outstanding professors/researchers, or multinational executives → **Go to Q5a**
- `EB-2` - Advanced degree (Master's or higher) or exceptional ability → **Go to Q5b**
- `EB-3` - Skilled workers, professionals, or other workers → **Go to Q5c**
- `EB-5` - Immigrant investor ($800,000 or $1,050,000) → **Go to Contact Info**
- `unsure` - Not sure which category → **Go to Contact Info**

### Q5a: EB-1 Type (if `eb_category` = EB-1)
**Key**: `eb1_type`
**Question**: "Which EB-1 subcategory applies to you?"

**Options**:
- `EB-1A` - Extraordinary ability in sciences, arts, education, business, or athletics → **Go to Contact Info**
- `EB-1B` - Outstanding professor or researcher → **Go to Contact Info**
- `EB-1C` - Multinational manager or executive → **Go to Contact Info**

### Q5b: EB-2 NIW (if `eb_category` = EB-2)
**Key**: `eb2_niw`
**Question**: "Are you seeking a National Interest Waiver (NIW) to self-petition without employer sponsorship?"

**Options**:
- `yes` - Yes, I want to apply for NIW → **Go to Contact Info**
- `no` - No, I have employer sponsorship → **Go to Contact Info**
- `unsure` - Not sure → **Go to Contact Info**

### Q5c: EB-3 Category (if `eb_category` = EB-3)
**Key**: `eb3_category`
**Question**: "Which EB-3 category do you fall under?"

**Options**:
- `skilled` - Skilled worker - At least 2 years training or experience → **Go to Contact Info**
- `professional` - Professional - Bachelor's degree required → **Go to Contact Info**
- `other` - Other worker - Less than 2 years experience → **Go to Contact Info**

**Total Immigrant Paths**: 14 possible variations

---

## Path 3: Family-Based Immigration

### Q3: Family Petitioner
**Key**: `family_petitioner`
**Question**: "Who is petitioning for you?"

**Options**:
- `us_citizen` - US Citizen family member → **Go to Q4a**
- `green_card` - Green Card holder (Permanent Resident) → **Go to Q4b**
- `self` - I'm petitioning for a family member → **Go to Contact Info**

### Q4a: Relationship to US Citizen (if `family_petitioner` = us_citizen)
**Key**: `relationship_to_citizen`
**Question**: "What is your relationship to the US citizen?"

**Options**:
- `spouse` - Spouse → **Go to Q5**
- `parent` - Parent of US citizen (age 21+) → **Go to Contact Info**
- `child_under21` - Unmarried child under 21 → **Go to Contact Info**
- `child_over21` - Unmarried son or daughter over 21 → **Go to Contact Info**
- `married_child` - Married son or daughter → **Go to Contact Info**
- `sibling` - Brother or sister → **Go to Contact Info**
- `fiance` - Fiancé(e) → **Go to Contact Info**

### Q5: Marriage Duration (if `relationship_to_citizen` = spouse)
**Key**: `marriage_duration`
**Question**: "How long have you been married?"

**Options**:
- `over_2_years` - 2 years or more (IR-1 - Immediate Relative) → **Go to Contact Info**
- `under_2_years` - Less than 2 years (CR-1 - Conditional Resident) → **Go to Contact Info**

### Q4b: Relationship to LPR (if `family_petitioner` = green_card)
**Key**: `relationship_to_lpr`
**Question**: "What is your relationship to the Green Card holder?"

**Options**:
- `spouse` - Spouse (F2A) → **Go to Contact Info**
- `child_under21` - Unmarried child under 21 (F2A) → **Go to Contact Info**
- `child_over21` - Unmarried son or daughter over 21 (F2B) → **Go to Contact Info**

**Total Family Paths**: 12 possible variations

---

## Path 4: Student Visa

### Q3: Student Visa Type
**Key**: `student_visa_type`
**Question**: "What type of educational program will you pursue?"

**Options**:
- `F-1` - Academic studies at accredited US institution → **Go to Q4**
- `M-1` - Vocational or technical studies → **Go to Q4**
- `J-1` - Exchange visitor program → **Go to Q4**

### Q4: Acceptance Status
**Key**: `acceptance_status`
**Question**: "Have you been accepted to a US educational institution?"

**Options**:
- `yes` - Yes, I have an acceptance letter → **Go to Contact Info**
- `applying` - I'm currently applying → **Go to Contact Info**
- `no` - Not yet → **Go to Contact Info**

**Total Student Paths**: 9 possible variations (3 visa types × 3 acceptance statuses)

---

## Path 5: Investor Visa

### Q3: Investment Amount
**Key**: `investment_amount`
**Question**: "How much capital are you planning to invest?"

**Options**:
- `eb5_tep` - $800,000+ (EB-5 Targeted Employment Area) → **Go to Q4a**
- `eb5_standard` - $1,050,000+ (EB-5 Standard) → **Go to Q4a**
- `e2` - $100,000-$500,000 (E-2 Treaty Investor) → **Go to Q4b**
- `under_100k` - Under $100,000 → **Go to Contact Info**

### Q4a: EB-5 Project Type (if `investment_amount` = eb5_tep OR eb5_standard)
**Key**: `eb5_project_type`
**Question**: "What type of EB-5 investment are you considering?"

**Options**:
- `regional_center` - Regional Center (indirect job creation) → **Go to Contact Info**
- `direct` - Direct investment (create/manage business) → **Go to Contact Info**

### Q4b: E-2 Treaty Country (if `investment_amount` = e2)
**Key**: `e2_treaty_country`
**Question**: "Are you a national of a country with an E-2 treaty with the United States?"

**Options**:
- `yes` - Yes → **Go to Contact Info**
- `no` - No → **Go to Contact Info**
- `unsure` - Not sure → **Go to Contact Info**

**Total Investor Paths**: 8 possible variations

---

## Path 6: US Citizenship/Naturalization

### Q3: Citizenship Basis
**Key**: `citizenship_basis`
**Question**: "What is the basis for your citizenship application?"

**Options**:
- `naturalization` - Naturalization (I've been a Green Card holder) → **Go to Q4**
- `birth_abroad` - Citizenship through US citizen parent(s) → **Go to Contact Info**
- `military` - Military service → **Go to Contact Info**
- `other` - Other → **Go to Contact Info**

### Q4: Green Card Duration (if `citizenship_basis` = naturalization)
**Key**: `green_card_duration`
**Question**: "How long have you been a permanent resident (Green Card holder)?"

**Options**:
- `5_years` - 5 years or more → **Go to Contact Info**
- `3_years_married` - 3+ years (married to US citizen) → **Go to Contact Info**
- `under_3` - Less than 3 years → **Go to Contact Info**

**Total Citizenship Paths**: 6 possible variations

---

## Contact Information Collection (All Paths End Here)

All category paths converge to this final section where contact information is collected.

### Required for Everyone:

#### C1: Full Name
**Key**: `full_name`
**Question**: "What is your full legal name (as shown on your passport)?"
**Type**: text

#### C2: Email
**Key**: `email`
**Question**: "What is your email address?"
**Type**: email

#### C3: Phone
**Key**: `phone`
**Question**: "What is your phone number with country code? (e.g., +1-555-123-4567)"
**Type**: tel

#### C4: Current Country
**Key**: `current_country`
**Question**: "What country do you currently reside in?"
**Type**: select (populated from Countries database table)

### Conditional Questions Based on Location:

#### If `location` = "inside_us":

**C5a: US Address**
**Key**: `us_address`
**Question**: "What is your current US address?"
**Type**: textarea

**C6a: Residence Status** (Optional)
**Key**: `residence_status`
**Question**: "What is your current residence arrangement in the US?"
**Options**:
- `own_mortgage` - Own with mortgage
- `own_outright` - Own outright
- `rent` - Rent
- `family` - Living with family/friends
- `other` - Other

#### If `location` = "outside_us":

**C5b: Foreign Address**
**Key**: `foreign_address`
**Question**: "What is your current address outside the US?"
**Type**: textarea

---

## Path Summary Statistics

| Category | Min Questions | Max Questions | Typical Questions |
|----------|---------------|---------------|-------------------|
| Nonimmigrant | 7 | 10 | 8-9 |
| Immigrant | 7 | 11 | 8-10 |
| Family | 7 | 11 | 8-10 |
| Student | 8 | 10 | 9 |
| Investor | 7 | 10 | 8-9 |
| Citizenship | 7 | 10 | 8 |

**Total Possible Paths**: 64+ unique question combinations

---

## Example Complete Interview Flows

### Example 1: H-1B Worker Currently in US
1. Location: `inside_us`
2. Category: `nonimmigrant`
3. Nonimmigrant Type: `work`
4. Work Visa Type: `H-1B`
5. H-1B Employer: `yes`
6. Full Name: "John Doe"
7. Email: "john@example.com"
8. Phone: "+1-555-123-4567"
9. Current Country: "United States"
10. US Address: "123 Main St, San Francisco, CA 94102"
11. Residence Status: `rent`

**Total Questions: 11**

### Example 2: EB-2 NIW Applicant Outside US
1. Location: `outside_us`
2. Category: `immigrant`
3. Immigrant Basis: `employment`
4. EB Category: `EB-2`
5. EB-2 NIW: `yes`
6. Full Name: "Jane Smith"
7. Email: "jane@example.com"
8. Phone: "+91-98765-43210"
9. Current Country: "India"
10. Foreign Address: "456 Park Road, Mumbai, Maharashtra 400001, India"

**Total Questions: 10**

### Example 3: F-1 Student Visa
1. Location: `outside_us`
2. Category: `student`
3. Student Visa Type: `F-1`
4. Acceptance Status: `yes`
5. Full Name: "Maria Garcia"
6. Email: "maria@example.com"
7. Phone: "+52-55-1234-5678"
8. Current Country: "Mexico"
9. Foreign Address: "789 Avenida Principal, Mexico City, CDMX 03100, Mexico"

**Total Questions: 9**

### Example 4: Family-Based (Spouse of US Citizen)
1. Location: `outside_us`
2. Category: `family`
3. Family Petitioner: `us_citizen`
4. Relationship to Citizen: `spouse`
5. Marriage Duration: `over_2_years`
6. Full Name: "Chen Wei"
7. Email: "chen@example.com"
8. Phone: "+86-10-8765-4321"
9. Current Country: "China"
10. Foreign Address: "123 Beijing Road, Beijing 100000, China"

**Total Questions: 10**

### Example 5: EB-5 Investor
1. Location: `inside_us`
2. Category: `investor`
3. Investment Amount: `eb5_tep`
4. EB-5 Project Type: `regional_center`
5. Full Name: "Ahmed Al-Rahman"
6. Email: "ahmed@example.com"
7. Phone: "+971-4-567-8901"
8. Current Country: "United Arab Emirates"
9. US Address: "555 Park Avenue, New York, NY 10022"
10. Residence Status: `rent`

**Total Questions: 10**

### Example 6: Naturalization (5+ years LPR)
1. Location: `inside_us`
2. Category: `citizen`
3. Citizenship Basis: `naturalization`
4. Green Card Duration: `5_years`
5. Full Name: "Kim Lee"
6. Email: "kim@example.com"
7. Phone: "+1-213-555-9876"
8. Current Country: "United States"
9. US Address: "888 Wilshire Blvd, Los Angeles, CA 90017"
10. Residence Status: `own_mortgage`

**Total Questions: 10**

---

## Question Keys Reference

All possible question keys used in the system:

### Foundation
- `location`
- `category`

### Nonimmigrant
- `nonimmigrant_type`
- `work_visa_type`
- `h1b_employer`
- `l1_company_relationship`
- `o1_recognition`

### Immigrant
- `immigrant_basis`
- `eb_category`
- `eb1_type`
- `eb2_niw`
- `eb3_category`

### Family
- `family_petitioner`
- `relationship_to_citizen`
- `marriage_duration`
- `relationship_to_lpr`

### Student
- `student_visa_type`
- `acceptance_status`

### Investor
- `investment_amount`
- `eb5_project_type`
- `e2_treaty_country`

### Citizenship
- `citizenship_basis`
- `green_card_duration`

### Contact Information
- `full_name`
- `email`
- `phone`
- `current_country`
- `us_address`
- `residence_status`
- `foreign_address`

**Total Unique Question Keys**: 33

---

## Notes

1. **Dynamic Country List**: The `current_country` question dynamically loads from the Countries database table (filtered for `IsActive = true`)

2. **Conditional Logic**: Several questions only appear based on previous answers:
   - US Address vs Foreign Address depends on initial location answer
   - Visa-specific refinement questions depend on the visa type selected
   - Marriage duration only asked for spouse relationships

3. **Optional Questions**: Currently only `residence_status` is marked as optional (`IsRequired = false`)

4. **Interview Completion**: The interview is considered complete when `GetNextQuestionAsync()` returns `null`, which happens after all contact information is collected

5. **Translation Support**: All question text is currently hardcoded in English. Translation infrastructure exists but is not yet integrated into DecisionTreeQuestionEngine

---

*Document Version: 1.0*
*Last Updated: 2025-01-19*
*Source: DecisionTreeQuestionEngine.cs*

# Decision Tree Design - Immigration Interview System

## Overview
This document outlines the new decision tree interview system that replaces the negative elimination approach with a comprehensive eligibility assessment system that shows ALL eligible and potentially eligible visa types.

## Core Principles
1. **Open Assessment**: Show multiple eligible visas (green) and potential visas (yellow)
2. **USCIS-Based**: Questions and eligibility follow USCIS requirements
3. **Progressive Disclosure**: Start broad, narrow based on answers
4. **No Authentication Required**: Cookie-based progress for unauthenticated users
5. **Forward/Back Navigation**: Step-by-step wizard with ability to go back

## Decision Tree Flow

### Level 1: Initial Classification
**Q1: Current Location**
- Inside United States
- Outside United States

**Q2: Immigration Intent**
- Nonimmigrant (Temporary stay)
- Immigrant (Permanent residence)
- US Citizen (Naturalization/Citizenship)
- Investor/Entrepreneur

---

## NONIMMIGRANT VISAS

### Tourist & Business
**B-1 (Business Visitor)**
- Eligibility: Business meetings, conferences, negotiations
- Duration: Up to 6 months
- Questions: Purpose of visit, duration, ties to home country

**B-2 (Tourist/Medical)**
- Eligibility: Tourism, vacation, medical treatment, visiting family
- Duration: Up to 6 months
- Questions: Purpose, duration, financial support, return ties

**ESTA (Visa Waiver Program)**
- Eligibility: Citizens of VWP countries, tourism/business < 90 days
- Questions: Nationality, purpose, duration, VWP eligibility

### Work Visas
**H-1B (Specialty Occupation)**
- Eligibility:
  - Bachelor's degree or higher (or equivalent)
  - Job requires specialized knowledge
  - US employer sponsorship
  - Prevailing wage met
- Questions: Education level, job offer, employer willing to sponsor, salary

**H-2A (Agricultural Worker)**
- Eligibility: Temporary agricultural work, employer certification
- Questions: Agricultural work experience, seasonal employment, employer sponsor

**H-2B (Non-Agricultural Worker)**
- Eligibility: Temporary non-agricultural work, employer certification
- Questions: Work type, seasonal/temporary need, employer sponsor

**L-1A (Intracompany Transfer - Manager)**
- Eligibility:
  - Working for related company abroad (1+ years)
  - Transferring to US office
  - Executive or managerial role
- Questions: Current employer relationship, role level, years with company

**L-1B (Intracompany Transfer - Specialized Knowledge)**
- Eligibility: Specialized knowledge employee, same company requirements as L-1A
- Questions: Role type, specialized knowledge, years with company

**O-1 (Extraordinary Ability)**
- Eligibility:
  - Extraordinary ability in sciences, arts, education, business, or athletics
  - National/international recognition
  - Sustained acclaim
- Questions: Field of expertise, awards/recognition, media coverage

**P-1 (Athletes/Entertainment Groups)**
- Eligibility: Internationally recognized athletes or entertainment groups
- Questions: Sport/entertainment type, level of recognition, event details

**TN (USMCA/NAFTA Professional)**
- Eligibility:
  - Canadian or Mexican citizen
  - USMCA profession list
  - Job offer from US employer
- Questions: Nationality, profession, qualifications

**E-3 (Australian Specialty Occupation)**
- Eligibility:
  - Australian citizen
  - Specialty occupation (like H-1B)
- Questions: Nationality, education, job offer

### Student Visas
**F-1 (Academic Student)**
- Eligibility:
  - Accepted to SEVP-certified school
  - Full-time academic program
  - Financial support proof
  - Non-immigrant intent
- Questions: School acceptance, program type, financial resources

**M-1 (Vocational Student)**
- Eligibility: Vocational or technical school, similar to F-1
- Questions: Program type, school, financial support

**J-1 (Exchange Visitor)**
- Eligibility: Approved exchange program (various categories)
- Questions: Program type, sponsor organization

### Family-Based Nonimmigrant
**K-1 (Fiancé)**
- Eligibility:
  - Engaged to US citizen
  - Met in person within 2 years
  - Intent to marry within 90 days of entry
- Questions: Relationship to US citizen, meeting history, marriage plans

**K-3 (Spouse of US Citizen)**
- Eligibility: Married to US citizen, I-130 filed
- Questions: Marriage date, I-130 status

### Investment Visas (Nonimmigrant)
**E-1 (Treaty Trader)**
- Eligibility:
  - Treaty country national
  - Substantial trade between US and home country
  - Principal/supervisor role
- Questions: Nationality, business type, trade volume

**E-2 (Treaty Investor)**
- Eligibility:
  - Treaty country national
  - Substantial investment ($100K-$200K+)
  - Active business ownership/operation
- Questions: Nationality, investment amount, business type

---

## IMMIGRANT VISAS

### Family-Based Immediate Relatives (No Wait)
**IR-1 (Spouse of US Citizen)**
- Eligibility:
  - Married to US citizen
  - Marriage > 2 years
- Questions: Petitioner citizenship, marriage date, spouse location

**IR-2 (Unmarried Child < 21 of US Citizen)**
- Eligibility:
  - Under 21 years old
  - Unmarried
  - Parent is US citizen
- Questions: Age, marital status, parent citizenship

**CR-1 (Conditional Spouse of US Citizen)**
- Eligibility:
  - Married to US citizen
  - Marriage < 2 years
- Questions: Marriage date, petitioner citizenship

**CR-2 (Conditional Child of US Citizen)**
- Eligibility:
  - Child of CR-1 holder
  - Under 21, unmarried
- Questions: Parent visa status, age

**IR-5 (Parent of US Citizen)**
- Eligibility:
  - Parent of US citizen
  - US citizen child is 21+
- Questions: Child's age, citizenship status

**IR-3 (Adopted Child - Completed Abroad)**
- Eligibility:
  - Adoption completed in child's country
  - Hague Convention requirements
  - Under 16 (or 18 if sibling)
- Questions: Adoption status, child age, Hague compliance

**IR-4 (Adopted Child - To Be Completed in US)**
- Eligibility:
  - Adoption to be finalized in US
  - Similar age requirements
- Questions: Adoption status, legal custody, child location

### Family-Based Preference Categories (Wait Times)
**F1 (Unmarried Adult Children of US Citizens)**
- Eligibility:
  - 21+ years old
  - Unmarried
  - Parent is US citizen
- Wait Time: 7-8 years
- Questions: Age, marital status, parent citizenship

**F2A (Spouses/Children <21 of Green Card Holders)**
- Eligibility:
  - Spouse or child under 21
  - Of lawful permanent resident
- Wait Time: 2-3 years
- Questions: Petitioner status, relationship, age

**F2B (Unmarried Adult Children of Green Card Holders)**
- Eligibility:
  - 21+ years old
  - Unmarried
  - Parent is LPR
- Wait Time: 7-8 years
- Questions: Age, marital status, parent status

**F3 (Married Children of US Citizens)**
- Eligibility:
  - Any age
  - Married
  - Parent is US citizen
- Wait Time: 10-15 years
- Questions: Marital status, parent citizenship

**F4 (Siblings of US Citizens)**
- Eligibility:
  - Sibling is US citizen
  - US citizen is 21+
- Wait Time: 15-20 years
- Questions: Sibling citizenship, sibling age

### Employment-Based (EB) Categories
**EB-1 (Priority Workers)**
- Three subcategories:
  - EB-1A: Extraordinary ability
  - EB-1B: Outstanding researchers/professors
  - EB-1C: Multinational managers/executives

**Eligibility Checklist (EB-1A)**:
- [ ] National/international acclaim in field
- [ ] Major awards (Nobel, Pulitzer, etc.)
- [ ] Membership in associations requiring outstanding achievements
- [ ] Published material about you in major media
- [ ] Judged work of others in your field
- [ ] Original contributions of major significance
- [ ] Authored scholarly articles
- [ ] High salary relative to others in field
- [ ] Commercial success in performing arts
- [ ] Leading/critical role in distinguished organizations

**Eligibility Checklist (EB-1B)**:
- [ ] International recognition for outstanding achievements
- [ ] 3+ years teaching/research experience
- [ ] Permanent research position or tenure-track
- [ ] At least 2 of: major awards, membership, published material, judging, original contributions, scholarly articles

**Eligibility Checklist (EB-1C)**:
- [ ] Worked for related company abroad for 1+ years in last 3 years
- [ ] Manager or executive role
- [ ] Coming to work for US office in managerial/executive capacity

**EB-2 (Advanced Degree/Exceptional Ability)**
- Eligibility:
  - Master's degree+ OR Bachelor's + 5 years progressive experience
  - OR exceptional ability in sciences/arts/business
  - Job offer (unless National Interest Waiver)
  - Labor certification (unless NIW)

**Eligibility Checklist**:
- [ ] Advanced degree (Master's or higher)
- OR [ ] Bachelor's + 5 years progressive experience
- OR [ ] Exceptional ability: 3+ of below
  - [ ] Official academic record showing degree
  - [ ] 10+ years full-time experience
  - [ ] Professional license/certification
  - [ ] High salary
  - [ ] Professional association membership
  - [ ] Recognition from peers/government
- [ ] Job offer from US employer
- [ ] PERM labor certification (or NIW)

**EB-3 (Skilled Workers/Professionals/Other Workers)**
- Eligibility:
  - Skilled: 2+ years training/experience
  - Professional: Bachelor's degree
  - Other: Less than 2 years experience
  - Job offer + labor certification

**Eligibility Checklist**:
- [ ] At least 2 years experience/training OR Bachelor's degree
- [ ] Job offer from US employer
- [ ] Employer willing to sponsor
- [ ] PERM labor certification
- [ ] Meet job requirements

**EB-4 (Special Immigrants)**
- Various categories:
  - Religious workers
  - Broadcasters
  - Iraqi/Afghan translators
  - International organization employees
- Questions: Category, qualifying experience/role

**EB-5 (Immigrant Investor)**
- Eligibility:
  - $800K investment (TEA) or $1.05M (standard)
  - Create/preserve 10 full-time jobs
  - Active management role

**Eligibility Checklist**:
- [ ] $800K+ available for investment (or $1.05M)
- [ ] Investment in commercial enterprise
- [ ] Create/preserve 10 full-time US jobs
- [ ] Lawful source of funds documented
- [ ] Active involvement in management

---

## CITIZENSHIP/NATURALIZATION

**N-400 (Naturalization)**
**Eligibility Checklist**:
- [ ] 18+ years old
- [ ] Lawful permanent resident (green card)
- [ ] 5 years as LPR (or 3 if married to US citizen)
- [ ] Physical presence: 30 months in last 5 years (or 18 months if married to citizen)
- [ ] Continuous residence in US
- [ ] Good moral character
- [ ] English proficiency (speaking, reading, writing)
- [ ] US civics knowledge
- [ ] Attachment to Constitution
- [ ] Willingness to take Oath of Allegiance

**Additional Questions**:
- Criminal history?
- Tax compliance?
- Selective Service registration (males 18-26)?
- Married to US citizen?
- Spouse works abroad for US government/company?

**N-600 (Certificate of Citizenship)**
- Eligibility:
  - Derived citizenship through parent
  - Born abroad to US citizen parent(s)
  - Acquired citizenship automatically

**Eligibility Checklist**:
- [ ] At least one parent was/is US citizen
- [ ] Parent's citizenship before applicant's 18th birthday
- [ ] Residing in US in legal/physical custody of citizen parent
- [ ] Lawful permanent resident

---

## Data Collection Points

### During Interview (Cookie Storage)
- All answers to decision tree questions
- Progress tracking
- Timestamp of last activity (24-hour expiration)

### After Results (Registration Required)
**Contact Information**:
- Full legal name (First, Middle, Last)
- Email address
- Phone number (with country code selector)
- Date of birth
- Gender
- Marital status
- Country of citizenship/passport issuance

**Address Information**:
- Current location (country)
- If in US:
  - Street address
  - City
  - State
  - ZIP code
  - Address type:
    - [ ] Own (mortgage)
    - [ ] Rent
    - [ ] Family member's address
    - [ ] Friend's address
- If outside US:
  - Foreign address
  - City
  - Country

**Additional Information** (if applicable):
- Spouse information (if married)
- Children information (if applicable)
- Current immigration status (if any)
- Previous visa history

---

## Results Display

### Eligible Visas (Green)
- Meets all eligibility requirements
- Can proceed with application
- Display with green badge/indicator
- Show:
  - Visa code and name
  - Brief eligibility summary
  - Estimated processing time
  - Next steps

### Potentially Eligible (Yellow)
- Meets most requirements but needs additional review
- May require waivers or additional documentation
- Display with yellow badge/indicator
- Show:
  - Visa code and name
  - What requirements are met
  - What needs review/documentation
  - Recommendation for consultation

### Not Eligible
- Don't show these visas
- If NO visas are eligible or potentially eligible:
  - Show message: "Based on your responses, we are unable to assist with a visa application at this time. Please contact us directly for further consultation."
  - Don't show registration form
  - Offer to retake interview or contact attorney

---

## Attorney Lock-In

### After Consultation
- Attorney reviews interview results
- Attorney selects specific visa type from eligible/potential list
- System sets `AttorneySelectedVisaTypeId` and `IsVisaLockedByAttorney = true`

### On Retake Attempt
- Show warning modal:
  ```
  ⚠️ Warning: Locked Visa Selection

  An immigration attorney has already reviewed your case and selected [VISA TYPE] as your visa category.

  If you retake this interview and change your answers, this may result in:
  - A different visa recommendation
  - Additional consultation fees
  - Delays in your case processing

  Are you sure you want to proceed?

  [Cancel] [Yes, Retake Interview]
  ```

---

## Implementation Notes

1. **Question Order**:
   - Start with Q1 (Location) and Q2 (Intent)
   - Branch based on intent
   - Ask most discriminating questions first
   - For employment: show checklist, calculate eligible based on checked items

2. **Eligibility Calculation**:
   - Each visa has a set of rules
   - Rules check answer values and profile data
   - Return eligibility: ELIGIBLE, POTENTIAL, or NOT_ELIGIBLE
   - ELIGIBLE: All required criteria met
   - POTENTIAL: 70%+ criteria met, or missing documentation

3. **Cookie Structure**:
   ```json
   {
     "interviewProgress": {
       "answers": {},
       "currentStep": 0,
       "startedAt": "ISO timestamp",
       "expiresAt": "ISO timestamp"
     }
   }
   ```

4. **Database Schema Updates**:
   - Add `VisaEligibilityResult` table:
     - InterviewSessionId
     - VisaTypeId
     - EligibilityStatus (Eligible/Potential)
     - MatchScore (0-100)
     - Rationale
   - Add to `Case` table:
     - AttorneySelectedVisaTypeId (nullable)
     - IsVisaLockedByAttorney (bool)
     - VisaLockedAt (datetime, nullable)

5. **Localization**:
   - All questions in interview.json
   - All visa names/descriptions in visaLibrary.json
   - All form labels in forms.json
   - Support all 23 languages

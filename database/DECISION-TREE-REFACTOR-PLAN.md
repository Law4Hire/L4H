# Decision Tree Refactor Plan

## Overview
This document outlines the complete refactoring needed to align the Law4Hire interview system with the React decision tree prototype provided.

## Current vs New Flow

### Current Flow (DecisionTreeQuestionEngine.cs)
```
1. Location (inside/outside US)
2. Category (nonimmigrant/immigrant/family/student/investor/citizen)
3. Type-specific questions (2-3 questions per category)
4. Contact information
5. Complete
```

### New Flow (React Prototype)
```
1. Location (inside/outside US)
2. Status (immigrant/nonimmigrant/citizen/investor/asylum/undocumented)
3. Category (depends on status - work_visa/student_visa/green_card_employment/etc.)
4. Subcategory (specific visa type - H-1B/F-1/EB-2 NIW/etc.)
5. Eligibility Checklist (4-8 yes/no questions per visa type)
6. Visa Evaluation/Recommendation Display
7. Contact Information Collection
```

## Key Differences

### 1. Status Question Expansion
**Current** (called "Category"):
- nonimmigrant
- immigrant
- family
- student
- investor
- citizen

**New** (called "Status"):
- immigrant (Green card holder or seeking permanent residency)
- nonimmigrant (Temporary visa holder)
- citizen (U.S. Citizen helping family members)
- investor (Investment-based immigration)
- asylum (Asylum seeker/Refugee)
- undocumented (No current legal status)

### 2. Category Structure
The new system has **status-specific categories**:

#### For "immigrant" status:
- Employment-Based Green Card (→ subcategory)
- Family-Based Green Card (→ result)
- Renew/Replace Green Card (→ result)
- Naturalization/Citizenship (→ result)
- Removal/Deportation Defense (→ result)

#### For "nonimmigrant" status:
- Work Visa (→ subcategory)
- Student Visa (→ subcategory)
- Visitor/Tourist Visa (→ subcategory)
- Extend/Change Visa Status (→ subcategory)
- Adjust to Permanent Status (→ contact)

#### For "citizen" status:
- Family-Based Petition (→ subcategory)
- Fiancé(e) Visa (K-1) (→ contact)
- Consular Processing (→ contact)

#### For "investor" status:
- EB-5 Investor Visa (→ result)
- E-2 Treaty Investor (→ result)
- L-1 Intracompany Transfer (→ result)

#### For "asylum" status:
- Asylum Application (→ result)
- Refugee Status (→ result)
- TPS/Humanitarian Relief (→ result)

#### For "undocumented" status:
- DACA (→ result)
- Explore Legal Options (→ result)
- Deportation Defense (→ result)
- Waivers (→ result)

### 3. Subcategory Expansion
The new system has **50+ specific visa types** with detailed subcategories:

#### Work Visa Subcategories (10 options):
- H-1B Specialty Occupation
- H-2A Agricultural Worker
- H-2B Temporary Worker
- L-1 Intracompany Transfer
- O-1 Extraordinary Ability
- P-1 Athlete/Entertainer
- E-1/E-2 Treaty Trader/Investor
- TN NAFTA Professional
- J-1 Exchange Visitor
- R-1 Religious Worker

#### Employment-Based Green Card Subcategories (11 options):
- EB-1A Extraordinary Ability
- EB-1B Outstanding Researcher/Professor
- EB-1C Multinational Manager/Executive
- EB-2 Advanced Degree
- EB-2 NIW (National Interest Waiver)
- EB-2 Exceptional Ability
- EB-3 Skilled Worker
- EB-3 Professional
- EB-3 Unskilled Worker
- EB-4 Special Immigrant
- EB-5 Immigrant Investor

#### Family-Based Petition Subcategories (10 options):
- IR-1: Spouse of U.S. Citizen (married 2+ years)
- CR-1: Spouse of U.S. Citizen (married < 2 years)
- IR-2: Unmarried Child Under 21
- CR-2: Child of CR-1 Applicant
- IR-5: Parent of U.S. Citizen
- F1: Unmarried Adult Child of U.S. Citizen
- F2A: Spouse/Child of LPR
- F2B: Unmarried Adult Child of LPR
- F3: Married Adult Child of U.S. Citizen
- F4: Sibling of U.S. Citizen

#### Student Visa Subcategories (3 options):
- F-1 Academic Student
- M-1 Vocational Student
- J-1 Exchange Student

#### Visitor Visa Subcategories (3 options):
- B-1 Business Visitor
- B-2 Tourist Visitor
- B-1/B-2 Combined

#### Visa Extension Subcategories (3 options):
- Extension of Stay
- Change of Status
- Reinstatement

### 4. Eligibility Checklists
The new system includes **detailed yes/no eligibility questions** for each visa type:

#### Example: H-1B Checklist (4 questions)
1. Do you have a bachelor's degree or higher in a specialty field?
2. Do you have a job offer from a U.S. employer?
3. Does the position require specialized knowledge in your field?
4. If required for the position, do you have the necessary license?

#### Example: EB-1A Checklist (8 questions)
1. Have you received major internationally recognized awards (like Nobel Prize, Oscar, Olympic Medal)?
2. Are you a member of associations requiring outstanding achievements?
3. Have major publications or media written about you?
4. Have you judged the work of others in your field?
5. Have you made original scholarly, artistic, or business contributions of major significance?
6. Have you authored scholarly articles in professional journals?
7. Have you performed in a leading or critical role for distinguished organizations?
8. Do you command a high salary relative to others in your field?

#### Example: F-1 Student Checklist (6 questions)
1. Have you been accepted by a SEVP-certified school in the U.S.?
2. Have you received Form I-20 from your school?
3. Will you be enrolled as a full-time student?
4. Can you demonstrate sufficient funds to cover tuition and living expenses?
5. Do you have strong ties to your home country (residence, family, job)?
6. Do you intend to return home after completing your studies?

**Total Checklists to Implement**: ~30 different visa types with unique checklists (220+ individual yes/no questions)

### 5. Contact Information Timing
**Current**: Collected during interview after category-specific questions
**New**: Collected AFTER showing visa evaluation/recommendations

### 6. Completion Flow
**Current**:
```
Category questions → Contact info → Complete → Show evaluations
```

**New**:
```
Category questions → Checklist → Run evaluation → Show recommendations → Collect contact info → Complete
```

## Technical Implementation Required

### 1. Update DecisionTreeQuestionEngine.cs
- Rewrite GetCategoryQuestion() to be GetStatusQuestion()
- Add new GetCategoryQuestion() that returns different options based on status
- Add GetSubcategoryQuestion() method
- Add GetChecklistQuestions() method with all 30+ checklists
- Move contact info collection to after evaluation
- Update flow logic in GetNextQuestionAsync()

### 2. Update InterviewOrchestrator.cs
- Add logic to run evaluation BEFORE asking for contact info
- Add method to display evaluation results mid-interview
- Update completion detection

### 3. Update DTOs
- Add ChecklistQuestionDTO
- Add EvaluationSummaryDTO
- Update response objects to include evaluation before contact

### 4. Database Changes (if needed)
- Possibly add ChecklistAnswers table to store yes/no responses separately

### 5. Frontend Updates
- Create UI components matching React design
- Button styles with hover effects (border-2 border-gray-300 hover:border-blue-600)
- Grid layouts (grid-cols-1 md:grid-cols-2)
- Back button navigation
- Checklist yes/no radio button interface
- Results display with green success box

## Effort Estimation

### Backend Work
- DecisionTreeQuestionEngine rewrite: **8-12 hours**
  - Rewrite all question generation methods
  - Add 30+ checklist definitions (220+ questions)
  - Update flow logic
- InterviewOrchestrator updates: **2-3 hours**
- DTO updates: **1-2 hours**
- Testing: **4-6 hours**

**Backend Total**: ~15-23 hours

### Frontend Work (if required)
- UI components matching React design: **8-12 hours**
- Integration with new API structure: **4-6 hours**
- Testing: **4-6 hours**

**Frontend Total**: ~16-24 hours

**Grand Total**: ~31-47 hours of development work

## Risks & Considerations

### 1. Scope Creep
The React prototype is a complete redesign. This is not a minor update but a full rewrite.

### 2. Existing Data
If there are existing interview sessions in the database, they may not be compatible with the new structure.

### 3. Evaluation Engine Integration
The new flow requires running evaluation BEFORE contact info collection. The current VisaEvaluationEngine may need updates to work with checklist answers.

### 4. Testing Complexity
With 50+ visa types and 220+ checklist questions, thorough testing will be time-consuming.

### 5. Translation/Localization
All 220+ new questions need to be added to translation files for multi-language support.

## Recommended Approach

### Phase 1: Core Backend Refactor (Week 1)
1. Rewrite DecisionTreeQuestionEngine with new flow
2. Add all checklist definitions
3. Update DTOs and interfaces
4. Basic API testing

### Phase 2: Evaluation Integration (Week 1-2)
1. Update InterviewOrchestrator to run evaluation mid-interview
2. Add evaluation display before contact collection
3. Test complete flow end-to-end

### Phase 3: Frontend Updates (Week 2)
1. Create UI components matching React design
2. Integrate with new API structure
3. Add back button navigation
4. Style updates

### Phase 4: Testing & Refinement (Week 2-3)
1. Comprehensive testing of all paths
2. Edge case handling
3. Performance optimization
4. Translation updates

## Decision Required

**Question for stakeholder**: Given the scope outlined above (~31-47 hours of development), do you want to:

A. **Proceed with full refactor** - Implement everything as specified in the React prototype
B. **Phased approach** - Start with a subset of visa types and expand gradually
C. **Hybrid approach** - Keep current backend but update frontend UI to match React design
D. **Defer** - Keep current system and revisit this refactor later

Please confirm which approach you'd like to take before I begin implementation.

## Files to be Modified

### Backend
- `src/infrastructure/Services/Interview/DecisionTreeQuestionEngine.cs` (complete rewrite)
- `src/infrastructure/Services/Interview/InterviewOrchestrator.cs` (moderate changes)
- `src/infrastructure/Services/Interview/IInterviewOrchestrator.cs` (interface updates)
- `src/api/DTOs/Interview/InterviewDTOs.cs` (new DTOs)
- `src/api/DTOs/Interview/InterviewMappingExtensions.cs` (new mappings)
- `src/api/Controllers/InterviewController.cs` (possible endpoint additions)

### Documentation
- `database/INTERVIEW-PATHS.md` (complete rewrite)
- `database/INTERVIEW-CHECKLIST-QUESTIONS.md` (new file with all 220+ questions)

### Frontend (if applicable)
- Interview UI components
- Button/card styling
- Layout updates
- Navigation flow

---

**Status**: Awaiting stakeholder decision on approach
**Created**: 2025-01-20
**Author**: Claude Code Assistant

# Requirements Document

## Introduction

The L4H (Law4Hire) platform currently has critical issues with its interview system and localization implementation that prevent users from successfully completing visa eligibility interviews in multiple languages. The system suffers from broken interview logic, incomplete localization coverage, hardcoded English strings, and inconsistent API integration patterns. This feature addresses these core problems to create a robust, multilingual interview experience.

## Requirements

### Requirement 1: Fix Interview System Architecture

**User Story:** As a user seeking visa guidance, I want to complete an adaptive interview that correctly determines my visa eligibility, so that I receive accurate recommendations for my immigration needs.

#### Acceptance Criteria

1. WHEN a user starts an interview session THEN the system SHALL use only the API-driven adaptive interview service (`/api/v1/interview/next-question`) as the single source of truth
2. WHEN the interview logic processes user answers THEN the system SHALL correctly filter remaining visa types based on user profile data (age, country, citizenship, marital status) and previous answers
3. WHEN a user completes the interview THEN the system SHALL provide accurate visa recommendations without infinite loops or incorrect filtering
4. WHEN the interview encounters edge cases (immigration visas, specialty visas) THEN the system SHALL handle them gracefully with proper completion logic
5. IF the legacy `DecisionEngine.js` or `routing_questions.csv` files exist THEN they SHALL be completely removed from the codebase

### Requirement 2: Implement Complete Localization System

**User Story:** As a non-English speaking user, I want to complete the entire interview process in my native language, so that I can understand all questions and provide accurate responses.

#### Acceptance Criteria

1. WHEN a user selects a language THEN the system SHALL display all interview content (questions, options, buttons, messages) in that language
2. WHEN the system loads interview translations THEN it SHALL support all 21 documented languages (ar-SA, bn-BD, zh-CN, de-DE, es-ES, fr-FR, hi-IN, id-ID, it-IT, ja-JP, ko-KR, mr-IN, pl-PL, pt-BR, ru-RU, ta-IN, te-IN, tr-TR, ur-PK, vi-VN, en-US)
3. WHEN displaying RTL languages (Arabic, Urdu) THEN the system SHALL automatically apply right-to-left layout and text direction
4. WHEN translation keys are missing THEN the system SHALL provide meaningful fallbacks that allow the interview to continue functioning
5. WHEN a user changes language mid-interview THEN the system SHALL preserve their progress and display subsequent content in the new language

### Requirement 3: Eliminate Hardcoded Strings

**User Story:** As a developer maintaining the system, I want all user-facing text to be properly internationalized, so that new languages can be added without code changes.

#### Acceptance Criteria

1. WHEN reviewing the interview UI components THEN there SHALL be no hardcoded English strings in JSX templates
2. WHEN the system displays loading messages, error messages, or button text THEN all text SHALL use the translation system with appropriate keys
3. WHEN new UI text is added THEN it SHALL be implemented using translation keys from the start
4. WHEN translation keys are used THEN they SHALL follow a consistent naming convention (e.g., `interview.loading`, `interview.next`)

### Requirement 4: Fix API Integration Patterns

**User Story:** As a user interacting with the interview system, I want consistent and reliable API communication, so that my interview session progresses smoothly without technical errors.

#### Acceptance Criteria

1. WHEN the frontend makes API calls THEN it SHALL use the correct base URL (`http://localhost:8765`) and endpoint patterns (`/api/v1/interview/*`)
2. WHEN authentication is required THEN the system SHALL properly include Bearer tokens in request headers
3. WHEN API errors occur THEN the system SHALL handle them gracefully with user-friendly error messages
4. WHEN the interview session state changes THEN the system SHALL maintain consistency between frontend state and backend session data
5. WHEN network requests fail THEN the system SHALL provide retry mechanisms and clear error feedback

### Requirement 5: Improve Interview User Experience

**User Story:** As a user completing an interview, I want clear progress indicators and intuitive navigation, so that I understand where I am in the process and can complete it efficiently.

#### Acceptance Criteria

1. WHEN a user is in an interview session THEN the system SHALL display current question number and remaining visa types count
2. WHEN a user answers a question THEN the system SHALL provide immediate feedback and smooth transitions to the next question
3. WHEN a user wants to restart the interview THEN the system SHALL provide a clear reset option that clears previous answers
4. WHEN the interview is complete THEN the system SHALL display the recommendation clearly with rationale and next steps
5. WHEN a user navigates away and returns THEN the system SHALL preserve their interview progress appropriately

### Requirement 6: Ensure Robust Error Handling

**User Story:** As a user encountering technical issues, I want clear error messages and recovery options, so that I can complete my interview despite temporary problems.

#### Acceptance Criteria

1. WHEN translation loading fails THEN the system SHALL fall back to English while continuing to function
2. WHEN API requests timeout or fail THEN the system SHALL display helpful error messages with suggested actions
3. WHEN the interview session becomes invalid THEN the system SHALL guide the user to restart with clear instructions
4. WHEN browser storage is unavailable THEN the system SHALL handle authentication and state management gracefully
5. WHEN unexpected errors occur THEN the system SHALL log detailed information for debugging while showing user-friendly messages

### Requirement 7: Validate Multilingual Content Quality

**User Story:** As a user speaking any of the supported languages, I want accurate and culturally appropriate translations, so that I can trust the interview process and recommendations.

#### Acceptance Criteria

1. WHEN translations are displayed THEN they SHALL be grammatically correct and culturally appropriate for each language
2. WHEN technical terms (visa types, legal concepts) are translated THEN they SHALL maintain accuracy and official terminology
3. WHEN placeholder text or interpolated values are used THEN they SHALL work correctly with each language's grammar and formatting rules
4. WHEN RTL languages are displayed THEN number formatting, date formatting, and text alignment SHALL be appropriate for the language
5. WHEN users switch between languages THEN the translation quality SHALL be consistent across all supported languages
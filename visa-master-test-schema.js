const VISA_MASTER_TEST_SCHEMA = {
  'A-1': {
    country: 'FR', // France
    maritalStatus: 'Married',
    dob: '1970-01-01',
    answers: {
      purpose: 'diplomatic',
      diplomat: 'yes',
      governmentOfficial: 'yes',
      internationalOrg: 'no',
    },
  },
  'A-2': {
    country: 'DE', // Germany
    maritalStatus: 'Single',
    dob: '1980-01-01',
    answers: {
      purpose: 'diplomatic',
      diplomat: 'no',
      governmentOfficial: 'yes',
      internationalOrg: 'no',
    },
  },
  'A-3': {
    country: 'GB', // United Kingdom
    maritalStatus: 'Single',
    dob: '1990-01-01',
    answers: {
      purpose: 'diplomatic',
      diplomat: 'no',
      governmentOfficial: 'no',
      internationalOrg: 'no',
      workingForDiplomat: 'yes',
    },
  },
  'G-1': {
    country: 'JP', // Japan
    maritalStatus: 'Married',
    dob: '1975-01-01',
    answers: {
      purpose: 'employment',
      internationalOrg: 'yes',
      workingForInternationalOrg: 'yes',
    },
  },
  'G-2': {
    country: 'KR', // South Korea
    maritalStatus: 'Single',
    dob: '1985-01-01',
    answers: {
      purpose: 'official',
      internationalOrg: 'yes',
      workingForInternationalOrg: 'yes',
      diplomat: 'no',
      governmentOfficial: 'no',
    },
  },
  'G-3': {
    country: 'IT', // Italy
    maritalStatus: 'Married',
    dob: '1982-01-01',
    answers: {
      purpose: 'diplomatic',
      internationalOrg: 'yes',
      workingForInternationalOrg: 'yes',
      workingForDiplomat: 'no',
    },
  },
  'G-4': {
    country: 'CA', // Canada
    maritalStatus: 'Single',
    dob: '1992-01-01',
    answers: {
      purpose: 'diplomatic',
      internationalOrg: 'yes',
    },
  },
  'G-5': {
    country: 'AU', // Australia
    maritalStatus: 'Married',
    dob: '1995-01-01',
    answers: {
      purpose: 'diplomatic',
      internationalOrg: 'yes',
      workingForG4: 'yes',
    },
  },
  'B-1': {
    country: 'IN', // India
    maritalStatus: 'Married',
    dob: '1988-01-01',
    answers: {
      purpose: 'business',
      treatyCountry: 'no',
    },
  },
  'B-2': {
    country: 'BR', // Brazil
    maritalStatus: 'Single',
    dob: '1998-01-01',
    answers: {
      purpose: 'tourism',
    },
  },
  'C-1': {
    country: 'ZA', // South Africa
    maritalStatus: 'Single',
    dob: '1991-01-01',
    answers: {
      purpose: 'transit',
      governmentOfficial: 'no',
      internationalOrg: 'no',
      isUNRelated: 'no',
      crewMember: 'no',
    },
  },
  'C-1/D': {
    country: 'PH', // Philippines
    maritalStatus: 'Married',
    dob: '1989-01-01',
    answers: {
      purpose: 'transit',
      crewMember: 'yes',
    },
  },
  'C-2': {
    country: 'CH', // Switzerland
    maritalStatus: 'Single',
    dob: '1983-01-01',
    answers: {
      purpose: 'transit',
      isUNRelated: 'yes',
    },
  },
  'C-3': {
    country: 'MX', // Mexico
    maritalStatus: 'Married',
    dob: '1978-01-01',
    answers: {
      purpose: 'transit',
      governmentOfficial: 'yes',
    },
  },
  'D': {
    country: 'NO', // Norway
    maritalStatus: 'Single',
    dob: '1993-01-01',
    answers: {
      purpose: 'employment',
      crewMember: 'yes',
      shipOrAircraft: 'yes',
    },
  },
  'E-1': {
    country: 'GB', // United Kingdom
    maritalStatus: 'Married',
    dob: '1979-01-01',
    answers: {
      purpose: 'business',
      treatyCountry: 'yes',
      tradeActivity: 'yes',
      investment: 'no',
    },
  },
  'E-2': {
    country: 'JP', // Japan
    maritalStatus: 'Married',
    dob: '1977-01-01',
    answers: {
      purpose: 'business',
      treatyCountry: 'yes',
      tradeActivity: 'no',
      investment: 'yes',
    },
  },
  'E-3': {
    country: 'AU', // Australia
    maritalStatus: 'Single',
    dob: '1990-01-01',
    answers: {
      purpose: 'employment',
      employerSponsor: 'yes',
      australian: 'yes',
      specialtyOccupation: 'yes',
    },
  },
  'F-1': {
    country: 'CN', // China
    maritalStatus: 'Single',
    dob: '2002-01-01',
    answers: {
      purpose: 'study',
      isStudent: 'yes',
      studyLevel: 'academic',
    },
  },
  'M-1': {
    country: 'DE', // Germany
    maritalStatus: 'Single',
    dob: '2001-01-01',
    answers: {
      purpose: 'study',
      isStudent: 'yes',
      studyLevel: 'vocational',
    },
  },
  'J-1': {
    country: 'BR', // Brazil
    maritalStatus: 'Single',
    dob: '1999-01-01',
    answers: {
      purpose: 'exchange',
    },
  },
  'H-1B': {
    country: 'IN', // India
    maritalStatus: 'Married',
    dob: '1995-01-01',
    answers: {
      purpose: 'employment',
      employerSponsor: 'yes',
      educationLevel: 'bachelor',
    },
  },
  'H-2A': {
    country: 'MX', // Mexico
    maritalStatus: 'Single',
    dob: '1997-01-01',
    answers: {
      purpose: 'employment',
      workType: 'agricultural',
    },
  },
  'H-2B': {
    country: 'GT', // Guatemala
    maritalStatus: 'Single',
    dob: '1998-01-01',
    answers: {
      purpose: 'employment',
      workType: 'seasonal',
    },
  },
  'L-1': {
    country: 'DE', // Germany
    maritalStatus: 'Married',
    dob: '1985-01-01',
    answers: {
      purpose: 'employment',
      employerSponsor: 'yes',
      sameCompany: 'yes',
    },
  },
  'O-1': {
    country: 'FR', // France
    maritalStatus: 'Single',
    dob: '1988-01-01',
    answers: {
      purpose: 'employment',
      employerSponsor: 'yes',
      extraordinaryAbility: 'yes',
    },
  },
  'EB-1': {
    country: 'CA', // Canada
    maritalStatus: 'Married',
    dob: '1976-01-01',
    answers: {
      purpose: 'immigration',
      priorityWorker: 'yes',
      extraordinaryAbility: 'yes',
    },
  },
  'EB-2': {
    country: 'IN', // India
    maritalStatus: 'Married',
    dob: '1982-01-01',
    answers: {
      purpose: 'immigration',
      advancedDegree: 'yes',
      professionalWorker: 'yes',
    },
  },
  'EB-3': {
    country: 'CN', // China
    maritalStatus: 'Married',
    dob: '1987-01-01',
    answers: {
      purpose: 'immigration',
      skilledWorker: 'yes',
      laborCertification: 'yes',
    },
  },
  'EB-4': {
    country: 'IQ', // Iraq
    maritalStatus: 'Single',
    dob: '1990-01-01',
    answers: {
      purpose: 'immigration',
      specialImmigrant: 'yes',
      religiousWorker: 'yes',
    },
  },
  'EB-5': {
    country: 'VN', // Vietnam
    maritalStatus: 'Married',
    dob: '1975-01-01',
    answers: {
      purpose: 'investment',
      isInvestor: 'yes',
      investmentAmount: '1000000+',
    },
  },
  'K-1': {
    country: 'PH', // Philippines
    maritalStatus: 'Single',
    dob: '1996-01-01',
    answers: {
      purpose: 'family',
      familyRelationship: 'fiance',
      usFamilyStatus: 'citizen',
    },
  },
  'CR-1': {
    country: 'GB', // United Kingdom
    maritalStatus: 'Married',
    dob: '1992-01-01',
    answers: {
      purpose: 'family',
      familyRelationship: 'spouse',
      usFamilyStatus: 'citizen',
    },
  },
  'IR-1': {
    country: 'DE', // Germany
    maritalStatus: 'Married',
    dob: '1980-01-01',
    answers: {
      purpose: 'family',
      familyRelationship: 'spouse',
      usFamilyStatus: 'citizen',
    },
  },
  'F-2A': {
    country: 'MX', // Mexico
    maritalStatus: 'Married',
    dob: '1994-01-01',
    answers: {
      purpose: 'family',
      familyRelationship: 'spouse',
      usFamilyStatus: 'permanent_resident',
    },
  },
  'Diversity': {
    country: 'NP', // Nepal
    maritalStatus: 'Single',
    dob: '1994-01-01',
    answers: {
      purpose: 'immigration',
      diversityLottery: 'yes',
    },
  },
};

module.exports = { VISA_MASTER_TEST_SCHEMA };

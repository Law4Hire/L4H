import React, { useState } from 'react';
import { Button, Card, useToast } from '@l4h/shared-ui';

interface Option {
  label: string;
  value: string;
  nextStep?: string;
  result?: 'ELIGIBLE' | 'TERMINATED';
  message?: string;
}

interface Step {
  id: string;
  question: string;
  options: Option[];
}

interface KnockoutTree {
  [formNumber: string]: Record<string, Step>;
}

const DOCUMENT_TREES: KnockoutTree = {
  'I-485': {
    start: {
      id: 'start',
      question: 'Are you currently physically present inside the United States?',
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'inspection' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'I-485 is only for applicants inside the U.S. You must use Consular Processing (DS-260) from abroad.' },
      ],
    },
    inspection: {
      id: 'inspection',
      question: 'Did you enter the U.S. with legal inspection (valid visa, parole, or border crossing card)?',
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'petition' },
        { label: 'No', value: 'no', nextStep: '245i_check' },
      ],
    },
    '245i_check': {
      id: '245i_check',
      question: 'Do you qualify for protection under Section 245(i) (Petition filed before April 30, 2001)?',
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'petition' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'Ineligible for Adjustment of Status due to unlawful entry without 245(i) protection.' },
      ],
    },
    petition: {
      id: 'petition',
      question: 'Do you have an approved or concurrently filed underlying petition (e.g., I-130, I-140)?',
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'visa_available' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'An "anchor" petition is required for adjustment of status.' },
      ],
    },
    visa_available: {
      id: 'visa_available',
      question: 'Is a visa number currently available to you (Current in Visa Bulletin or Immediate Relative)?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'You must wait until your priority date is current before filing I-485.' },
      ],
    },
  },
  'I-90': {
    start: {
      id: 'start',
      question: 'Are you a Lawful Permanent Resident?',
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'card_type' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'Form I-90 is only for Green Card holders.' },
      ],
    },
    card_type: {
      id: 'card_type',
      question: 'Is your Green Card valid for 10 years (rather than a 2-year conditional card)?',
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'expiry_check' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'Conditional residents must file Form I-751 or I-829 to remove conditions.' },
      ],
    },
    expiry_check: {
      id: 'expiry_check',
      question: 'Is your card expired, expiring within 6 months, or lost/stolen?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'USCIS does not allow renewal more than 6 months in advance unless the card is lost, stolen, or mutilated.' },
      ],
    },
  },
  'I-751': {
    start: {
      id: 'start',
      question: 'Do you currently have a conditional Green Card valid for 2 years?',
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'expiry_90' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'Use Form I-90 for 10-year card renewals.' },
      ],
    },
    expiry_90: {
      id: 'expiry_90',
      question: 'Is your card expiring within the next 90 days?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'You must wait until the 90-day window before filing, unless requesting a waiver.' },
      ],
    },
  },
  'I-829': {
    start: {
      id: 'start',
      question: 'Did you obtain your conditional Green Card through an EB-5 investment?',
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'investment_at_risk' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'Use I-751 for marriage-based conditional cards.' },
      ],
    },
    investment_at_risk: {
      id: 'investment_at_risk',
      question: 'Have you maintained your investment "at risk" throughout the 2-year period?',
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'job_creation' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'Disqualified from removing conditions if investment was not maintained.' },
      ],
    },
    job_creation: {
      id: 'job_creation',
      question: 'Has your investment created at least 10 full-time jobs for U.S. workers?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'Job creation requirement not met.' },
      ],
    },
  },
  'I-693': {
    start: {
      id: 'start',
      question: 'Are you currently applying for or have a pending Adjustment of Status (I-485)?',
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'civil_surgeon' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'Medical exams are only for final status adjustment.' },
      ],
    },
    civil_surgeon: {
      id: 'civil_surgeon',
      question: 'Will the exam be performed by a USCIS-designated Civil Surgeon?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'Results from non-designated doctors are invalid.' },
      ],
    },
  },
  'N-400': {
    start: {
      id: 'start',
      question: 'Are you at least 18 years old?',
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'lpr_status' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'Applicants under 18 must usually file Form N-600 or N-600K to claim citizenship.' },
      ],
    },
    lpr_status: {
      id: 'lpr_status',
      question: 'Have you been a Lawful Permanent Resident (Green Card holder) for at least 5 years (or 3 if married to a U.S. citizen)?',
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'presence' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'You have not yet met the minimum continuous residence requirement for naturalization.' },
      ],
    },
    presence: {
      id: 'presence',
      question: 'Have you been physically present in the U.S. for at least 30 months out of the last 5 years?',
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'character' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'You have not met the physical presence requirement for naturalization.' },
      ],
    },
    character: {
      id: 'character',
      question: 'Can you demonstrate Good Moral Character (no serious criminal record)?',
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'english' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'Certain criminal histories can permanently bar or delay naturalization. Consult an attorney.' },
      ],
    },
    english: {
      id: 'english',
      question: 'Can you read, write, and speak basic English?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', nextStep: 'waiver_check' },
      ],
    },
    waiver_check: {
      id: 'waiver_check',
      question: 'Do you have a medical disability that prevents you from learning English or Civics (Form N-648)?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'English proficiency is a mandatory requirement for naturalization unless a medical exception applies.' },
      ],
    },
  },
  'N-600': {
    start: {
      id: 'start',
      question: "Are you claiming U.S. citizenship because you were born to U.S. citizen parents or acquired it through a parent's naturalization?",
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'inside_us' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'Form N-600 is only for persons who are already U.S. citizens by law but need a certificate.' },
      ],
    },
    inside_us: {
      id: 'inside_us',
      question: 'Are you currently physically present in the United States?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'Applicants residing abroad must usually use Form N-600K instead.' },
      ],
    },
  },
  'N-600K': {
    start: {
      id: 'start',
      question: 'Are you a child under 18 years old residing outside the United States?',
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'parent_citizen' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'Form N-600K is for children under 18 residing abroad with a U.S. citizen parent.' },
      ],
    },
    parent_citizen: {
      id: 'parent_citizen',
      question: 'Is at least one of your parents a U.S. citizen (by birth or naturalization)?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
  },
  'N-336': {
    start: {
      id: 'start',
      question: 'Have you received a formal denial notice for your Form N-400 (Application for Naturalization)?',
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'deadline' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'Form N-336 is specifically for appealing a denied naturalization application.' },
      ],
    },
    deadline: {
      id: 'deadline',
      question: 'Did you receive the denial notice within the last 30 days (33 if mailed)?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'The deadline for filing a hearing request has passed. You may need to file a new N-400 instead.' },
      ],
    },
  },
  'N-565': {
    start: {
      id: 'start',
      question: 'Do you have a Certificate of Naturalization, Citizenship, or Repatriation that was lost, stolen, or mutilated?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', nextStep: 'error_check' },
      ],
    },
    error_check: {
      id: 'error_check',
      question: 'Does your existing certificate contain a clerical error made by USCIS?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
  },
  'N-470': {
    start: {
      id: 'start',
      question: 'Are you a Lawful Permanent Resident who must reside outside the U.S. for at least 1 year for qualifying employment?',
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'employment_type' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
    employment_type: {
      id: 'employment_type',
      question: 'Is your employer the U.S. Government, a U.S. research institution, or a U.S. firm engaged in foreign trade?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'N-470 preservation only applies to specific qualifying international employment.' },
      ],
    },
  },
  'N-300': {
    start: {
      id: 'start',
      question: 'Are you a Lawful Permanent Resident over 18 years old?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
  },
  'N-426': {
    start: {
      id: 'start',
      question: 'Are you currently serving, or have you honorably served, in the U.S. Armed Forces?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
  },
  'N-648': {
    start: {
      id: 'start',
      question: 'Are you currently filing or have a pending Form N-400?',
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'certified_disability' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'N-648 is a supplemental form for N-400 applicants only.' },
      ],
    },
    certified_disability: {
      id: 'certified_disability',
      question: 'Will this form be completed and certified by a licensed medical professional?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'Only a medical doctor, osteopathic doctor, or clinical psychologist can certify this form.' },
      ],
    },
  },
  'DS-160': {
    start: {
      id: 'start',
      question: 'Are you currently located outside the United States?',
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'purpose' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'If you are already inside the U.S., you should typically use Form I-539 to change or extend your status.' },
      ],
    },
    purpose: {
      id: 'purpose',
      question: 'Is the primary purpose of your visit tourism, business, study, or temporary work?',
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'prerequisite' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'Form DS-160 is required for most temporary visits. Please clarify your purpose.' },
      ],
    },
    prerequisite: {
      id: 'prerequisite',
      question: 'Have you obtained the necessary prerequisite (e.g., I-20 for students, Job Offer for workers, or travel funds for tourists)?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'You must have your qualifying basis (like a school acceptance or job offer) before completing the DS-160.' },
      ],
    },
  },
  'DS-156': {
    start: {
      id: 'start',
      question: 'Are you applying for a nonimmigrant visa at a U.S. embassy or consulate abroad?',
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'legacy_check' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'DS-156 is for nonimmigrant visa applications outside the U.S.' },
      ],
    },
    legacy_check: {
      id: 'legacy_check',
      question: 'Have you checked if the specific embassy requires the paper DS-156 instead of the electronic DS-160?',
      options: [
        { label: 'Yes, paper is required', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No, I should use DS-160', value: 'no', result: 'TERMINATED', message: 'Most consulates now require the electronic DS-160. Please verify the embassy requirements.' },
      ],
    },
  },
  'DS-156E': {
    start: {
      id: 'start',
      question: 'Are you applying for a Treaty Trader (E-1) or Treaty Investor (E-2) visa?',
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'treaty_national' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'DS-156E is a supplemental form specifically for E-1/E-2 applicants.' },
      ],
    },
    treaty_national: {
      id: 'treaty_national',
      question: 'Are you a national of a country that has a qualifying treaty of commerce and navigation with the U.S.?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'E visas are restricted to nationals of treaty countries.' },
      ],
    },
  },
  'DS-260': {
    start: {
      id: 'start',
      question: 'Are you applying for an Immigrant Visa (Green Card) through a U.S. embassy or consulate abroad?',
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'nvc_invoice' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'Form DS-260 is for immigrant visa applications processed via Consular Processing.' },
      ],
    },
    nvc_invoice: {
      id: 'nvc_invoice',
      question: 'Have you received your NVC (National Visa Center) case number and invoice ID?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'You cannot file the DS-260 until the NVC has officially opened your case and issued an invoice.' },
      ],
    },
  },
  'DS-230': {
    start: {
      id: 'start',
      question: 'Is your immigrant visa application being processed by a consulate that still uses paper forms?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No, I should use DS-260', value: 'no', result: 'TERMINATED', message: 'Most consulates have switched to the electronic DS-260. Verify your specific embassy requirements.' },
      ],
    },
  },
  'DS-261': {
    start: {
      id: 'start',
      question: 'Are you in the initial stages of Consular Processing for an immigrant visa?',
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'nvc_case' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
    nvc_case: {
      id: 'nvc_case',
      question: 'Have you received your NVC case number?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'The DS-261 is used to designate your agent once the NVC begins processing your case.' },
      ],
    },
  },
  'I-130': {
    start: {
      id: 'start',
      question: 'Are you a U.S. Citizen or Lawful Permanent Resident (Petitioner)?',
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'beneficiary_type' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'Only U.S. citizens and LPRs can petition for family members.' },
      ],
    },
    beneficiary_type: {
      id: 'beneficiary_type',
      question: 'Who are you petitioning for?',
      options: [
        { label: 'Spouse', value: 'spouse', nextStep: 'marriage_check' },
        { label: 'Child', value: 'child', result: 'ELIGIBLE' },
        { label: 'Parent', value: 'parent', nextStep: 'citizen_check' },
        { label: 'Sibling', value: 'sibling', nextStep: 'citizen_check' },
      ],
    },
    marriage_check: {
      id: 'marriage_check',
      question: 'Are you currently legally married to the beneficiary?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'A legal marriage must exist at the time of filing the I-130 for a spouse.' },
      ],
    },
    citizen_check: {
      id: 'citizen_check',
      question: 'Are you a U.S. citizen at least 21 years old?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'Only U.S. citizens 21 or older can petition for parents or siblings. LPRs cannot sponsor these relatives.' },
      ],
    },
  },
  'I-129F': {
    start: {
      id: 'start',
      question: 'Are you a U.S. Citizen?',
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'marriage_intent' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'Only U.S. citizens can petition for a fiancé(e).' },
      ],
    },
    marriage_intent: {
      id: 'marriage_intent',
      question: 'Do you and your fiancé(e) intend to marry within 90 days of their entry into the U.S.?',
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'met_in_person' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'Fiancé(e) visas require a bona fide intent to marry within 90 days of arrival.' },
      ],
    },
    met_in_person: {
      id: 'met_in_person',
      question: 'Have you met in person within the last 2 years?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'Usually, you must have met your fiancé(e) in person within the 2 years before filing.' },
      ],
    },
  },
  'I-600A': {
    start: {
      id: 'start',
      question: 'Are you a U.S. citizen intending to adopt a child from a non-Convention country?',
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'home_study' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
    home_study: {
      id: 'home_study',
      question: 'Have you completed a home study by an authorized agency?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'A valid home study is a prerequisite for advance processing of an orphan petition.' },
      ],
    },
  },
  'I-600': {
    start: {
      id: 'start',
      question: 'Has the child already been identified and determined to be an orphan as defined by U.S. law?',
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'citizen_petitioner' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
    citizen_petitioner: {
      id: 'citizen_petitioner',
      question: 'Are you a U.S. citizen?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
  },
  'I-730': {
    start: {
      id: 'start',
      question: 'Were you admitted to the U.S. as a principal refugee or granted asylum within the last 2 years?',
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'relative_type' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'I-730 must generally be filed within 2 years of being granted refugee/asylee status.' },
      ],
    },
    relative_type: {
      id: 'relative_type',
      question: 'Is the relative you are petitioning for your spouse or unmarried child (under 21)?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'I-730 petitions are limited to spouses and unmarried children under 21.' },
      ],
    },
  },
  'I-800A': {
    start: {
      id: 'start',
      question: 'Are you a U.S. citizen intending to adopt a child from a Hague Convention country?',
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'habitual_residence' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
    habitual_residence: {
      id: 'habitual_residence',
      question: 'Are you habitually resident in the United States?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
  },
  'I-800': {
    start: {
      id: 'start',
      question: 'Has your Form I-800A (Application for Determination of Suitability) been approved by USCIS?',
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'convention_child' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'You must have an approved I-800A before filing the I-800 petition.' },
      ],
    },
    convention_child: {
      id: 'convention_child',
      question: 'Is the child a national of a Hague Convention country?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
  },
  'I-864': {
    start: {
      id: 'start',
      question: 'Are you a U.S. Citizen or Lawful Permanent Resident sponsoring an immigrant?',
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'income_level' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'Affidavits of Support must be signed by a U.S. Citizen or LPR.' },
      ],
    },
    income_level: {
      id: 'income_level',
      question: 'Does your household income exceed 125% of the Federal Poverty Guidelines for your household size?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No, I need a joint sponsor', value: 'no', result: 'ELIGIBLE' },
      ],
    },
  },
  'I-864EZ': {
    start: {
      id: 'start',
      question: 'Are you the only sponsor using only your own salary or pension to meet the income requirement?',
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'single_beneficiary' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'Use the standard Form I-864 if you have joint sponsors or other income sources.' },
      ],
    },
    single_beneficiary: {
      id: 'single_beneficiary',
      question: 'Are you petitioning for only one relative on the underlying I-130?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'Use the standard Form I-864 if petitioning for multiple relatives.' },
      ],
    },
  },
  'I-864A': {
    start: {
      id: 'start',
      question: 'Are you a household member of the primary sponsor willing to combine your income or assets?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
  },
  'I-864W': {
    start: {
      id: 'start',
      question: 'Is the intending immigrant already a U.S. citizen or have they already earned 40 quarters of coverage under the SSA?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'Form I-864W is only for those exempt from the Affidavit of Support requirement.' },
      ],
    },
  },
  // Group 5: Employment-Based Petitions
  'I-129': {
    start: {
      id: 'start',
      question: 'Are you a U.S. employer, agent, or foreign employer with a U.S. agent?',
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'position_type' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'Form I-129 must be filed by an employer or agent, not the individual worker.' },
      ],
    },
    position_type: {
      id: 'position_type',
      question: 'Does the position qualify for a nonimmigrant classification (e.g., H-1B, L-1, O-1, TN)?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
  },
  'I-129CW': {
    start: {
      id: 'start',
      question: 'Are you petitioning for a CNMI-Only Transitional Worker?',
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'location' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
    location: {
      id: 'location',
      question: 'Will the worker be employed in the Commonwealth of the Northern Mariana Islands (CNMI)?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'I-129CW is strictly for employment in the CNMI.' },
      ],
    },
  },
  'I-129CWR': {
    start: {
      id: 'start',
      question: 'Are you an employer of CW-1 nonimmigrant workers?',
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'reporting_period' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
    reporting_period: {
      id: 'reporting_period',
      question: 'Is it time for your semiannual report?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
  },
  'I-129S': {
    start: {
      id: 'start',
      question: 'Does your company have an approved L Blanket petition?',
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'worker_eligibility' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'Form I-129S can only be used under an existing Blanket L approval.' },
      ],
    },
    worker_eligibility: {
      id: 'worker_eligibility',
      question: 'Has the worker been employed abroad by a qualifying organization for at least 1 continuous year within the last 3 years?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
  },
  'I-140': {
    start: {
      id: 'start',
      question: 'Are you petitioning for an alien worker to become a Permanent Resident (EB-1, EB-2, EB-3)?',
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'job_offer' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
    job_offer: {
      id: 'job_offer',
      question: 'Do you have a permanent, full-time job offer (or qualify for a self-petition like EB-1A or NIW)?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
  },
  'I-140G': {
    start: {
      id: 'start',
      question: 'Are you applying for the Immigrant Petition for the Gold Card Program?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
  },
  'I-905': {
    start: {
      id: 'start',
      question: 'Are you an organization seeking to issue health care worker certificates?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
  },
  'I-907': {
    start: {
      id: 'start',
      question: 'Are you filing (or have you already filed) an eligible form (e.g., I-129, I-140, I-765) that allows for Premium Processing?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'Premium processing is only available for specific petition types and categories.' },
      ],
    },
  },
  // Group 6: Humanitarian, Asylum & Protection
  'I-589': {
    start: {
      id: 'start',
      question: 'Are you currently physically present in the United States or at a Port of Entry?',
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'persecution' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'You must be inside the U.S. or at a border to apply for asylum.' },
      ],
    },
    persecution: {
      id: 'persecution',
      question: 'Do you fear persecution in your home country based on race, religion, nationality, political opinion, or membership in a particular social group?',
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'deadline' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'Asylum is only for those who fear persecution based on specific protected grounds.' },
      ],
    },
    deadline: {
      id: 'deadline',
      question: 'Have you been in the U.S. for less than one year?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'ELIGIBLE' }, // Can still file but requires exception
      ],
    },
  },
  'I-817': {
    start: {
      id: 'start',
      question: 'Are you the spouse or child of an individual who was granted legalization or TPS?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
  },
  'I-821': {
    start: {
      id: 'start',
      question: 'Are you a national of a country currently designated for Temporary Protected Status (TPS)?',
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'physical_presence' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'TPS is only available to nationals of specifically designated countries.' },
      ],
    },
    physical_presence: {
      id: 'physical_presence',
      question: 'Have you been continuously physically present in the U.S. since the date specified for your country?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
  },
  'I-821D': {
    start: {
      id: 'start',
      question: 'Do you currently have DACA status, or are you seeking to renew it?',
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'criminal_history' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'New initial DACA applications are currently suspended.' },
      ],
    },
    criminal_history: {
      id: 'criminal_history',
      question: 'Since your last DACA approval, have you been convicted of a felony or significant misdemeanor?',
      options: [
        { label: 'Yes', value: 'yes', result: 'TERMINATED' },
        { label: 'No', value: 'no', result: 'ELIGIBLE' },
      ],
    },
  },
  'I-854': {
    start: {
      id: 'start',
      question: 'Are you a law enforcement agency requesting a witness or informant?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
  },
  'I-881': {
    start: {
      id: 'start',
      question: 'Are you applying for suspension of deportation or special rule cancellation of removal under NACARA?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
  },
  'I-914': {
    start: {
      id: 'start',
      question: 'Are you a victim of a severe form of trafficking in persons?',
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'presence_trafficking' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
    presence_trafficking: {
      id: 'presence_trafficking',
      question: 'Are you physically present in the U.S. on account of such trafficking?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
  },
  'I-918': {
    start: {
      id: 'start',
      question: 'Are you a victim of a qualifying criminal activity who has suffered substantial physical or mental abuse?',
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'helpfulness' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
    helpfulness: {
      id: 'helpfulness',
      question: 'Have you been helpful, or are you likely to be helpful, to law enforcement in the investigation or prosecution?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
  },
  'I-929': {
    start: {
      id: 'start',
      question: 'Are you a U-1 nonimmigrant who has already filed for Adjustment of Status (I-485)?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
  },
  // Group 7: Investor Programs
  'I-526': {
    start: {
      id: 'start',
      question: 'Are you investing as a standalone investor (not through a regional center)?',
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'investment_amount' },
        { label: 'No, I am using a Regional Center', value: 'no', result: 'TERMINATED', message: 'Regional Center investors must file Form I-526E instead.' },
      ],
    },
    investment_amount: {
      id: 'investment_amount',
      question: 'Is your investment at least $1,050,000 (or $800,000 in a Targeted Employment Area)?',
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'lawful_source' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'You do not meet the minimum capital requirement for the EB-5 program.' },
      ],
    },
    lawful_source: {
      id: 'lawful_source',
      question: 'Can you document the lawful source of all capital being invested?',
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'job_creation' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
    job_creation: {
      id: 'job_creation',
      question: 'Will the investment create at least 10 full-time jobs for qualifying U.S. workers?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
  },
  'I-526E': {
    start: {
      id: 'start',
      question: 'Are you investing through a USCIS-designated Regional Center?',
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'regional_center_id' },
        { label: 'No, I am a standalone investor', value: 'no', result: 'TERMINATED', message: 'Standalone investors must file Form I-526 instead.' },
      ],
    },
    regional_center_id: {
      id: 'regional_center_id',
      question: 'Has the Regional Center filed Form I-956F for this specific investment project?',
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'investment_amount' },
        { label: "No / I don't know", value: 'no', result: 'TERMINATED', message: 'The project must have a pending or approved I-956F before you can file your I-526E.' },
      ],
    },
    investment_amount: {
      id: 'investment_amount',
      question: 'Is your investment at least $1,050,000 (or $800,000 in a TEA)?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
  },
  'I-941': {
    start: {
      id: 'start',
      question: 'Are you an entrepreneur seeking parole to start or scale a startup in the U.S.?',
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'ownership' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
    ownership: {
      id: 'ownership',
      question: 'Do you own at least 10% of the startup entity?',
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'investment_funding' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'Entrepreneur parole requires at least 10% ownership interest.' },
      ],
    },
    investment_funding: {
      id: 'investment_funding',
      question: 'Has the startup received at least $264,147 from qualified U.S. investors or $105,659 from government grants?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'Minimum funding or grant thresholds must be met for eligibility.' },
      ],
    },
  },
  'I-956': {
    start: {
      id: 'start',
      question: 'Are you an entity seeking designation as an EB-5 Regional Center?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
  },
  'I-956F': {
    start: {
      id: 'start',
      question: 'Are you a designated Regional Center seeking approval for a specific investment project?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
  },
  'I-956G': {
    start: {
      id: 'start',
      question: 'Are you a designated Regional Center filing your annual statement?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
  },
  'I-956H': {
    start: {
      id: 'start',
      question: 'Are you an individual involved with a Regional Center or project (Manager, Owner, etc.)?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
  },
  'I-956K': {
    start: {
      id: 'start',
      question: 'Are you a direct or third-party promoter for a Regional Center or new commercial enterprise?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
  },
  // Group 8: Waivers & Appeals
  'I-601': {
    start: {
      id: 'start',
      question: 'Have you been found inadmissible to the United States for a specific legal reason?',
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'qualifying_relative' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'Form I-601 is only for those who have a documented ground of inadmissibility.' },
      ],
    },
    qualifying_relative: {
      id: 'qualifying_relative',
      question: 'Do you have a qualifying U.S. citizen or LPR relative (Spouse or Parent) who would suffer extreme hardship if you were denied entry?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'Most I-601 waivers require a showing of extreme hardship to a qualifying U.S. relative.' },
      ],
    },
  },
  'I-601A': {
    start: {
      id: 'start',
      question: 'Are you currently physically present in the United States?',
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'unlawful_presence' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'Form I-601A is a provisional waiver for individuals currently inside the U.S.' },
      ],
    },
    unlawful_presence: {
      id: 'unlawful_presence',
      question: 'Is your only ground of inadmissibility unlawful presence?',
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'qualifying_relative' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'Provisional waivers (I-601A) only cover unlawful presence. Other grounds require Form I-601.' },
      ],
    },
    qualifying_relative: {
      id: 'qualifying_relative',
      question: 'Do you have a U.S. citizen or LPR spouse or parent?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
  },
  'I-212': {
    start: {
      id: 'start',
      question: 'Have you been previously deported or removed from the United States?',
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'time_passed' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'Form I-212 is specifically for those seeking permission to reapply after removal.' },
      ],
    },
    time_passed: {
      id: 'time_passed',
      question: 'Are you seeking to return to the U.S. before the expiration of your mandatory ban period (e.g., 5, 10, or 20 years)?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
  },
  'I-290B': {
    start: {
      id: 'start',
      question: 'Have you received an adverse decision (denial or revocation) from USCIS within the last 30 days?',
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'appeal_type' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'Form I-290B must be filed within strict deadlines, usually 30 days.' },
      ],
    },
    appeal_type: {
      id: 'appeal_type',
      question: 'Are you seeking to appeal the decision to the AAO or file a motion to reopen/reconsider?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
  },
  'I-612': {
    start: {
      id: 'start',
      question: 'Are you a J-1 or J-2 exchange visitor subject to the 2-year foreign residence requirement?',
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'waiver_basis' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
    waiver_basis: {
      id: 'waiver_basis',
      question: 'Do you have a basis for a waiver (Exceptional Hardship or Persecution)?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
  },
  'I-191': {
    start: {
      id: 'start',
      question: 'Are you a Lawful Permanent Resident who was in the U.S. for 7 consecutive years before 1997?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'Form I-191 is for relief under former section 212(c) of the INA.' },
      ],
    },
  },
  'I-192': {
    start: {
      id: 'start',
      question: 'Are you an inadmissible nonimmigrant seeking advance permission to enter the United States?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
  },
  'I-193': {
    start: {
      id: 'start',
      question: 'Are you a nonimmigrant seeking a waiver of passport and/or visa requirements due to an emergency?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
  },
  'I-690': {
    start: {
      id: 'start',
      question: 'Are you applying for a waiver of inadmissibility under the SAW or Legalization programs?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
  },
  'I-694': {
    start: {
      id: 'start',
      question: 'Are you appealing a decision under the SAW or Legalization programs?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
  },
  // Group 9: Administrative & Status Maintenance
  'AR-11': {
    start: {
      id: 'start',
      question: 'Are you a non-U.S. citizen who has changed your residential address?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'AR-11 is for reporting a change of address for non-citizens.' },
      ],
    },
  },
  'G-28': {
    start: {
      id: 'start',
      question: 'Have you retained an attorney or accredited representative to represent you before DHS?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'G-28 must be filed by an attorney or accredited representative.' },
      ],
    },
  },
  'G-28I': {
    start: {
      id: 'start',
      question: 'Are you being represented by an attorney in a matter outside the geographical confines of the U.S.?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
  },
  'G-325A': {
    start: {
      id: 'start',
      question: 'Are you providing biographic information in support of a deferred action or other specific application?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
  },
  'G-639': {
    start: {
      id: 'start',
      question: 'Are you requesting records under the Freedom of Information Act (FOIA) or Privacy Act?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
  },
  'G-1145': {
    start: {
      id: 'start',
      question: 'Do you want to receive an e-notification (email/text) when USCIS accepts your application?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
  },
  'I-9': {
    start: {
      id: 'start',
      question: 'Are you an employer verifying the identity and employment authorization of a new hire?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'Form I-9 is used by employers for workforce verification.' },
      ],
    },
  },
  'I-102': {
    start: {
      id: 'start',
      question: 'Are you applying for a replacement or initial nonimmigrant Arrival-Departure Document (I-94)?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
  },
  'I-134': {
    start: {
      id: 'start',
      question: 'Are you a U.S. sponsor providing a declaration of financial support for a nonimmigrant (e.g., humanitarian parole or visitor)?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
  },
  'I-539': {
    start: {
      id: 'start',
      question: 'Are you currently physically present in the United States?',
      options: [
        { label: 'Yes', value: 'yes', nextStep: 'status_check' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'Form I-539 is for changing or extending status while inside the U.S.' },
      ],
    },
    status_check: {
      id: 'status_check',
      question: 'Is your current nonimmigrant status still valid, or are you seeking a reinstatement?',
      options: [
        { label: 'Yes, it is valid', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No, but seeking reinstatement', value: 'no', result: 'ELIGIBLE' },
        { label: 'No, and not seeking reinstatement', value: 'expired', result: 'TERMINATED', message: 'Extensions generally cannot be filed for status that has already lapsed.' },
      ],
    },
  },
  'I-824': {
    start: {
      id: 'start',
      question: 'Are you requesting further action on a previously approved application or petition?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
  },
  'I-865': {
    start: {
      id: 'start',
      question: 'Are you a sponsor who previously filed Form I-864 and has now changed your address?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
  },
  'I-912': {
    start: {
      id: 'start',
      question: 'Are you filing an application that allows for a fee waiver, and do you have a qualifying financial hardship?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED', message: 'Form I-912 is only for those requesting an exemption from USCIS filing fees.' },
      ],
    },
  },
  'G-1041': {
    start: {
      id: 'start',
      question: 'Are you requesting a search of USCIS genealogy indices?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
  },
  'G-1041A': {
    start: {
      id: 'start',
      question: 'Are you requesting historical records from the USCIS Genealogy Program?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
  },
  'G-1256': {
    start: {
      id: 'start',
      question: 'Do you require an interpreter for your USCIS interview?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
  },
  'G-1450': {
    start: {
      id: 'start',
      question: 'Are you authorizing a credit card transaction for USCIS fees?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
  },
  'G-1566': {
    start: {
      id: 'start',
      question: 'Are you requesting a certificate of non-existence of a naturalization record?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
  },
  'G-325R': {
    start: {
      id: 'start',
      question: 'Are you providing biographic information for registration purposes?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
  },
  'G-845': {
    start: {
      id: 'start',
      question: 'Are you a benefit-granting agency verifying immigration status?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
  },
  'G-884': {
    start: {
      id: 'start',
      question: 'Are you requesting the return of original documents from your USCIS file?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
  },
  'I-566': {
    start: {
      id: 'start',
      question: 'Are you a dependent of an A, G, or NATO nonimmigrant seeking employment authorization?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
  },
  'I-910': {
    start: {
      id: 'start',
      question: 'Are you a physician seeking designation as a USCIS Civil Surgeon?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
  },
  'I-945': {
    start: {
      id: 'start',
      question: 'Are you posting a public charge bond as requested by USCIS?',
      options: [
        { label: 'Yes', value: 'yes', result: 'ELIGIBLE' },
        { label: 'No', value: 'no', result: 'TERMINATED' },
      ],
    },
  },
};

interface Props {
  formNumber: string;
  formName: string;
  onEligible: () => void;
  onCancel: () => void;
}

export const DocumentKnockoutWizard: React.FC<Props> = ({ formNumber, formName, onEligible, onCancel }) => {
  const [currentStepId, setCurrentStepId] = useState<string>('start');
  const [history, setHistory] = useState<string[]>([]);
  const [result, setResult] = useState<'ELIGIBLE' | 'TERMINATED' | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const tree = DOCUMENT_TREES[formNumber];

  // If no specific tree exists, default to eligible for now (to be implemented later)
  if (!tree) {
    return (
      <div className="text-center space-y-6 py-8">
        <h2 className="text-2xl font-bold dark:text-white">Begin Preparation for {formNumber}</h2>
        <p className="text-gray-600 dark:text-gray-400">
          You are about to start the automated filing process for the {formName}.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button onClick={onEligible}>Continue to Sign Up</Button>
        </div>
      </div>
    );
  }

  const currentStep = tree[currentStepId];

  const handleOptionClick = (option: Option) => {
    if (option.result) {
      setResult(option.result);
      setMessage(option.message || null);
      if (option.result === 'ELIGIBLE') {
        onEligible();
      }
      return;
    }

    if (option.nextStep) {
      setHistory([...history, currentStepId]);
      setCurrentStepId(option.nextStep);
    }
  };

  const handleBack = () => {
    const previous = history.pop();
    if (previous) {
      setCurrentStepId(previous);
      setHistory([...history]);
      setResult(null);
      setMessage(null);
    } else {
      onCancel();
    }
  };

  if (result === 'TERMINATED') {
    return (
      <div className="text-center space-y-6 py-8">
        <div className="bg-red-100 dark:bg-red-900/30 p-6 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Ineligible for {formNumber}</h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          {message}
        </p>
        <div className="pt-4">
          <Button variant="secondary" onClick={onCancel}>Back to Catalog</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button 
            onClick={handleBack}
            className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 transition-colors"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
            {formNumber} Eligibility Check
          </span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
          {currentStep.question}
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {currentStep.options.map((option) => (
          <button
            key={option.value}
            onClick={() => handleOptionClick(option)}
            className="p-5 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-left hover:border-blue-600 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-gray-800/50 transition-all group"
          >
            <span className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
              {option.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

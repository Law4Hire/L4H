using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace L4H.Infrastructure.Services
{
    /// <summary>
    /// Service for evaluating visa eligibility based on decision tree answers.
    /// Returns all eligible (green) and potentially eligible (yellow) visas.
    /// </summary>
    public class DecisionTreeVisaEligibilityService
    {
        private readonly L4HDbContext _context;
        private readonly ILogger<DecisionTreeVisaEligibilityService> _logger;

        public DecisionTreeVisaEligibilityService(
            L4HDbContext context,
            ILogger<DecisionTreeVisaEligibilityService> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Evaluates all active visa types and returns eligibility results
        /// </summary>
        public async Task<List<VisaEligibilityResult>> EvaluateEligibilityAsync(
            Dictionary<string, string> answers,
            User? user = null)
        {
            _logger.LogInformation("Evaluating visa eligibility with {AnswerCount} answers", answers.Count);

            // Get all active visa types
            var allVisaTypes = await _context.VisaTypes
                .Where(v => v.IsActive)
                .ToListAsync();

            _logger.LogInformation("Found {VisaTypeCount} active visa types", allVisaTypes.Count);

            var results = new List<VisaEligibilityResult>();

            foreach (var visaType in allVisaTypes)
            {
                var result = await EvaluateVisaTypeAsync(visaType, answers, user);

                // Only include visas that are eligible or potentially eligible
                if (result.EligibilityStatus == "Eligible" || result.EligibilityStatus == "Potential")
                {
                    results.Add(result);
                }
            }

            // Sort by match score descending
            results = results.OrderByDescending(r => r.MatchScore).ToList();

            _logger.LogInformation("Evaluation complete: {EligibleCount} eligible, {PotentialCount} potential",
                results.Count(r => r.EligibilityStatus == "Eligible"),
                results.Count(r => r.EligibilityStatus == "Potential"));

            return results;
        }

        /// <summary>
        /// Evaluates a single visa type for eligibility
        /// </summary>
        private async Task<VisaEligibilityResult> EvaluateVisaTypeAsync(
            VisaType visaType,
            Dictionary<string, string> answers,
            User? user)
        {
            var result = new VisaEligibilityResult
            {
                VisaTypeId = visaType.Id,
                CreatedAt = DateTime.UtcNow
            };

            var metRequirements = new List<string>();
            var unmetRequirements = new List<string>();

            // Evaluate based on visa code
            switch (visaType.Code)
            {
                // Tourist & Business Visas
                case "B-1":
                    EvaluateB1(answers, user, ref metRequirements, ref unmetRequirements);
                    break;
                case "B-2":
                    EvaluateB2(answers, user, ref metRequirements, ref unmetRequirements);
                    break;
                case "ESTA":
                    EvaluateESTA(answers, user, ref metRequirements, ref unmetRequirements);
                    break;

                // Work Visas
                case "H-1B":
                    EvaluateH1B(answers, user, ref metRequirements, ref unmetRequirements);
                    break;
                case "H-2A":
                    EvaluateH2A(answers, user, ref metRequirements, ref unmetRequirements);
                    break;
                case "H-2B":
                    EvaluateH2B(answers, user, ref metRequirements, ref unmetRequirements);
                    break;
                case "L-1A":
                case "L-1B":
                    EvaluateL1(answers, user, visaType.Code, ref metRequirements, ref unmetRequirements);
                    break;
                case "O-1":
                    EvaluateO1(answers, user, ref metRequirements, ref unmetRequirements);
                    break;
                case "P-1":
                    EvaluateP1(answers, user, ref metRequirements, ref unmetRequirements);
                    break;
                case "TN":
                    EvaluateTN(answers, user, ref metRequirements, ref unmetRequirements);
                    break;
                case "E-3":
                    EvaluateE3(answers, user, ref metRequirements, ref unmetRequirements);
                    break;

                // Student Visas
                case "F-1":
                    EvaluateF1(answers, user, ref metRequirements, ref unmetRequirements);
                    break;
                case "M-1":
                    EvaluateM1(answers, user, ref metRequirements, ref unmetRequirements);
                    break;
                case "J-1":
                    EvaluateJ1(answers, user, ref metRequirements, ref unmetRequirements);
                    break;

                // Family-Based Nonimmigrant
                case "K-1":
                    EvaluateK1(answers, user, ref metRequirements, ref unmetRequirements);
                    break;
                case "K-3":
                    EvaluateK3(answers, user, ref metRequirements, ref unmetRequirements);
                    break;

                // Investment Visas (Nonimmigrant)
                case "E-1":
                    EvaluateE1(answers, user, ref metRequirements, ref unmetRequirements);
                    break;
                case "E-2":
                    EvaluateE2(answers, user, ref metRequirements, ref unmetRequirements);
                    break;

                // Family-Based Immediate Relatives
                case "IR-1":
                case "CR-1":
                    EvaluateIR1_CR1(answers, user, visaType.Code, ref metRequirements, ref unmetRequirements);
                    break;
                case "IR-2":
                case "CR-2":
                    EvaluateIR2_CR2(answers, user, visaType.Code, ref metRequirements, ref unmetRequirements);
                    break;
                case "IR-5":
                    EvaluateIR5(answers, user, ref metRequirements, ref unmetRequirements);
                    break;
                case "IR-3":
                case "IR-4":
                    EvaluateIR3_IR4(answers, user, visaType.Code, ref metRequirements, ref unmetRequirements);
                    break;

                // Family-Based Preference Categories
                case "F1": // Family First Preference (unmarried sons/daughters of US citizens)
                    EvaluateFamilyF1(answers, user, ref metRequirements, ref unmetRequirements);
                    break;
                case "F2A":
                case "F2B":
                    EvaluateFamilyF2(answers, user, visaType.Code, ref metRequirements, ref unmetRequirements);
                    break;
                case "F3":
                    EvaluateFamilyF3(answers, user, ref metRequirements, ref unmetRequirements);
                    break;
                case "F4":
                    EvaluateFamilyF4(answers, user, ref metRequirements, ref unmetRequirements);
                    break;

                // Employment-Based Categories
                case "EB-1":
                case "EB-1A":
                case "EB-1B":
                case "EB-1C":
                    EvaluateEB1(answers, user, visaType.Code, ref metRequirements, ref unmetRequirements);
                    break;
                case "EB-2":
                    EvaluateEB2(answers, user, ref metRequirements, ref unmetRequirements);
                    break;
                case "EB-3":
                    EvaluateEB3(answers, user, ref metRequirements, ref unmetRequirements);
                    break;
                case "EB-4":
                    EvaluateEB4(answers, user, ref metRequirements, ref unmetRequirements);
                    break;
                case "EB-5":
                    EvaluateEB5(answers, user, ref metRequirements, ref unmetRequirements);
                    break;

                // Citizenship/Naturalization
                case "N-400":
                    EvaluateN400(answers, user, ref metRequirements, ref unmetRequirements);
                    break;
                case "N-600":
                    EvaluateN600(answers, user, ref metRequirements, ref unmetRequirements);
                    break;

                default:
                    // For unknown visa types, mark as not eligible
                    unmetRequirements.Add("Visa type not yet supported in evaluation system");
                    break;
            }

            // Calculate match score based on met vs total requirements
            var totalRequirements = metRequirements.Count + unmetRequirements.Count;
            result.MatchScore = totalRequirements > 0
                ? (int)((double)metRequirements.Count / totalRequirements * 100)
                : 0;

            // Determine eligibility status
            if (result.MatchScore >= 90)
            {
                result.EligibilityStatus = "Eligible";
                result.Rationale = GenerateRationale(visaType.Code, metRequirements, true);
            }
            else if (result.MatchScore >= 70)
            {
                result.EligibilityStatus = "Potential";
                result.Rationale = GenerateRationale(visaType.Code, metRequirements, false) +
                    " Additional review or documentation may be required.";
            }
            else
            {
                result.EligibilityStatus = "Not Eligible";
                result.Rationale = $"Does not meet minimum requirements for {visaType.Code}.";
            }

            // Store requirements as JSON arrays
            result.MetRequirements = System.Text.Json.JsonSerializer.Serialize(metRequirements);
            result.UnmetRequirements = System.Text.Json.JsonSerializer.Serialize(unmetRequirements);

            return result;
        }

        private string GenerateRationale(string visaCode, List<string> metRequirements, bool isFullyEligible)
        {
            if (metRequirements.Count == 0)
            {
                return $"Based on your responses, {visaCode} may be an option.";
            }

            var status = isFullyEligible ? "meets" : "appears to meet";
            return $"Based on your responses, you {status} the key requirements for {visaCode}: " +
                   string.Join(", ", metRequirements.Take(3)) +
                   (metRequirements.Count > 3 ? ", and more." : ".");
        }

        #region Evaluation Methods - Tourist & Business

        private void EvaluateB1(Dictionary<string, string> answers, User? user,
            ref List<string> met, ref List<string> unmet)
        {
            // Purpose check
            if (GetAnswer(answers, "purpose") == "business")
            {
                met.Add("Business purpose");
            }
            else if (GetAnswer(answers, "purpose") == "tourism")
            {
                // B-1 for business, not tourism
                unmet.Add("Purpose must be business-related");
                return;
            }

            // Duration check
            var duration = GetAnswer(answers, "duration");
            if (duration == "short" || duration == "medium")
            {
                met.Add("Short-term stay");
            }
            else if (duration == "long" || duration == "permanent")
            {
                unmet.Add("B-1 is for temporary visits only");
            }

            // Financial ties
            if (GetAnswer(answers, "hasReturnTies") == "yes")
            {
                met.Add("Return ties to home country");
            }
            else
            {
                unmet.Add("Must demonstrate ties to home country");
            }

            // No employment requirement
            if (GetAnswer(answers, "hasEmployerSponsor") == "no")
            {
                met.Add("No employer sponsorship required");
            }
        }

        private void EvaluateB2(Dictionary<string, string> answers, User? user,
            ref List<string> met, ref List<string> unmet)
        {
            // Purpose check
            var purpose = GetAnswer(answers, "purpose");
            if (purpose == "tourism" || purpose == "family" || purpose == "medical")
            {
                met.Add($"{purpose} purpose (suitable for B-2)");
            }
            else if (purpose == "business")
            {
                unmet.Add("Business purposes require B-1, not B-2");
                return;
            }

            // Duration check
            var duration = GetAnswer(answers, "duration");
            if (duration == "short" || duration == "medium")
            {
                met.Add("Temporary stay");
            }
            else
            {
                unmet.Add("B-2 is for temporary visits");
            }

            // Financial support
            if (GetAnswer(answers, "hasFinancialSupport") == "yes")
            {
                met.Add("Financial support for visit");
            }
            else
            {
                unmet.Add("Must show financial means to support visit");
            }
        }

        private void EvaluateESTA(Dictionary<string, string> answers, User? user,
            ref List<string> met, ref List<string> unmet)
        {
            // Check VWP country eligibility
            var nationality = user?.Nationality ?? GetAnswer(answers, "nationality");
            if (IsVWPCountry(nationality))
            {
                met.Add("Citizen of Visa Waiver Program country");
            }
            else
            {
                unmet.Add("Must be citizen of VWP country");
                return;
            }

            // Purpose check
            var purpose = GetAnswer(answers, "purpose");
            if (purpose == "tourism" || purpose == "business")
            {
                met.Add("Tourism or business purpose");
            }
            else
            {
                unmet.Add("ESTA only for tourism or business");
            }

            // Duration check (must be < 90 days)
            if (GetAnswer(answers, "duration") == "short")
            {
                met.Add("Stay under 90 days");
            }
            else
            {
                unmet.Add("ESTA limited to 90 days or less");
            }
        }

        #endregion

        #region Evaluation Methods - Work Visas

        private void EvaluateH1B(Dictionary<string, string> answers, User? user,
            ref List<string> met, ref List<string> unmet)
        {
            // Purpose must be employment
            if (GetAnswer(answers, "purpose") != "employment")
            {
                unmet.Add("H-1B requires employment purpose");
                return;
            }

            // Employer sponsorship required
            if (GetAnswer(answers, "hasEmployerSponsor") == "yes")
            {
                met.Add("US employer sponsorship");
            }
            else
            {
                unmet.Add("Requires US employer sponsor");
                return;
            }

            // Education requirement
            var education = GetAnswer(answers, "educationLevel");
            if (education == "bachelor" || education == "master" ||
                education == "doctorate" || education == "professional")
            {
                met.Add("Bachelor's degree or higher");
            }
            else
            {
                unmet.Add("Requires bachelor's degree or equivalent");
            }

            // Specialty occupation
            if (GetAnswer(answers, "specialtyOccupation") == "yes")
            {
                met.Add("Specialty occupation");
            }
            else
            {
                unmet.Add("Job must require specialized knowledge");
            }

            // Prevailing wage
            if (GetAnswer(answers, "meetsPreva ilingWage") == "yes")
            {
                met.Add("Meets prevailing wage requirements");
            }
        }

        private void EvaluateH2A(Dictionary<string, string> answers, User? user,
            ref List<string> met, ref List<string> unmet)
        {
            if (GetAnswer(answers, "purpose") != "employment")
            {
                unmet.Add("H-2A requires employment purpose");
                return;
            }

            // Agricultural work
            if (GetAnswer(answers, "workType") == "agricultural")
            {
                met.Add("Agricultural work");
            }
            else
            {
                unmet.Add("H-2A only for agricultural workers");
                return;
            }

            // Temporary/seasonal
            if (GetAnswer(answers, "isSeasonalWork") == "yes")
            {
                met.Add("Temporary/seasonal work");
            }
            else
            {
                unmet.Add("Must be temporary or seasonal");
            }

            // Employer certification
            if (GetAnswer(answers, "hasEmployerCertification") == "yes")
            {
                met.Add("Employer labor certification");
            }
            else
            {
                unmet.Add("Requires employer labor certification");
            }
        }

        private void EvaluateH2B(Dictionary<string, string> answers, User? user,
            ref List<string> met, ref List<string> unmet)
        {
            if (GetAnswer(answers, "purpose") != "employment")
            {
                unmet.Add("H-2B requires employment purpose");
                return;
            }

            // Non-agricultural work
            if (GetAnswer(answers, "workType") != "agricultural")
            {
                met.Add("Non-agricultural work");
            }
            else
            {
                unmet.Add("H-2B is for non-agricultural work");
                return;
            }

            // Temporary need
            if (GetAnswer(answers, "isTemporaryNeed") == "yes")
            {
                met.Add("Temporary need");
            }
            else
            {
                unmet.Add("Must be temporary need");
            }

            // Employer sponsorship
            if (GetAnswer(answers, "hasEmployerSponsor") == "yes")
            {
                met.Add("Employer sponsor");
            }
            else
            {
                unmet.Add("Requires employer sponsor");
            }
        }

        private void EvaluateL1(Dictionary<string, string> answers, User? user, string visaCode,
            ref List<string> met, ref List<string> unmet)
        {
            // Intracompany transfer
            if (GetAnswer(answers, "hasInternationalCompanyRelationship") != "yes")
            {
                unmet.Add("Must work for company with US office");
                return;
            }

            met.Add("Works for company with US office");

            // 1 year employment abroad
            if (GetAnswer(answers, "yearsWithCompany") != null &&
                int.TryParse(GetAnswer(answers, "yearsWithCompany"), out var years) && years >= 1)
            {
                met.Add("1+ years with company abroad");
            }
            else
            {
                unmet.Add("Requires 1+ years with company abroad");
            }

            // L-1A vs L-1B
            if (visaCode == "L-1A")
            {
                if (GetAnswer(answers, "isManagerOrExecutive") == "yes")
                {
                    met.Add("Executive or managerial role");
                }
                else
                {
                    unmet.Add("L-1A requires executive/managerial role");
                }
            }
            else // L-1B
            {
                if (GetAnswer(answers, "hasSpecializedKnowledge") == "yes")
                {
                    met.Add("Specialized knowledge");
                }
                else
                {
                    unmet.Add("L-1B requires specialized knowledge");
                }
            }
        }

        private void EvaluateO1(Dictionary<string, string> answers, User? user,
            ref List<string> met, ref List<string> unmet)
        {
            // Extraordinary ability
            if (GetAnswer(answers, "hasExtraordinaryAbility") != "yes")
            {
                unmet.Add("Must demonstrate extraordinary ability");
                return;
            }

            met.Add("Extraordinary ability in field");

            // National/international recognition
            if (GetAnswer(answers, "hasNationalRecognition") == "yes")
            {
                met.Add("National/international recognition");
            }
            else
            {
                unmet.Add("Requires sustained national/international acclaim");
            }

            // Evidence criteria
            var criteriaCount = 0;
            if (GetAnswer(answers, "hasMajorAwards") == "yes") criteriaCount++;
            if (GetAnswer(answers, "hasProfessionalMembership") == "yes") criteriaCount++;
            if (GetAnswer(answers, "hasPublishedMaterial") == "yes") criteriaCount++;
            if (GetAnswer(answers, "hasJudgedOthers") == "yes") criteriaCount++;

            if (criteriaCount >= 3)
            {
                met.Add($"Meets {criteriaCount} evidence criteria");
            }
            else
            {
                unmet.Add("Must meet at least 3 of 8 evidence criteria");
            }
        }

        private void EvaluateP1(Dictionary<string, string> answers, User? user,
            ref List<string> met, ref List<string> unmet)
        {
            var field = GetAnswer(answers, "fieldOfWork");
            if (field != "athletics" && field != "entertainment")
            {
                unmet.Add("P-1 is for athletes and entertainment groups");
                return;
            }

            met.Add($"{field} field");

            // International recognition
            if (GetAnswer(answers, "hasInternationalRecognition") == "yes")
            {
                met.Add("Internationally recognized");
            }
            else
            {
                unmet.Add("Must be internationally recognized");
            }

            // Event or competition
            if (GetAnswer(answers, "hasSpecificEvent") == "yes")
            {
                met.Add("Specific event/competition");
            }
            else
            {
                unmet.Add("Must have specific event or competition");
            }
        }

        private void EvaluateTN(Dictionary<string, string> answers, User? user,
            ref List<string> met, ref List<string> unmet)
        {
            // Nationality check
            var nationality = user?.Nationality ?? GetAnswer(answers, "nationality");
            if (nationality == "CA" || nationality == "Canada" ||
                nationality == "MX" || nationality == "Mexico")
            {
                met.Add($"{nationality} citizen (USMCA eligible)");
            }
            else
            {
                unmet.Add("TN visa only for Canadian or Mexican citizens");
                return;
            }

            // Profession on USMCA list
            if (GetAnswer(answers, "isUSMCAProfession") == "yes")
            {
                met.Add("Profession on USMCA list");
            }
            else
            {
                unmet.Add("Profession must be on USMCA list");
            }

            // Qualifications
            if (GetAnswer(answers, "meetsUSMCAQualifications") == "yes")
            {
                met.Add("Meets qualification requirements");
            }
            else
            {
                unmet.Add("Must meet qualification requirements for profession");
            }

            // Job offer
            if (GetAnswer(answers, "hasJobOffer") == "yes")
            {
                met.Add("Job offer from US employer");
            }
            else
            {
                unmet.Add("Requires job offer from US employer");
            }
        }

        private void EvaluateE3(Dictionary<string, string> answers, User? user,
            ref List<string> met, ref List<string> unmet)
        {
            // Australian citizen only
            var nationality = user?.Nationality ?? GetAnswer(answers, "nationality");
            if (nationality == "AU" || nationality == "Australia")
            {
                met.Add("Australian citizen");
            }
            else
            {
                unmet.Add("E-3 visa only for Australian citizens");
                return;
            }

            // Similar to H-1B requirements
            EvaluateH1B(answers, user, ref met, ref unmet);
        }

        #endregion

        #region Evaluation Methods - Student Visas

        private void EvaluateF1(Dictionary<string, string> answers, User? user,
            ref List<string> met, ref List<string> unmet)
        {
            // Purpose check
            if (GetAnswer(answers, "purpose") != "study")
            {
                unmet.Add("F-1 requires study purpose");
                return;
            }

            // School acceptance
            if (GetAnswer(answers, "hasSchoolAcceptance") == "yes")
            {
                met.Add("Accepted to SEVP-certified school");
            }
            else
            {
                unmet.Add("Must be accepted to SEVP-certified school");
            }

            // Full-time study
            if (GetAnswer(answers, "isFullTimeStudent") == "yes")
            {
                met.Add("Full-time student");
            }
            else
            {
                unmet.Add("Must enroll as full-time student");
            }

            // Financial support
            if (GetAnswer(answers, "hasFinancialSupport") == "yes")
            {
                met.Add("Financial support for studies");
            }
            else
            {
                unmet.Add("Must demonstrate financial support");
            }

            // Non-immigrant intent
            if (GetAnswer(answers, "hasReturnIntent") == "yes")
            {
                met.Add("Intent to return to home country");
            }
            else
            {
                unmet.Add("Must demonstrate intent to return home after studies");
            }
        }

        private void EvaluateM1(Dictionary<string, string> answers, User? user,
            ref List<string> met, ref List<string> unmet)
        {
            // Similar to F-1 but for vocational
            if (GetAnswer(answers, "programType") == "vocational")
            {
                met.Add("Vocational/technical program");
            }
            else
            {
                unmet.Add("M-1 is for vocational/technical programs");
                return;
            }

            // Reuse F-1 logic for other requirements
            EvaluateF1(answers, user, ref met, ref unmet);
        }

        private void EvaluateJ1(Dictionary<string, string> answers, User? user,
            ref List<string> met, ref List<string> unmet)
        {
            // Exchange program
            if (GetAnswer(answers, "hasExchangeProgram") == "yes")
            {
                met.Add("Approved exchange program");
            }
            else
            {
                unmet.Add("Must have approved exchange program");
            }

            // Program sponsor
            if (GetAnswer(answers, "hasProgramSponsor") == "yes")
            {
                met.Add("Designated program sponsor");
            }
            else
            {
                unmet.Add("Must have designated program sponsor");
            }

            // Various J-1 categories
            var j1Category = GetAnswer(answers, "j1Category");
            if (!string.IsNullOrEmpty(j1Category))
            {
                met.Add($"J-1 category: {j1Category}");
            }
        }

        #endregion

        #region Evaluation Methods - Family Nonimmigrant

        private void EvaluateK1(Dictionary<string, string> answers, User? user,
            ref List<string> met, ref List<string> unmet)
        {
            // Engaged to US citizen
            if (GetAnswer(answers, "engagedToUSCitizen") == "yes")
            {
                met.Add("Engaged to US citizen");
            }
            else
            {
                unmet.Add("Must be engaged to US citizen");
                return;
            }

            // Met in person
            if (GetAnswer(answers, "metInPersonLast2Years") == "yes")
            {
                met.Add("Met in person within last 2 years");
            }
            else
            {
                unmet.Add("Must have met in person within last 2 years");
            }

            // Intent to marry
            if (GetAnswer(answers, "intentToMarry90Days") == "yes")
            {
                met.Add("Intent to marry within 90 days of entry");
            }
            else
            {
                unmet.Add("Must intend to marry within 90 days");
            }

            // Unmarried status
            var maritalStatus = user?.MaritalStatus ?? GetAnswer(answers, "maritalStatus");
            if (maritalStatus == "single" || maritalStatus == "unmarried")
            {
                met.Add("Unmarried");
            }
            else
            {
                unmet.Add("Must be unmarried");
            }
        }

        private void EvaluateK3(Dictionary<string, string> answers, User? user,
            ref List<string> met, ref List<string> unmet)
        {
            // Married to US citizen
            var maritalStatus = user?.MaritalStatus ?? GetAnswer(answers, "maritalStatus");
            if (maritalStatus == "married" && GetAnswer(answers, "spouseIsUSCitizen") == "yes")
            {
                met.Add("Married to US citizen");
            }
            else
            {
                unmet.Add("Must be married to US citizen");
                return;
            }

            // I-130 filed
            if (GetAnswer(answers, "i130Filed") == "yes")
            {
                met.Add("I-130 petition filed");
            }
            else
            {
                unmet.Add("Spouse must have filed I-130 petition");
            }

            // Processing delay
            met.Add("K-3 allows entry while I-130 is pending");
        }

        #endregion

        #region Evaluation Methods - Investment Nonimmigrant

        private void EvaluateE1(Dictionary<string, string> answers, User? user,
            ref List<string> met, ref List<string> unmet)
        {
            // Treaty country
            var nationality = user?.Nationality ?? GetAnswer(answers, "nationality");
            if (IsTreatyCountry(nationality, "E-1"))
            {
                met.Add($"Treaty country national ({nationality})");
            }
            else
            {
                unmet.Add("Must be national of E-1 treaty country");
                return;
            }

            // Substantial trade
            if (GetAnswer(answers, "hasSubstantialTrade") == "yes")
            {
                met.Add("Substantial trade between US and home country");
            }
            else
            {
                unmet.Add("Must have substantial trade");
            }

            // Principal trade
            if (GetAnswer(answers, "isPrincipalTrade") == "yes")
            {
                met.Add("Principal trade is between US and treaty country");
            }
            else
            {
                unmet.Add("Principal trade must be between US and treaty country");
            }

            // Trader or employee
            if (GetAnswer(answers, "isTreaty TraderOrEmployee") == "yes")
            {
                met.Add("Treaty trader or qualifying employee");
            }
            else
            {
                unmet.Add("Must be treaty trader or qualifying employee");
            }
        }

        private void EvaluateE2(Dictionary<string, string> answers, User? user,
            ref List<string> met, ref List<string> unmet)
        {
            // Treaty country
            var nationality = user?.Nationality ?? GetAnswer(answers, "nationality");
            if (IsTreatyCountry(nationality, "E-2"))
            {
                met.Add($"Treaty country national ({nationality})");
            }
            else
            {
                unmet.Add("Must be national of E-2 treaty country");
                return;
            }

            // Investment amount
            var investment = GetAnswer(answers, "investmentAmount");
            if (investment == "large" || investment == "eb5")
            {
                met.Add("Substantial investment");
            }
            else if (investment == "medium")
            {
                met.Add("Moderate investment (may qualify)");
            }
            else
            {
                unmet.Add("Must make substantial investment ($100K-$200K+)");
            }

            // Active investment
            if (GetAnswer(answers, "isActiveInvestment") == "yes")
            {
                met.Add("Active investment in commercial enterprise");
            }
            else
            {
                unmet.Add("Must be active (not passive) investment");
            }

            // Ownership/control
            if (GetAnswer(answers, "hasOwnershipControl") == "yes")
            {
                met.Add("Ownership and control of business");
            }
            else
            {
                unmet.Add("Must have ownership and control");
            }
        }

        #endregion

        #region Evaluation Methods - Family Immigrant

        private void EvaluateIR1_CR1(Dictionary<string, string> answers, User? user, string visaCode,
            ref List<string> met, ref List<string> unmet)
        {
            // Married to US citizen
            var maritalStatus = user?.MaritalStatus ?? GetAnswer(answers, "maritalStatus");
            if (maritalStatus != "married")
            {
                unmet.Add("Must be married");
                return;
            }

            if (GetAnswer(answers, "spouseIsUSCitizen") == "yes")
            {
                met.Add("Spouse is US citizen");
            }
            else
            {
                unmet.Add("Spouse must be US citizen");
                return;
            }

            // Marriage duration
            var marriageDuration = GetAnswer(answers, "marriageDurationYears");
            if (visaCode == "IR-1" && (int.TryParse(marriageDuration, out var years) && years >= 2))
            {
                met.Add("Married 2+ years (IR-1)");
            }
            else if (visaCode == "CR-1" && (int.TryParse(marriageDuration, out var years2) && years2 < 2))
            {
                met.Add("Married less than 2 years (CR-1 conditional)");
            }
            else if (visaCode == "IR-1")
            {
                unmet.Add("IR-1 requires marriage of 2+ years");
            }
            else
            {
                unmet.Add("CR-1 is for marriages under 2 years");
            }

            // Bona fide marriage
            if (GetAnswer(answers, "isBonaFideMarriage") == "yes")
            {
                met.Add("Bona fide marriage");
            }
            else
            {
                unmet.Add("Must demonstrate bona fide marriage");
            }

            // Immediate relative - no wait time
            met.Add("Immediate relative (no visa quota wait)");
        }

        private void EvaluateIR2_CR2(Dictionary<string, string> answers, User? user, string visaCode,
            ref List<string> met, ref List<string> unmet)
        {
            // Age check
            var age = CalculateAge(user?.DateOfBirth);
            if (age < 21)
            {
                met.Add("Under 21 years old");
            }
            else
            {
                unmet.Add("Must be under 21");
                return;
            }

            // Unmarried
            var maritalStatus = user?.MaritalStatus ?? GetAnswer(answers, "maritalStatus");
            if (maritalStatus == "single" || maritalStatus == "unmarried")
            {
                met.Add("Unmarried");
            }
            else
            {
                unmet.Add("Must be unmarried");
                return;
            }

            // Parent is US citizen
            if (GetAnswer(answers, "parentIsUSCitizen") == "yes")
            {
                met.Add("Parent is US citizen");
            }
            else
            {
                unmet.Add("Parent must be US citizen");
                return;
            }

            // Parent's marriage duration (for CR-2)
            if (visaCode == "CR-2")
            {
                met.Add("Child of CR-1 holder");
            }

            met.Add("Immediate relative (no visa quota wait)");
        }

        private void EvaluateIR5(Dictionary<string, string> answers, User? user,
            ref List<string> met, ref List<string> unmet)
        {
            // Child must be US citizen and 21+
            if (GetAnswer(answers, "childIsUSCitizen") == "yes")
            {
                met.Add("Child is US citizen");
            }
            else
            {
                unmet.Add("Child must be US citizen");
                return;
            }

            if (GetAnswer(answers, "childAge") != null &&
                int.TryParse(GetAnswer(answers, "childAge"), out var childAge) && childAge >= 21)
            {
                met.Add("Child is 21+ years old");
            }
            else
            {
                unmet.Add("Child must be 21 or older");
                return;
            }

            // Parent-child relationship
            if (GetAnswer(answers, "parentChildRelationship") == "yes")
            {
                met.Add("Parent-child relationship established");
            }
            else
            {
                unmet.Add("Must establish parent-child relationship");
            }

            met.Add("Immediate relative (no visa quota wait)");
        }

        private void EvaluateIR3_IR4(Dictionary<string, string> answers, User? user, string visaCode,
            ref List<string> met, ref List<string> unmet)
        {
            // Adoption
            if (GetAnswer(answers, "adoptionType") != "international")
            {
                unmet.Add("IR-3/IR-4 are for international adoption");
                return;
            }

            met.Add("International adoption");

            // Child age
            var childAge = GetAnswer(answers, "childAge");
            if (!string.IsNullOrEmpty(childAge))
            {
                var ageOk = childAge == "infant" || childAge == "toddler" ||
                           childAge == "preschool" || childAge == "school_age" || childAge == "teenager";
                if (ageOk)
                {
                    met.Add("Child under 16 (or 18 if sibling)");
                }
                else
                {
                    unmet.Add("Child must be under 16 (or 18 if adopting sibling)");
                }
            }

            // Adoption completion status
            var adoptionCompleted = GetAnswer(answers, "adoptionCompleted");
            if (visaCode == "IR-3" && adoptionCompleted == "yes")
            {
                met.Add("Adoption completed abroad (IR-3)");
            }
            else if (visaCode == "IR-4" && adoptionCompleted == "no")
            {
                met.Add("Adoption to be completed in US (IR-4)");
            }
            else if (visaCode == "IR-3")
            {
                unmet.Add("IR-3 requires adoption completed abroad");
            }
            else
            {
                unmet.Add("IR-4 is for adoption to be completed in US");
            }

            // Home study
            if (GetAnswer(answers, "homeStudyCompleted") == "yes")
            {
                met.Add("Home study completed");
            }
            else
            {
                unmet.Add("Home study must be completed");
            }

            // Hague Convention compliance
            if (GetAnswer(answers, "hagueCompliant") == "yes" || GetAnswer(answers, "agencyApproved") == "yes")
            {
                met.Add("Hague Convention compliance");
            }
        }

        private void EvaluateFamilyF1(Dictionary<string, string> answers, User? user,
            ref List<string> met, ref List<string> unmet)
        {
            // This is F1 immigrant (family preference), not F-1 student visa

            // Age check
            var age = CalculateAge(user?.DateOfBirth);
            if (age >= 21)
            {
                met.Add("21+ years old");
            }
            else
            {
                unmet.Add("Must be 21 or older");
                return;
            }

            // Unmarried
            var maritalStatus = user?.MaritalStatus ?? GetAnswer(answers, "maritalStatus");
            if (maritalStatus == "single" || maritalStatus == "unmarried")
            {
                met.Add("Unmarried");
            }
            else
            {
                unmet.Add("Must be unmarried");
                return;
            }

            // Parent is US citizen
            if (GetAnswer(answers, "parentIsUSCitizen") == "yes")
            {
                met.Add("Parent is US citizen");
            }
            else
            {
                unmet.Add("Parent must be US citizen");
                return;
            }

            // Wait time
            unmet.Add("Family First Preference: 7-8 year wait time");
        }

        private void EvaluateFamilyF2(Dictionary<string, string> answers, User? user, string visaCode,
            ref List<string> met, ref List<string> unmet)
        {
            // Petitioner is LPR
            if (GetAnswer(answers, "petitionerIsLPR") == "yes")
            {
                met.Add("Petitioner is lawful permanent resident");
            }
            else
            {
                unmet.Add("Petitioner must be lawful permanent resident");
                return;
            }

            // F2A vs F2B
            if (visaCode == "F-2A")
            {
                // Spouse or child under 21
                var relationship = GetAnswer(answers, "familyRelationship");
                if (relationship == "spouse")
                {
                    met.Add("Spouse of LPR");
                }
                else if (relationship == "child" || relationship == "child_minor")
                {
                    var age = CalculateAge(user?.DateOfBirth);
                    if (age < 21)
                    {
                        met.Add("Child under 21 of LPR");
                    }
                    else
                    {
                        unmet.Add("F-2A requires child under 21");
                    }
                }
                else
                {
                    unmet.Add("F-2A is for spouse or child under 21");
                }

                unmet.Add("Family Second Preference A: 2-3 year wait time");
            }
            else // F-2B
            {
                // Unmarried adult child of LPR
                var age = CalculateAge(user?.DateOfBirth);
                if (age >= 21)
                {
                    met.Add("21+ years old");
                }
                else
                {
                    unmet.Add("F-2B requires 21+ years");
                }

                var maritalStatus = user?.MaritalStatus ?? GetAnswer(answers, "maritalStatus");
                if (maritalStatus == "single" || maritalStatus == "unmarried")
                {
                    met.Add("Unmarried");
                }
                else
                {
                    unmet.Add("Must be unmarried");
                }

                unmet.Add("Family Second Preference B: 7-8 year wait time");
            }
        }

        private void EvaluateFamilyF3(Dictionary<string, string> answers, User? user,
            ref List<string> met, ref List<string> unmet)
        {
            // Married child of US citizen
            var maritalStatus = user?.MaritalStatus ?? GetAnswer(answers, "maritalStatus");
            if (maritalStatus == "married")
            {
                met.Add("Married");
            }
            else
            {
                unmet.Add("F-3 is for married children");
                return;
            }

            // Parent is US citizen
            if (GetAnswer(answers, "parentIsUSCitizen") == "yes")
            {
                met.Add("Parent is US citizen");
            }
            else
            {
                unmet.Add("Parent must be US citizen");
                return;
            }

            unmet.Add("Family Third Preference: 10-15 year wait time");
        }

        private void EvaluateFamilyF4(Dictionary<string, string> answers, User? user,
            ref List<string> met, ref List<string> unmet)
        {
            // Sibling of US citizen
            if (GetAnswer(answers, "familyRelationship") == "sibling")
            {
                met.Add("Sibling relationship");
            }
            else
            {
                unmet.Add("F-4 is for siblings");
                return;
            }

            // Sibling is US citizen and 21+
            if (GetAnswer(answers, "siblingIsUSCitizen") == "yes")
            {
                met.Add("Sibling is US citizen");
            }
            else
            {
                unmet.Add("Sibling must be US citizen");
                return;
            }

            if (GetAnswer(answers, "siblingAge") != null &&
                int.TryParse(GetAnswer(answers, "siblingAge"), out var age) && age >= 21)
            {
                met.Add("Sibling is 21+ years old");
            }
            else
            {
                unmet.Add("Sibling must be 21 or older");
            }

            unmet.Add("Family Fourth Preference: 15-20 year wait time");
        }

        #endregion

        #region Evaluation Methods - Employment Immigrant

        private void EvaluateEB1(Dictionary<string, string> answers, User? user, string visaCode,
            ref List<string> met, ref List<string> unmet)
        {
            // Purpose check
            if (GetAnswer(answers, "purpose") != "employment" && GetAnswer(answers, "purpose") != "immigration")
            {
                unmet.Add("EB-1 requires employment/immigration purpose");
                return;
            }

            // EB-1A: Extraordinary ability
            if (visaCode == "EB-1A" || visaCode == "EB-1")
            {
                if (GetAnswer(answers, "hasExtraordinaryAbility") == "yes")
                {
                    met.Add("Extraordinary ability");
                }
                else
                {
                    unmet.Add("EB-1A requires extraordinary ability");
                }

                // Count evidence criteria
                var criteriaCount = 0;
                if (GetAnswer(answers, "hasMajorAwards") == "yes") { met.Add("Major awards"); criteriaCount++; }
                if (GetAnswer(answers, "hasProfessionalMembership") == "yes") { met.Add("Professional membership"); criteriaCount++; }
                if (GetAnswer(answers, "hasPublishedMaterial") == "yes") { met.Add("Published material"); criteriaCount++; }
                if (GetAnswer(answers, "hasJudgedOthers") == "yes") { met.Add("Judged others' work"); criteriaCount++; }
                if (GetAnswer(answers, "hasOriginalContributions") == "yes") { met.Add("Original contributions"); criteriaCount++; }
                if (GetAnswer(answers, "hasScholarlyArticles") == "yes") { met.Add("Scholarly articles"); criteriaCount++; }
                if (GetAnswer(answers, "hasHighSalary") == "yes") { met.Add("High salary"); criteriaCount++; }
                if (GetAnswer(answers, "hasLeadershipRole") == "yes") { met.Add("Leadership role"); criteriaCount++; }

                if (criteriaCount >= 3)
                {
                    met.Add($"Meets {criteriaCount} of 8 evidence criteria");
                }
                else
                {
                    unmet.Add($"Only meets {criteriaCount} criteria, need 3+");
                }
            }

            // EB-1B: Outstanding researcher/professor
            if (visaCode == "EB-1B")
            {
                if (GetAnswer(answers, "hasOutstandingResearch") == "yes")
                {
                    met.Add("Outstanding research/teaching");
                }
                else
                {
                    unmet.Add("EB-1B requires outstanding research");
                }

                if (GetAnswer(answers, "yearsTeachingResearch") != null &&
                    int.TryParse(GetAnswer(answers, "yearsTeachingResearch"), out var years) && years >= 3)
                {
                    met.Add("3+ years teaching/research");
                }
                else
                {
                    unmet.Add("Requires 3+ years teaching/research");
                }

                if (GetAnswer(answers, "hasPermanentPosition") == "yes")
                {
                    met.Add("Permanent research position or tenure track");
                }
                else
                {
                    unmet.Add("Requires permanent position or tenure track offer");
                }
            }

            // EB-1C: Multinational manager/executive
            if (visaCode == "EB-1C")
            {
                if (GetAnswer(answers, "hasInternationalCompanyRelationship") == "yes")
                {
                    met.Add("Works for multinational company");
                }
                else
                {
                    unmet.Add("Must work for company with foreign affiliate");
                }

                if (GetAnswer(answers, "yearsWithCompany") != null &&
                    int.TryParse(GetAnswer(answers, "yearsWithCompany"), out var years) && years >= 1)
                {
                    met.Add("1+ years abroad with related company");
                }
                else
                {
                    unmet.Add("Requires 1+ year abroad in last 3 years");
                }

                if (GetAnswer(answers, "isManagerOrExecutive") == "yes")
                {
                    met.Add("Manager or executive role");
                }
                else
                {
                    unmet.Add("Requires manager or executive capacity");
                }
            }

            met.Add("Priority worker category (faster processing)");
        }

        private void EvaluateEB2(Dictionary<string, string> answers, User? user,
            ref List<string> met, ref List<string> unmet)
        {
            // Advanced degree OR exceptional ability
            var education = GetAnswer(answers, "educationLevel");
            var hasAdvancedDegree = education == "master" || education == "doctorate" || education == "professional";

            var hasBachelorPlus5Years = education == "bachelor" &&
                GetAnswer(answers, "yearsProgressiveExperience") != null &&
                int.TryParse(GetAnswer(answers, "yearsProgressiveExperience"), out var years) && years >= 5;

            if (hasAdvancedDegree)
            {
                met.Add("Advanced degree (Master's or higher)");
            }
            else if (hasBachelorPlus5Years)
            {
                met.Add("Bachelor's + 5 years progressive experience");
            }
            else if (GetAnswer(answers, "hasExceptionalAbility") == "yes")
            {
                met.Add("Exceptional ability in field");

                // Check for 3 of 6 criteria
                var criteriaCount = 0;
                if (GetAnswer(answers, "hasAcademicDegree") == "yes") criteriaCount++;
                if (GetAnswer(answers, "has10YearsExperience") == "yes") criteriaCount++;
                if (GetAnswer(answers, "hasProfessionalLicense") == "yes") criteriaCount++;
                if (GetAnswer(answers, "hasHighSalary") == "yes") criteriaCount++;
                if (GetAnswer(answers, "hasProfessionalAssociation") == "yes") criteriaCount++;
                if (GetAnswer(answers, "hasRecognitionFromPeers") == "yes") criteriaCount++;

                if (criteriaCount >= 3)
                {
                    met.Add($"Meets {criteriaCount} of 6 exceptional ability criteria");
                }
                else
                {
                    unmet.Add($"Only {criteriaCount} criteria, need 3+");
                }
            }
            else
            {
                unmet.Add("Requires advanced degree OR Bachelor's + 5 years OR exceptional ability");
            }

            // Job offer and labor certification (unless NIW)
            var hasNIW = GetAnswer(answers, "qualifiesForNIW") == "yes";
            if (hasNIW)
            {
                met.Add("National Interest Waiver (no job offer/labor cert required)");
            }
            else
            {
                if (GetAnswer(answers, "hasJobOffer") == "yes")
                {
                    met.Add("Job offer from US employer");
                }
                else
                {
                    unmet.Add("Requires job offer (unless NIW)");
                }

                if (GetAnswer(answers, "hasLaborCertification") == "yes" || GetAnswer(answers, "employerWillingToSponsor") == "yes")
                {
                    met.Add("PERM labor certification");
                }
                else
                {
                    unmet.Add("Requires PERM labor certification (unless NIW)");
                }
            }
        }

        private void EvaluateEB3(Dictionary<string, string> answers, User? user,
            ref List<string> met, ref List<string> unmet)
        {
            // Skilled worker, professional, or other worker
            var education = GetAnswer(answers, "educationLevel");
            var yearsExperience = GetAnswer(answers, "yearsExperience");

            if (education == "bachelor" || education == "master" || education == "doctorate")
            {
                met.Add("Professional (Bachelor's degree)");
            }
            else if (yearsExperience != null && int.TryParse(yearsExperience, out var years) && years >= 2)
            {
                met.Add("Skilled worker (2+ years training/experience)");
            }
            else
            {
                met.Add("Other worker (unskilled)");
                unmet.Add("Note: 'Other worker' category has longer wait times");
            }

            // Job offer required
            if (GetAnswer(answers, "hasJobOffer") == "yes")
            {
                met.Add("Job offer from US employer");
            }
            else
            {
                unmet.Add("Requires job offer");
            }

            // Labor certification
            if (GetAnswer(answers, "hasLaborCertification") == "yes" || GetAnswer(answers, "employerWillingToSponsor") == "yes")
            {
                met.Add("PERM labor certification");
            }
            else
            {
                unmet.Add("Requires PERM labor certification");
            }

            // Meets job requirements
            if (GetAnswer(answers, "meetsJobRequirements") == "yes")
            {
                met.Add("Meets job requirements");
            }
            else
            {
                unmet.Add("Must meet all job requirements");
            }
        }

        private void EvaluateEB4(Dictionary<string, string> answers, User? user,
            ref List<string> met, ref List<string> unmet)
        {
            // Special immigrant categories
            var eb4Category = GetAnswer(answers, "eb4Category");

            if (string.IsNullOrEmpty(eb4Category))
            {
                unmet.Add("Must specify EB-4 category");
                return;
            }

            switch (eb4Category)
            {
                case "religious_worker":
                    if (GetAnswer(answers, "hasReligiousWork2Years") == "yes")
                    {
                        met.Add("2+ years religious work");
                    }
                    else
                    {
                        unmet.Add("Requires 2+ years religious work");
                    }

                    if (GetAnswer(answers, "hasNonprofitOrganization") == "yes")
                    {
                        met.Add("Nonprofit religious organization");
                    }
                    else
                    {
                        unmet.Add("Must have nonprofit religious organization sponsor");
                    }
                    break;

                case "broadcaster":
                    met.Add("Broadcaster category");
                    if (GetAnswer(answers, "hasBroadcastExperience") != "yes")
                    {
                        unmet.Add("Must have broadcast experience");
                    }
                    break;

                case "iraqi_afghan_translator":
                    met.Add("Iraqi/Afghan translator");
                    if (GetAnswer(answers, "hasTranslatorService") != "yes")
                    {
                        unmet.Add("Must have served as translator");
                    }
                    break;

                case "international_organization":
                    met.Add("International organization employee");
                    if (GetAnswer(answers, "hasInternationalOrgExperience") != "yes")
                    {
                        unmet.Add("Must have worked for international organization");
                    }
                    break;

                default:
                    met.Add($"EB-4 category: {eb4Category}");
                    break;
            }
        }

        private void EvaluateEB5(Dictionary<string, string> answers, User? user,
            ref List<string> met, ref List<string> unmet)
        {
            // Investment amount
            var investment = GetAnswer(answers, "investmentAmount");
            if (investment == "eb5" || investment == "large")
            {
                met.Add("$800K+ investment (TEA) or $1.05M+ (standard)");
            }
            else
            {
                unmet.Add("Requires $800K (TEA) or $1.05M investment");
                return;
            }

            // Commercial enterprise
            if (GetAnswer(answers, "isCommercialEnterprise") == "yes")
            {
                met.Add("Investment in commercial enterprise");
            }
            else
            {
                unmet.Add("Must invest in commercial enterprise");
            }

            // Job creation
            if (GetAnswer(answers, "creates10Jobs") == "yes")
            {
                met.Add("Creates/preserves 10 full-time jobs");
            }
            else
            {
                unmet.Add("Must create or preserve 10 full-time US jobs");
            }

            // Active management
            if (GetAnswer(answers, "hasActiveManagement") == "yes")
            {
                met.Add("Active involvement in management");
            }
            else
            {
                unmet.Add("Must be actively involved in management");
            }

            // Lawful source of funds
            if (GetAnswer(answers, "hasLawfulFunds") == "yes")
            {
                met.Add("Lawful source of investment funds");
            }
            else
            {
                unmet.Add("Must document lawful source of funds");
            }
        }

        #endregion

        #region Evaluation Methods - Citizenship

        private void EvaluateN400(Dictionary<string, string> answers, User? user,
            ref List<string> met, ref List<string> unmet)
        {
            // Age requirement
            var age = CalculateAge(user?.DateOfBirth);
            if (age >= 18)
            {
                met.Add("18+ years old");
            }
            else
            {
                unmet.Add("Must be 18 or older");
                return;
            }

            // LPR status
            if (GetAnswer(answers, "currentStatus") == "permanent_resident" || GetAnswer(answers, "currentStatus") == "conditional_resident")
            {
                met.Add("Lawful permanent resident");
            }
            else
            {
                unmet.Add("Must be lawful permanent resident");
                return;
            }

            // Residency duration
            var marriedToUSCitizen = GetAnswer(answers, "marriedToUSCitizen") == "yes";
            var residencyYears = GetAnswer(answers, "residencyYears");
            var requiredYears = marriedToUSCitizen ? 3 : 5;

            if (residencyYears != null && int.TryParse(residencyYears, out var years) && years >= requiredYears)
            {
                met.Add($"{years}+ years as LPR (required: {requiredYears})");
            }
            else
            {
                unmet.Add($"Requires {requiredYears} years as LPR");
            }

            // Physical presence
            var physicalPresenceMonths = GetAnswer(answers, "physicalPresenceMonths");
            var requiredMonths = marriedToUSCitizen ? 18 : 30;

            if (physicalPresenceMonths != null && int.TryParse(physicalPresenceMonths, out var months) && months >= requiredMonths)
            {
                met.Add($"{months} months physical presence (required: {requiredMonths})");
            }
            else
            {
                unmet.Add($"Requires {requiredMonths} months physical presence");
            }

            // Continuous residence
            if (GetAnswer(answers, "continuousResidence") == "yes")
            {
                met.Add("Continuous residence maintained");
            }
            else
            {
                unmet.Add("Must maintain continuous residence");
            }

            // Good moral character
            if (GetAnswer(answers, "goodMoralCharacter") == "yes")
            {
                met.Add("Good moral character");
            }
            else
            {
                unmet.Add("Must demonstrate good moral character");
            }

            // English proficiency
            if (GetAnswer(answers, "englishProficient") == "yes")
            {
                met.Add("English proficiency");
            }
            else if (GetAnswer(answers, "englishProficient") == "exempt")
            {
                met.Add("English requirement exemption (age/disability)");
            }
            else
            {
                unmet.Add("Must demonstrate English proficiency (or qualify for exemption)");
            }

            // Civics knowledge
            if (GetAnswer(answers, "civicsKnowledge") == "yes")
            {
                met.Add("US history and civics knowledge");
            }
            else if (GetAnswer(answers, "civicsKnowledge") == "exempt")
            {
                met.Add("Civics requirement exemption (age/disability)");
            }
            else
            {
                unmet.Add("Must demonstrate US history and civics knowledge (or qualify for exemption)");
            }

            // Oath willingness
            if (GetAnswer(answers, "oathWillingness") == "yes")
            {
                met.Add("Willing to take Oath of Allegiance");
            }
            else if (GetAnswer(answers, "oathWillingness") == "religious_objection")
            {
                met.Add("Religious objection to oath (modified oath available)");
            }
            else
            {
                unmet.Add("Must be willing to take Oath of Allegiance");
            }

            // Criminal history check
            if (GetAnswer(answers, "criminalHistory") == "no" || GetAnswer(answers, "criminalHistory") == "minor")
            {
                met.Add("No disqualifying criminal history");
            }
            else
            {
                unmet.Add("Criminal history may affect eligibility");
            }

            // Tax compliance
            if (GetAnswer(answers, "taxCompliance") == "yes")
            {
                met.Add("Tax compliant");
            }
            else
            {
                unmet.Add("Must be tax compliant");
            }
        }

        private void EvaluateN600(Dictionary<string, string> answers, User? user,
            ref List<string> met, ref List<string> unmet)
        {
            // Derived or acquired citizenship
            if (GetAnswer(answers, "currentStatus") == "derived_citizen" ||
                GetAnswer(answers, "currentStatus") == "us_citizen_born_abroad")
            {
                met.Add("Potentially derived/acquired citizenship");
            }
            else
            {
                unmet.Add("N-600 is for those who derived/acquired citizenship");
                return;
            }

            // Parent is/was US citizen
            if (GetAnswer(answers, "parentUSCitizen") == "yes" || GetAnswer(answers, "parentUSCitizen") == "naturalized")
            {
                met.Add("Parent is/was US citizen");
            }
            else
            {
                unmet.Add("At least one parent must be/have been US citizen");
                return;
            }

            // Timing of parent's citizenship
            if (GetAnswer(answers, "under18WhenParentNaturalized") == "yes")
            {
                met.Add("Under 18 when parent became citizen");
            }
            else if (GetAnswer(answers, "under18WhenParentNaturalized") == "not_applicable")
            {
                met.Add("Parent was citizen at birth");
            }
            else
            {
                unmet.Add("Must have been under 18 when parent became citizen");
            }

            // Lawful permanent resident status
            if (GetAnswer(answers, "hasGreenCard") == "yes")
            {
                met.Add("Lawful permanent resident");
            }
            else
            {
                unmet.Add("Must be lawful permanent resident");
            }

            // Residing in US in legal/physical custody
            if (GetAnswer(answers, "residingInUSWithParent") == "yes")
            {
                met.Add("Residing in US in custody of citizen parent");
            }
            else
            {
                unmet.Add("Must be residing in US in legal/physical custody of citizen parent");
            }
        }

        #endregion

        #region Helper Methods

        private string GetAnswer(Dictionary<string, string> answers, string key)
        {
            return answers.TryGetValue(key, out var value) ? value : string.Empty;
        }

        private int CalculateAge(DateTime? dateOfBirth)
        {
            if (!dateOfBirth.HasValue) return 0;

            var today = DateTime.Today;
            var age = today.Year - dateOfBirth.Value.Year;
            if (dateOfBirth.Value.Date > today.AddYears(-age)) age--;
            return age;
        }

        private bool IsVWPCountry(string nationality)
        {
            // List of Visa Waiver Program countries
            var vwpCountries = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "Andorra", "Australia", "Austria", "Belgium", "Brunei", "Chile", "Croatia",
                "Czech Republic", "Denmark", "Estonia", "Finland", "France", "Germany",
                "Greece", "Hungary", "Iceland", "Ireland", "Israel", "Italy", "Japan",
                "Latvia", "Liechtenstein", "Lithuania", "Luxembourg", "Malta", "Monaco",
                "Netherlands", "New Zealand", "Norway", "Poland", "Portugal", "San Marino",
                "Singapore", "Slovakia", "Slovenia", "South Korea", "Spain", "Sweden",
                "Switzerland", "Taiwan", "United Kingdom",
                // Also check ISO codes
                "AD", "AU", "AT", "BE", "BN", "CL", "HR", "CZ", "DK", "EE", "FI", "FR",
                "DE", "GR", "HU", "IS", "IE", "IL", "IT", "JP", "LV", "LI", "LT", "LU",
                "MT", "MC", "NL", "NZ", "NO", "PL", "PT", "SM", "SG", "SK", "SI", "KR",
                "ES", "SE", "CH", "TW", "GB", "UK"
            };

            return vwpCountries.Contains(nationality);
        }

        private bool IsTreatyCountry(string nationality, string treatyType)
        {
            // Simplified - in production, this would check against a database
            // E-1 and E-2 treaty countries overlap but aren't identical
            var treatyCountries = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "Argentina", "Australia", "Austria", "Belgium", "Canada", "Chile",
                "Colombia", "Costa Rica", "Croatia", "Denmark", "Estonia", "Finland",
                "France", "Germany", "Greece", "Honduras", "Ireland", "Israel", "Italy",
                "Japan", "Jordan", "Latvia", "Liberia", "Luxembourg", "Mexico", "Netherlands",
                "Norway", "Oman", "Pakistan", "Paraguay", "Philippines", "Poland", "Singapore",
                "Slovenia", "South Korea", "Spain", "Suriname", "Sweden", "Switzerland",
                "Thailand", "Togo", "Turkey", "United Kingdom", "Yugoslavia"
            };

            return treatyCountries.Contains(nationality);
        }

        #endregion
    }
}

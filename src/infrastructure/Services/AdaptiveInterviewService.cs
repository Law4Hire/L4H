using L4H.Infrastructure.Entities;
using L4H.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace L4H.Infrastructure.Services;

public interface IAdaptiveInterviewService
{
    Task<InterviewQuestion> GetNextQuestionAsync(Dictionary<string, string> answers, User? user = null);
    Task<RecommendationResult> GetRecommendationAsync(Dictionary<string, string> answers, User? user = null);
    Task<bool> IsCompleteAsync(Dictionary<string, string> answers, User? user = null);
}

public class InterviewQuestion
{
    public string Key { get; set; } = string.Empty;
    public string Question { get; set; } = string.Empty;
    public string Type { get; set; } = "select"; // select, radio, text
    public List<InterviewOption> Options { get; set; } = new();
    public bool Required { get; set; } = true;
    public int RemainingVisaTypes { get; set; }
}

public class InterviewOption
{
    public string Value { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}

public class AdaptiveInterviewService : IAdaptiveInterviewService
{
    private readonly L4HDbContext _context;
    private readonly ILogger<AdaptiveInterviewService> _logger;

    public AdaptiveInterviewService(L4HDbContext context, ILogger<AdaptiveInterviewService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<InterviewQuestion> GetNextQuestionAsync(Dictionary<string, string> answers, User? user = null)
    {
        // Merge user profile data with interview answers
        var enrichedAnswers = EnrichAnswersWithUserData(answers, user);

        // Get remaining possible visa types based on current answers
        var possibleVisaTypes = await GetPossibleVisaTypesAsync(enrichedAnswers).ConfigureAwait(false);

        _logger.LogInformation($"Current answers: {string.Join(", ", answers.Select(kvp => $"{kvp.Key}={kvp.Value}"))}");
        _logger.LogInformation($"Remaining visa types: {possibleVisaTypes.Count}");

        // If only one visa type remains, we're done
        if (possibleVisaTypes.Count <= 1)
        {
            return new InterviewQuestion
            {
                Key = "complete",
                Question = "Interview Complete",
                RemainingVisaTypes = possibleVisaTypes.Count
            };
        }

        // Check for early completion - if a specific visa type has all required criteria
        if (CheckForEarlyCompletion(enrichedAnswers, possibleVisaTypes))
        {
            return new InterviewQuestion
            {
                Key = "complete",
                Question = "Interview Complete - Criteria Met",
                RemainingVisaTypes = possibleVisaTypes.Count
            };
        }

        // Determine the best question to narrow down the remaining visa types
        return await GetBestDiscriminatingQuestionAsync(possibleVisaTypes, enrichedAnswers).ConfigureAwait(false);
    }

    public async Task<bool> IsCompleteAsync(Dictionary<string, string> answers, User? user = null)
    {
        // If no answers provided yet, interview is definitely not complete
        if (answers == null || answers.Count == 0)
        {
            return false;
        }

        // Must at least have answered the purpose question to be potentially complete
        if (!answers.ContainsKey("purpose"))
        {
            return false;
        }

        var enrichedAnswers = EnrichAnswersWithUserData(answers, user);
        var possibleVisaTypes = await GetPossibleVisaTypesAsync(enrichedAnswers).ConfigureAwait(false);
        var purpose = enrichedAnswers.GetValueOrDefault("purpose", "");

        // Check for early completion - if a specific visa type has all required criteria
        if (CheckForEarlyCompletion(enrichedAnswers, possibleVisaTypes))
        {
            return true;
        }

        // Force completion when we have 2 or fewer visa types for diplomatic cases
        if (possibleVisaTypes.Count <= 2 && (purpose == "diplomatic" || purpose == "official" || purpose == "employment"))
        {
            return true;
        }

        // Force completion when we have 2 or fewer visa types for transit cases
        if (possibleVisaTypes.Count <= 2 && purpose == "transit")
        {
            return true;
        }

        // Force completion when we have 2 or fewer visa types for immigration cases
        if (possibleVisaTypes.Count <= 2 && purpose == "immigration")
        {
            return true;
        }

        return possibleVisaTypes.Count <= 1;
    }

    public async Task<RecommendationResult> GetRecommendationAsync(Dictionary<string, string> answers, User? user = null)
    {
        var enrichedAnswers = EnrichAnswersWithUserData(answers, user);
        var possibleVisaTypes = await GetPossibleVisaTypesAsync(enrichedAnswers).ConfigureAwait(false);

        if (possibleVisaTypes.Count == 0)
        {
            // Fallback to B-2 Tourist if no match
            var b2 = await _context.VisaTypes.FirstOrDefaultAsync(v => v.Code == "B-2").ConfigureAwait(false);
            return new RecommendationResult
            {
                VisaTypeId = b2?.Id ?? 1,
                Rationale = "Based on your answers, a B-2 Tourist Visa may be most appropriate. Please consult with an immigration attorney for personalized advice."
            };
        }

        var recommendedVisa = SelectBestVisaType(possibleVisaTypes, enrichedAnswers);
        var rationale = GenerateRationale(recommendedVisa, enrichedAnswers);

        return new RecommendationResult
        {
            VisaTypeId = recommendedVisa.Id,
            Rationale = rationale
        };
    }

    private async Task<List<VisaType>> GetPossibleVisaTypesAsync(Dictionary<string, string> answers)
    {
        var allVisaTypes = await _context.VisaTypes.Where(v => v.IsActive).ToListAsync().ConfigureAwait(false);

        // Apply filtering rules based on answers
        return allVisaTypes.Where(visa => IsVisaTypePossible(visa, answers)).ToList();
    }

    private static bool IsVisaTypePossible(VisaType visa, Dictionary<string, string> answers)
    {
        var purpose = answers.GetValueOrDefault("purpose", "").ToLowerInvariant();
        var employerSponsor = answers.GetValueOrDefault("employerSponsor", "").ToLowerInvariant();
        var isGovernmentOfficial = answers.GetValueOrDefault("governmentOfficial", "").ToLowerInvariant();
        var isDiplomat = answers.GetValueOrDefault("diplomat", "").ToLowerInvariant();
        var educationLevel = answers.GetValueOrDefault("educationLevel", "").ToLowerInvariant();
        var workExperience = answers.GetValueOrDefault("workExperience", "").ToLowerInvariant();
        var nationality = answers.GetValueOrDefault("nationality", "").ToLowerInvariant();
        var hasJobOffer = answers.GetValueOrDefault("hasJobOffer", "").ToLowerInvariant();
        var isStudent = answers.GetValueOrDefault("isStudent", "").ToLowerInvariant();
        var studyLevel = answers.GetValueOrDefault("studyLevel", "").ToLowerInvariant();
        var isInvestor = answers.GetValueOrDefault("isInvestor", "").ToLowerInvariant();
        var investmentAmount = answers.GetValueOrDefault("investmentAmount", "").ToLowerInvariant();
        var internationalOrg = answers.GetValueOrDefault("internationalOrg", "").ToLowerInvariant();

        // Diplomatic visas (A-1, A-2, A-3)
        if (visa.Code.StartsWith("A-"))
        {
            // If purpose is diplomatic/official, keep A visas possible until we ask specific questions
            if (purpose == "diplomatic" || purpose == "official")
            {
                if (visa.Code == "A-1")
                {
                    // A-1 requires diplomatic status AND government official AND NOT international org
                    if (!answers.ContainsKey("diplomat") || !answers.ContainsKey("governmentOfficial") || !answers.ContainsKey("internationalOrg"))
                        return true;
                    return isDiplomat == "yes" && isGovernmentOfficial == "yes" && internationalOrg == "no";
                }
                if (visa.Code == "A-2")
                {
                    // A-2 requires government official status but NOT diplomat AND NOT international org AND NOT working for diplomat
                    if (!answers.ContainsKey("governmentOfficial") || !answers.ContainsKey("diplomat") || !answers.ContainsKey("internationalOrg"))
                        return true;
                    var workingForDiplomat = answers.GetValueOrDefault("workingForDiplomat", "").ToLowerInvariant();

                    // Must check workingForDiplomat if answered - A-2s don't work for other diplomats
                    if (answers.ContainsKey("workingForDiplomat") && workingForDiplomat == "yes")
                        return false;

                    return isGovernmentOfficial == "yes" && isDiplomat == "no" && internationalOrg == "no";
                }
                if (visa.Code == "A-3")
                {
                    // A-3 requires diplomatic purpose AND working for diplomat AND NOT being a diplomat/official yourself AND NOT international org
                    if (!answers.ContainsKey("purpose"))
                        return true;
                    if (purpose != "diplomatic")
                        return false;
                    if (!answers.ContainsKey("workingForDiplomat") || !answers.ContainsKey("diplomat") || !answers.ContainsKey("governmentOfficial"))
                        return true;

                    // Must check internationalOrg if answered - A-3s are not for international organizations
                    if (answers.ContainsKey("internationalOrg") && internationalOrg == "yes")
                        return false;

                    return answers.GetValueOrDefault("workingForDiplomat") == "yes" && isDiplomat == "no" && isGovernmentOfficial == "no";
                }
            }
            return false;
        }

        // International Organization visas (G-1, G-2, G-3, G-4, G-5)
        if (visa.Code.StartsWith("G-"))
        {
            // G visas can be for diplomatic or official purposes with international organizations
            if (purpose == "diplomatic" || purpose == "official" || purpose == "employment")
            {
                if (visa.Code == "G-1")
                {
                    // G-1 requires international org AND working for international org AND employment purpose
                    if (!answers.ContainsKey("internationalOrg"))
                        return true;
                    if (internationalOrg == "no")
                        return false;
                    if (!answers.ContainsKey("workingForInternationalOrg"))
                        return true;
                    if (!answers.ContainsKey("purpose"))
                        return true;
                    return internationalOrg == "yes" && answers.GetValueOrDefault("workingForInternationalOrg") == "yes" && purpose == "employment";
                }
                if (visa.Code == "G-2")
                {
                    // G-2 requires international org AND working for international org AND official purpose AND NOT diplomat AND NOT government official
                    if (!answers.ContainsKey("internationalOrg"))
                        return true;
                    if (internationalOrg == "no")
                        return false;
                    if (!answers.ContainsKey("workingForInternationalOrg"))
                        return true;
                    if (!answers.ContainsKey("purpose"))
                        return true;

                    // Must check diplomat and government official to differentiate from A-visas
                    if (answers.ContainsKey("diplomat") && answers.GetValueOrDefault("diplomat", "").ToLowerInvariant() == "yes")
                        return false;
                    if (answers.ContainsKey("governmentOfficial") && answers.GetValueOrDefault("governmentOfficial", "").ToLowerInvariant() == "yes")
                        return false;

                    return internationalOrg == "yes" && answers.GetValueOrDefault("workingForInternationalOrg") == "yes" && purpose == "official";
                }
                if (visa.Code == "G-3")
                {
                    // G-3 requires working for international org - if not asked yet, keep possible
                    if (!answers.ContainsKey("workingForInternationalOrg"))
                        return true;
                    return answers["workingForInternationalOrg"] == "yes";
                }
                if (visa.Code == "G-4")
                {
                    // G-4 requires international org status - if not asked yet, keep possible
                    if (!answers.ContainsKey("internationalOrg"))
                        return true;
                    if (internationalOrg == "no")
                        return false;
                    return internationalOrg == "yes";
                }
                if (visa.Code == "G-5")
                {
                    // G-5 requires working for G-4 holder AND international org context
                    if (!answers.ContainsKey("internationalOrg"))
                        return true;
                    if (internationalOrg == "no")
                        return false;
                    if (!answers.ContainsKey("workingForG4"))
                        return true;
                    return internationalOrg == "yes" && answers["workingForG4"] == "yes";
                }
            }
            return false;
        }

        // Family-based visas (need to handle first since they often take priority)
        if (purpose == "family")
        {
            var familyRelationship = answers.GetValueOrDefault("familyRelationship", "").ToLowerInvariant();
            var usFamilyStatus = answers.GetValueOrDefault("usFamilyStatus", "").ToLowerInvariant();

            // K-1 Fiancé(e) visa
            if (visa.Code == "K-1") return familyRelationship == "fiance" && usFamilyStatus == "citizen";

            // CR-1/IR-1 Spouse of U.S. citizen (immediate relative)
            if (visa.Code == "CR-1" || visa.Code == "IR-1") return familyRelationship == "spouse" && usFamilyStatus == "citizen";

            // F2A Spouse of permanent resident
            if (visa.Code == "F-2A") return familyRelationship == "spouse" && usFamilyStatus == "permanent_resident";

            // IR-2/IR-5 Parent/Child of U.S. citizen
            if (visa.Code == "IR-2" || visa.Code == "IR-5") return (familyRelationship == "parent" || familyRelationship == "child") && usFamilyStatus == "citizen";

            // F-1, F-2, F-3, F-4 Family Preference Categories
            if (visa.Code.StartsWith("F-")) return true; // Allow all family preference categories

            // ONLY family-based visas are possible when purpose is family
            // This excludes ALL employment, investment, tourist, student, etc. visas
            return visa.Code.StartsWith("K-") || visa.Code.StartsWith("IR-") || visa.Code.StartsWith("CR-") ||
                   visa.Code.StartsWith("F-") || visa.Code.Contains("Family");
        }

        // Tourism purpose - ONLY tourism/visitor visas are possible
        if (purpose == "tourism" || purpose == "visit" || purpose == "medical")
        {
            return visa.Code == "B-2" || visa.Code.Contains("Tourist") || visa.Code.Contains("Visitor");
        }

        // Business purpose - ONLY business visitor visas (without employment)
        if (purpose == "business")
        {
            return visa.Code == "B-1" || (visa.Code.Contains("Business") && employerSponsor != "yes");
        }

        // Study purpose - ONLY student visas are possible
        if (purpose == "study")
        {
            return visa.Code == "F-1" || visa.Code == "M-1" || visa.Code == "J-1" ||
                   visa.Code.Contains("Student") || visa.Code.Contains("Study");
        }

        // Investment purpose - ONLY investment visas are possible
        if (purpose == "investment")
        {
            return visa.Code == "EB-5" || visa.Code == "E-1" || visa.Code == "E-2" ||
                   visa.Code.Contains("Investor") || visa.Code.Contains("Investment");
        }

        // Diplomatic/Official purpose - ONLY diplomatic visas are possible
        if (purpose == "diplomatic" || purpose == "official")
        {
            return visa.Code.StartsWith("A-") || visa.Code.Contains("Diplomatic") || visa.Code.Contains("Official");
        }

        // Transit purpose - ONLY transit visas are possible
        if (purpose == "transit")
        {
            return visa.Code.StartsWith("C-") || visa.Code.Contains("Transit");
        }

        // Exchange purpose - ONLY exchange visas are possible
        if (purpose == "exchange")
        {
            return visa.Code == "J-1" || visa.Code.Contains("Exchange");
        }

        // === Enhanced B/C Series Visa Logic ===

        // B-1: Business Visitor - Enhanced logic
        if (visa.Code == "B-1")
        {
            return purpose == "business" && employerSponsor != "yes";
        }

        // B-2: Tourist Visitor - Enhanced logic
        if (visa.Code == "B-2")
        {
            return purpose == "tourism" || purpose == "visit" || purpose == "medical";
        }

        // C-1: Transit - Enhanced logic (general transit, not government/UN/crew)
        if (visa.Code == "C-1")
        {
            return purpose == "transit" && isGovernmentOfficial != "yes" && internationalOrg != "yes" &&
                   answers.GetValueOrDefault("isUNRelated", "") != "yes" && answers.GetValueOrDefault("crewMember", "") != "yes";
        }

        // C-2: Transit to UN - Enhanced logic (UN-specific transit)
        if (visa.Code == "C-2")
        {
            return purpose == "transit" && answers.GetValueOrDefault("isUNRelated", "") == "yes";
        }

        // C-3: Foreign Government Transit - Enhanced logic (government officials in transit)
        if (visa.Code == "C-3")
        {
            return purpose == "transit" && isGovernmentOfficial == "yes";
        }

        // Legacy catch-all for other C- visas
        if (visa.Code.StartsWith("C-")) return purpose == "transit";

        // Crew visas (D)
        if (visa.Code == "D") return purpose == "crew" || answers.GetValueOrDefault("isCrew", "") == "yes";

        // Student visas (F-1, M-1, J-1)
        if (visa.Code == "F-1") return isStudent == "yes" && studyLevel == "academic";
        if (visa.Code == "M-1") return isStudent == "yes" && studyLevel == "vocational";
        if (visa.Code == "J-1") return purpose == "exchange" || answers.GetValueOrDefault("exchangeProgram", "") == "yes";

        // Employment purpose - ONLY employment-based visas are possible
        if (purpose == "employment")
        {
            // ONLY employment-based visas are possible when purpose is employment
            // NOTE: E-1/E-2 are business visas, not employment visas
            bool isEmploymentVisa = visa.Code.StartsWith("H-") || visa.Code.StartsWith("L-") || visa.Code.StartsWith("O-") ||
                   visa.Code.StartsWith("P-") || visa.Code.StartsWith("EB-") || visa.Code == "E-3" ||
                   visa.Code == "D" || visa.Code.Contains("Work") || visa.Code.Contains("Employment");

            if (!isEmploymentVisa) return false;

            // Work visas require employer sponsorship, but only filter out if we have that answer
            if (visa.Code.StartsWith("H-") || visa.Code.StartsWith("L-") || visa.Code.StartsWith("O-") || visa.Code.StartsWith("P-") ||
                visa.Code.StartsWith("EB-") || visa.Code == "E-3")
            {
                // Only filter based on sponsorship if we have an answer to this question
                if (answers.ContainsKey("employerSponsor") || answers.ContainsKey("hasJobOffer"))
                {
                    if (employerSponsor != "yes" && hasJobOffer != "yes") return false;
                }
                // If we don't have sponsorship info yet, keep the visa as possible
            }

            // Don't return true here - let specific visa checks below handle the detailed filtering
            // This allows specific visa requirements (like O-1 extraordinary ability) to be enforced
        }

        // Work visas require employer sponsorship (legacy check for non-employment purposes)
        if (visa.Code.StartsWith("H-") || visa.Code.StartsWith("L-") || visa.Code.StartsWith("O-") || visa.Code.StartsWith("P-"))
        {
            if (employerSponsor != "yes" && hasJobOffer != "yes") return false;
        }

        // H-1B: Specialty occupation
        if (visa.Code == "H-1B")
        {
            return purpose == "employment" && employerSponsor == "yes" &&
                   (educationLevel == "bachelor" || educationLevel == "master" || educationLevel == "phd");
        }

        // H-2A/H-2B: Temporary agricultural/non-agricultural workers
        if (visa.Code == "H-2A") return purpose == "employment" && answers.GetValueOrDefault("workType", "") == "agricultural";
        if (visa.Code == "H-2B") return purpose == "employment" && answers.GetValueOrDefault("workType", "") == "seasonal";

        // L-1: Intracompany transferee
        if (visa.Code == "L-1")
        {
            return purpose == "employment" && employerSponsor == "yes" &&
                   answers.GetValueOrDefault("sameCompany", "") == "yes";
        }

        // O-1: Extraordinary ability
        if (visa.Code == "O-1")
        {
            return purpose == "employment" && employerSponsor == "yes" &&
                   answers.GetValueOrDefault("extraordinaryAbility", "") == "yes";
        }

        // Investment visas (EB-5, E-1, E-2)
        if (visa.Code == "EB-5")
        {
            return isInvestor == "yes" &&
                   (investmentAmount == "500000+" || investmentAmount == "1000000+");
        }

        // C-1/D: Crewmember (Transit/Crew member combination visa)
        if (visa.Code == "C-1/D")
        {
            return purpose == "transit" && answers.GetValueOrDefault("crewMember", "") == "yes";
        }

        // D: Crew member
        if (visa.Code == "D")
        {
            return purpose == "employment" && answers.GetValueOrDefault("crewMember", "") == "yes" &&
                   answers.GetValueOrDefault("shipOrAircraft", "") == "yes";
        }

        // Diversity: Diversity Visa Lottery
        if (visa.Code == "Diversity")
        {
            return purpose == "immigration" && answers.GetValueOrDefault("diversityLottery", "") == "yes";
        }

        // E-1: Treaty Trader
        if (visa.Code == "E-1")
        {
            // If purpose is business, keep E-1 possible until we've asked treaty-specific questions
            if (purpose == "business")
            {
                var treatyCountry = answers.GetValueOrDefault("treatyCountry", "");
                var tradeActivity = answers.GetValueOrDefault("tradeActivity", "");

                // If we haven't asked treatyCountry yet, keep E-1 possible
                if (!answers.ContainsKey("treatyCountry"))
                {
                    return true;
                }

                // If treatyCountry is no, E-1 is not possible
                if (treatyCountry == "no")
                {
                    return false;
                }

                // If treatyCountry is yes but we haven't asked tradeActivity yet, keep E-1 possible
                if (treatyCountry == "yes" && !answers.ContainsKey("tradeActivity"))
                {
                    return true;
                }

                // If we have both answers, apply full criteria
                return treatyCountry == "yes" && tradeActivity == "yes";
            }

            return false;
        }

        // E-2: Treaty Investor
        if (visa.Code == "E-2")
        {
            // If purpose is business, keep E-2 possible until we've asked treaty-specific questions
            if (purpose == "business")
            {
                var treatyCountry = answers.GetValueOrDefault("treatyCountry", "");
                var investment = answers.GetValueOrDefault("investment", "");

                // If we haven't asked treatyCountry yet, keep E-2 possible
                if (!answers.ContainsKey("treatyCountry"))
                {
                    return true;
                }

                // If treatyCountry is no, E-2 is not possible
                if (treatyCountry == "no")
                {
                    return false;
                }

                // If treatyCountry is yes but we haven't asked investment yet, keep E-2 possible
                if (treatyCountry == "yes" && !answers.ContainsKey("investment"))
                {
                    return true;
                }

                // If we have both answers, apply full criteria
                return treatyCountry == "yes" && investment == "yes";
            }

            return false;
        }

        // E-3: Australian Specialty Occupation
        if (visa.Code == "E-3")
        {
            return purpose == "employment" && answers.GetValueOrDefault("employerSponsor", "") == "yes" &&
                   answers.GetValueOrDefault("australian", "") == "yes" &&
                   answers.GetValueOrDefault("specialtyOccupation", "") == "yes";
        }

        // EB-1: Priority Workers (immigrant)
        if (visa.Code == "EB-1")
        {
            return purpose == "immigration" && answers.GetValueOrDefault("priorityWorker", "") == "yes" &&
                   answers.GetValueOrDefault("extraordinaryAbility", "") == "yes";
        }

        // EB-2: Advanced Degree Professionals (immigrant)
        if (visa.Code == "EB-2")
        {
            return purpose == "immigration" && answers.GetValueOrDefault("advancedDegree", "") == "yes" &&
                   answers.GetValueOrDefault("professionalWorker", "") == "yes";
        }

        // EB-3: Skilled Workers (immigrant)
        if (visa.Code == "EB-3")
        {
            return purpose == "immigration" && answers.GetValueOrDefault("skilledWorker", "") == "yes" &&
                   answers.GetValueOrDefault("laborCertification", "") == "yes";
        }

        // EB-4: Special Immigrants
        if (visa.Code == "EB-4")
        {
            return purpose == "immigration" && answers.GetValueOrDefault("specialImmigrant", "") == "yes" &&
                   answers.GetValueOrDefault("religiousWorker", "") == "yes";
        }

        // For employment-based visas, allow them through if purpose is employment
        // The specific filtering happens in the individual visa checks above
        if (purpose == "employment")
        {
            bool isEmploymentVisa = visa.Code.StartsWith("H-") || visa.Code.StartsWith("L-") || visa.Code.StartsWith("O-") ||
                   visa.Code.StartsWith("P-") || visa.Code.StartsWith("EB-") || visa.Code.StartsWith("E-") ||
                   visa.Code == "D" || visa.Code.Contains("Work") || visa.Code.Contains("Employment");

            if (isEmploymentVisa)
            {
                // Allow employment visas to pass through - specific filtering happens above
                return true;
            }
        }

        // Default: allow if no specific rules exclude it (for non-employment visas)
        return true;
    }

    private static bool CheckForEarlyCompletion(Dictionary<string, string> answers, List<VisaType> possibleVisaTypes)
    {
        var purpose = answers.GetValueOrDefault("purpose", "");
        var isDiplomat = answers.GetValueOrDefault("diplomat", "").ToLowerInvariant();
        var isGovernmentOfficial = answers.GetValueOrDefault("governmentOfficial", "").ToLowerInvariant();
        var internationalOrg = answers.GetValueOrDefault("internationalOrg", "").ToLowerInvariant();
        var workingForDiplomat = answers.GetValueOrDefault("workingForDiplomat", "").ToLowerInvariant();
        var workingForInternationalOrg = answers.GetValueOrDefault("workingForInternationalOrg", "").ToLowerInvariant();

        // PRIORITY COMPLETION CHECKS FIRST - Handle new visa types that need early completion

        // Check D visa completion criteria (employment purpose, crew member, ship/aircraft) - HIGHEST PRIORITY
        if (purpose == "employment" && answers.GetValueOrDefault("crewMember", "") == "yes" &&
            answers.GetValueOrDefault("shipOrAircraft", "") == "yes")
        {
            // D visa has all required answers - force completion if D is in possible types
            if (possibleVisaTypes.Any(v => v.Code == "D"))
            {
                return true;
            }
        }

        // Check C-1/D visa completion criteria (transit purpose, crew member) - HIGH PRIORITY
        if (purpose == "transit" && answers.GetValueOrDefault("crewMember", "") == "yes")
        {
            // C-1/D visa has all required answers - force completion if C-1/D is in possible types
            if (possibleVisaTypes.Any(v => v.Code == "C-1/D"))
            {
                return true;
            }
        }

        // Aggressive completion for diplomatic visas - if we have enough info to determine visa type uniquely

        // Check A-2 completion criteria (official purpose, government official, not diplomat, not international org, not working for diplomat)
        if (purpose == "official" && isDiplomat == "no" && isGovernmentOfficial == "yes" && internationalOrg == "no" && workingForDiplomat == "no")
        {
            // A-2 has all required answers - force completion if A-2 is in possible types
            if (possibleVisaTypes.Any(v => v.Code == "A-2"))
            {
                return true;
            }
        }

        // Check A-3 completion criteria (diplomatic purpose, not diplomat, not government official, not international org, working for diplomat)
        if (purpose == "diplomatic" && isDiplomat == "no" && isGovernmentOfficial == "no" && internationalOrg == "no" && workingForDiplomat == "yes")
        {
            // A-3 has all required answers - force completion if A-3 is in possible types
            if (possibleVisaTypes.Any(v => v.Code == "A-3"))
            {
                return true;
            }
        }

        // Check G-1 completion criteria (employment/diplomatic/official purpose, international org, working for international org)
        if ((purpose == "employment" || purpose == "diplomatic" || purpose == "official") && internationalOrg == "yes" && workingForInternationalOrg == "yes")
        {
            // G-1 has all required answers - force completion if G-1 is in possible types
            if (possibleVisaTypes.Any(v => v.Code == "G-1"))
            {
                return true;
            }
        }

        // Check G-2 completion criteria (official/diplomatic purpose, international org, working for international org, not diplomat, not government official)
        if ((purpose == "official" || purpose == "diplomatic") && internationalOrg == "yes" && workingForInternationalOrg == "yes" && isDiplomat == "no" && isGovernmentOfficial == "no")
        {
            // G-2 has all required answers - force completion if G-2 is in possible types
            if (possibleVisaTypes.Any(v => v.Code == "G-2"))
            {
                return true;
            }
        }

        // === B/C SERIES VISA EARLY COMPLETION LOGIC ===

        var employerSponsor = answers.GetValueOrDefault("employerSponsor", "");

        // Check B-1 completion criteria (business purpose, no employer sponsor)
        // IMPORTANT: For business purposes, we must check E-1/E-2 eligibility first before settling on B-1
        if (purpose == "business" && employerSponsor == "no")
        {
            // Only complete with B-1 if we've already eliminated E-1/E-2 by checking business-specific questions
            var treatyCountry = answers.GetValueOrDefault("treatyCountry", "");
            var hasCheckedTreatyCountry = answers.ContainsKey("treatyCountry");

            // If we haven't asked treatyCountry yet, don't complete - need to check E-1/E-2 eligibility first
            if (!hasCheckedTreatyCountry)
            {
                return false;
            }

            // If treatyCountry is "no", then E-1/E-2 are not possible, so B-1 is appropriate
            // If treatyCountry is "yes" but neither tradeActivity nor investment is "yes", then B-1 is appropriate
            if (treatyCountry == "no" ||
                (treatyCountry == "yes" && answers.GetValueOrDefault("tradeActivity", "") != "yes" && answers.GetValueOrDefault("investment", "") != "yes"))
            {
                if (possibleVisaTypes.Any(v => v.Code == "B-1"))
                {
                    return true;
                }
            }
        }

        // Check B-2 completion criteria (tourism/visit/medical purpose)
        if (purpose == "tourism" || purpose == "visit" || purpose == "medical")
        {
            if (possibleVisaTypes.Any(v => v.Code == "B-2"))
            {
                return true;
            }
        }

        // === NEW VISA TYPES EARLY COMPLETION LOGIC (CHECK FIRST) ===

        // Check C-1/D completion criteria (transit purpose, crew member) - CHECK BEFORE C-1!
        if (purpose == "transit" && answers.GetValueOrDefault("crewMember", "") == "yes")
        {
            if (possibleVisaTypes.Any(v => v.Code == "C-1/D"))
            {
                return true;
            }
        }

        // Check C-1 completion criteria (transit purpose, not government official, not international org, and NOT UN-related)
        if (purpose == "transit" && isGovernmentOfficial == "no" && internationalOrg == "no")
        {
            // Only complete with C-1 if we've asked about UN relationship and it's not yes
            // This ensures we don't complete prematurely when C-2 is also possible
            var isUNRelatedAnswered = answers.ContainsKey("isUNRelated");
            var isUNRelatedValue = answers.GetValueOrDefault("isUNRelated", "");

            if (isUNRelatedAnswered && isUNRelatedValue != "yes" && possibleVisaTypes.Any(v => v.Code == "C-1"))
            {
                return true;
            }

            // If isUNRelated hasn't been asked yet and both C-1 and C-2 are possible, don't complete yet
            if (!isUNRelatedAnswered && possibleVisaTypes.Any(v => v.Code == "C-1") && possibleVisaTypes.Any(v => v.Code == "C-2"))
            {
                return false;
            }

            // If only C-1 is possible (C-2 already filtered out), complete with C-1
            if (possibleVisaTypes.Any(v => v.Code == "C-1") && !possibleVisaTypes.Any(v => v.Code == "C-2"))
            {
                return true;
            }
        }

        // Check C-2 completion criteria (transit purpose, UN-related)
        var isUNRelated = answers.GetValueOrDefault("isUNRelated", "");
        if (purpose == "transit" && isUNRelated == "yes")
        {
            if (possibleVisaTypes.Any(v => v.Code == "C-2"))
            {
                return true;
            }
        }

        // Check C-3 completion criteria (transit purpose, government official)
        if (purpose == "transit" && isGovernmentOfficial == "yes")
        {
            if (possibleVisaTypes.Any(v => v.Code == "C-3"))
            {
                return true;
            }
        }

        // Check D completion criteria (employment purpose, crew member, ship/aircraft)
        if (purpose == "employment" && answers.GetValueOrDefault("crewMember", "") == "yes" &&
            answers.GetValueOrDefault("shipOrAircraft", "") == "yes")
        {
            if (possibleVisaTypes.Any(v => v.Code == "D"))
            {
                return true;
            }
        }

        // Check Diversity completion criteria (immigration purpose, diversity lottery)
        if (purpose == "immigration" && answers.GetValueOrDefault("diversityLottery", "") == "yes")
        {
            if (possibleVisaTypes.Any(v => v.Code == "Diversity"))
            {
                return true;
            }
        }

        // Check E-1 completion criteria (business purpose, treaty country, trade activity)
        if (purpose == "business" && answers.GetValueOrDefault("treatyCountry", "") == "yes" &&
            answers.GetValueOrDefault("tradeActivity", "") == "yes")
        {
            if (possibleVisaTypes.Any(v => v.Code == "E-1"))
            {
                return true;
            }
        }

        // Check E-2 completion criteria (business purpose, treaty country, investment)
        if (purpose == "business" && answers.GetValueOrDefault("treatyCountry", "") == "yes" &&
            answers.GetValueOrDefault("investment", "") == "yes")
        {
            if (possibleVisaTypes.Any(v => v.Code == "E-2"))
            {
                return true;
            }
        }

        // Check E-3 completion criteria (employment purpose, Australian, specialty occupation)
        if (purpose == "employment" && answers.GetValueOrDefault("australian", "") == "yes" &&
            answers.GetValueOrDefault("specialtyOccupation", "") == "yes")
        {
            if (possibleVisaTypes.Any(v => v.Code == "E-3"))
            {
                return true;
            }
        }

        // Check EB-1 completion criteria (immigration purpose, priority worker, extraordinary ability)
        if (purpose == "immigration" && answers.GetValueOrDefault("priorityWorker", "") == "yes" &&
            answers.GetValueOrDefault("extraordinaryAbility", "") == "yes")
        {
            if (possibleVisaTypes.Any(v => v.Code == "EB-1"))
            {
                return true;
            }
        }

        // Check EB-2 completion criteria (immigration purpose, advanced degree, professional worker)
        if (purpose == "immigration" && answers.GetValueOrDefault("advancedDegree", "") == "yes" &&
            answers.GetValueOrDefault("professionalWorker", "") == "yes")
        {
            if (possibleVisaTypes.Any(v => v.Code == "EB-2"))
            {
                return true;
            }
        }

        // Check EB-3 completion criteria (immigration purpose, skilled worker, labor certification)
        if (purpose == "immigration" && answers.GetValueOrDefault("skilledWorker", "") == "yes" &&
            answers.GetValueOrDefault("laborCertification", "") == "yes")
        {
            if (possibleVisaTypes.Any(v => v.Code == "EB-3"))
            {
                return true;
            }
        }

        // Check EB-4 completion criteria (immigration purpose, special immigrant, religious worker)
        if (purpose == "immigration" && answers.GetValueOrDefault("specialImmigrant", "") == "yes" &&
            answers.GetValueOrDefault("religiousWorker", "") == "yes")
        {
            if (possibleVisaTypes.Any(v => v.Code == "EB-4"))
            {
                return true;
            }
        }

        // Legacy checks for backward compatibility - will remove later
        // Check G-1 completion criteria
        if (purpose == "employment" && internationalOrg == "yes" && workingForInternationalOrg == "yes")
        {
            // G-1 has all required answers
            if (possibleVisaTypes.Any(v => v.Code == "G-1"))
            {
                return true;
            }
        }

        // Check G-2 completion criteria
        if (purpose == "official" && isDiplomat == "no" && isGovernmentOfficial == "no" && internationalOrg == "yes" && workingForInternationalOrg == "yes")
        {
            // G-2 has all required answers
            if (possibleVisaTypes.Any(v => v.Code == "G-2"))
            {
                return true;
            }
        }


        return false;
    }

    private static Task<InterviewQuestion> GetBestDiscriminatingQuestionAsync(List<VisaType> possibleVisaTypes, Dictionary<string, string> answers)
    {
        // Determine which question would best narrow down the remaining visa types
        var questions = GetPossibleQuestions();

        // For diplomatic/official purposes, bypass discrimination scoring and use direct fallback order
        var purpose = answers.GetValueOrDefault("purpose", "");
        if (purpose == "diplomatic" || purpose == "official")
        {
            // Direct diplomatic question order - skip discrimination algorithm
            var diplomaticOrder = new[] { "diplomat", "governmentOfficial", "internationalOrg", "workingForInternationalOrg", "workingForDiplomat", "workingForG4" };
            foreach (var questionKey in diplomaticOrder)
            {
                if (!answers.ContainsKey(questionKey))
                {
                    // Check if we already have enough information to determine the visa type
                    if (possibleVisaTypes.Count <= 1)
                    {
                        // Don't ask more questions if we can already determine the visa type
                        break;
                    }

                    var question = questions.FirstOrDefault(q => q.Key == questionKey);
                    if (question != null)
                    {
                        question.RemainingVisaTypes = possibleVisaTypes.Count;
                        return Task.FromResult(question);
                    }
                }
            }
        }

        // For transit purposes, use direct transit question order
        if (purpose == "transit")
        {
            // Direct transit question order - include crewMember for C-1/D and D visas
            var transitOrder = new[] { "crewMember", "governmentOfficial", "internationalOrg", "isUNRelated" };
            foreach (var questionKey in transitOrder)
            {
                if (!answers.ContainsKey(questionKey))
                {
                    var question = questions.FirstOrDefault(q => q.Key == questionKey);
                    if (question != null)
                    {
                        question.RemainingVisaTypes = possibleVisaTypes.Count;
                        return Task.FromResult(question);
                    }
                }
            }
        }

        // For business purposes, use business question order
        if (purpose == "business")
        {
            // Business question order - first ask employer sponsor, then prioritize treaty business visas (E-1, E-2) over general business (B-1)
            var businessOrder = new[] { "employerSponsor", "treatyCountry", "tradeActivity", "investment" };
            foreach (var questionKey in businessOrder)
            {
                if (!answers.ContainsKey(questionKey))
                {
                    var question = questions.FirstOrDefault(q => q.Key == questionKey);
                    if (question != null)
                    {
                        question.RemainingVisaTypes = possibleVisaTypes.Count;
                        return Task.FromResult(question);
                    }
                }
            }
        }

        // For employment purposes, use employment question order
        if (purpose == "employment")
        {
            // Employment question order - prioritize employer-sponsored jobs first, then specialty questions
            var employmentOrder = new[] { "employerSponsor", "australian", "specialtyOccupation", "crewMember", "shipOrAircraft", "priorityWorker", "extraordinaryAbility" };
            foreach (var questionKey in employmentOrder)
            {
                if (!answers.ContainsKey(questionKey))
                {
                    var question = questions.FirstOrDefault(q => q.Key == questionKey);
                    if (question != null)
                    {
                        question.RemainingVisaTypes = possibleVisaTypes.Count;
                        return Task.FromResult(question);
                    }
                }
            }
        }

        // For immigration purposes, use immigration question order
        if (purpose == "immigration")
        {
            // Immigration question order - prioritize most common immigration categories first
            var immigrationOrder = new[] { "diversityLottery", "priorityWorker", "extraordinaryAbility", "advancedDegree", "professionalWorker", "skilledWorker", "laborCertification", "specialImmigrant", "religiousWorker" };
            foreach (var questionKey in immigrationOrder)
            {
                if (!answers.ContainsKey(questionKey))
                {
                    var question = questions.FirstOrDefault(q => q.Key == questionKey);
                    if (question != null)
                    {
                        question.RemainingVisaTypes = possibleVisaTypes.Count;
                        return Task.FromResult(question);
                    }
                }
            }
        }

        // Only run general discrimination for non-purpose-specific scenarios
        if (purpose != "diplomatic" && purpose != "official" && purpose != "transit" && purpose != "employment" && purpose != "business" && purpose != "immigration")
        {
            foreach (var question in questions)
            {
                if (answers.ContainsKey(question.Key)) continue; // Already answered

                // Calculate how well this question discriminates between remaining visa types
                var discriminationScore = CalculateDiscriminationScore(question, possibleVisaTypes, answers);
                if (discriminationScore > 0)
                {
                    question.RemainingVisaTypes = possibleVisaTypes.Count;
                    return Task.FromResult(question);
                }
            }
        }

        // Fallback question if no good discriminator found
        // Always prioritize purpose as the first question if not answered
        if (!answers.ContainsKey("purpose"))
        {
            return Task.FromResult(questions.First(q => q.Key == "purpose"));
        }

        // If purpose is answered but we still can't discriminate, try other key questions
        // But avoid asking for data we might already have from user profile
        // Prioritize questions based on the stated purpose
        string[] fallbackOrder;

        if (purpose == "diplomatic" || purpose == "official")
        {
            // Prioritize diplomatic-specific questions only - ask main questions first, then refinement questions
            fallbackOrder = new[] { "diplomat", "governmentOfficial", "internationalOrg", "workingForDiplomat", "workingForInternationalOrg", "workingForG4" };
        }
        else if (purpose == "employment")
        {
            fallbackOrder = new[] { "employerSponsor", "internationalOrg", "governmentOfficial", "diplomat", "educationLevel", "hasJobOffer", "extraordinaryAbility", "sameCompany" };
        }
        else if (purpose == "immigration")
        {
            fallbackOrder = new[] { "diversityLottery", "priorityWorker", "extraordinaryAbility", "advancedDegree", "professionalWorker", "skilledWorker", "laborCertification", "specialImmigrant", "religiousWorker" };
        }
        else if (purpose == "family")
        {
            fallbackOrder = new[] { "familyRelationship", "usCitizenshipStatus", "relationshipDuration" };
        }
        else if (purpose == "study")
        {
            fallbackOrder = new[] { "studyLevel", "schoolType", "educationLevel" };
        }
        else if (purpose == "investment")
        {
            fallbackOrder = new[] { "investmentAmount", "businessType", "employerSponsor" };
        }
        else if (purpose == "transit")
        {
            // Transit-specific questions to distinguish between C-1, C-2, and C-3
            fallbackOrder = new[] { "governmentOfficial", "internationalOrg", "isUNRelated" };
        }
        else
        {
            // Generic fallback for other purposes
            fallbackOrder = new[] { "familyRelationship", "employerSponsor", "educationLevel", "hasJobOffer" };
        }

        foreach (var fallbackKey in fallbackOrder)
        {
            if (!answers.ContainsKey(fallbackKey))
            {
                var fallbackQuestion = questions.FirstOrDefault(q => q.Key == fallbackKey);
                if (fallbackQuestion != null)
                {
                    fallbackQuestion.RemainingVisaTypes = possibleVisaTypes.Count;
                    return Task.FromResult(fallbackQuestion);
                }
            }
        }

        // If all else fails, return a generic question but NOT nationality (since we have it from profile)
        return Task.FromResult(new InterviewQuestion
        {
            Key = "additionalInfo",
            Question = "Please provide any additional information about your travel purpose.",
            Type = "text",
            Required = false,
            RemainingVisaTypes = possibleVisaTypes.Count
        });
    }

    private static List<InterviewQuestion> GetPossibleQuestions()
    {
        return new List<InterviewQuestion>
        {
            new()
            {
                Key = "purpose",
                Question = "What is your primary purpose for coming to the United States?",
                Type = "select",
                Options = new()
                {
                    new() { Value = "tourism", Label = "Tourism/Vacation", Description = "Leisure travel, sightseeing, visiting friends or family" },
                    new() { Value = "business", Label = "Business", Description = "Meetings, conferences, negotiations, consulting" },
                    new() { Value = "employment", Label = "Employment", Description = "Working in the United States" },
                    new() { Value = "study", Label = "Study", Description = "Academic or vocational education" },
                    new() { Value = "diplomatic", Label = "Diplomatic", Description = "Official government business" },
                    new() { Value = "official", Label = "Official Government", Description = "Government employee on official duty" },
                    new() { Value = "investment", Label = "Investment", Description = "Starting or investing in a business" },
                    new() { Value = "exchange", Label = "Exchange Program", Description = "Cultural or educational exchange" },
                    new() { Value = "transit", Label = "Transit", Description = "Passing through the US to another destination" },
                    new() { Value = "medical", Label = "Medical Treatment", Description = "Seeking medical care in the US" },
                    new() { Value = "family", Label = "Family/Personal", Description = "Joining family members or spouse in the US" },
                    new() { Value = "immigration", Label = "Immigration", Description = "Permanent residence in the United States" }
                }
            },
            new()
            {
                Key = "employerSponsor",
                Question = "Do you have a U.S. employer who will sponsor your visa?",
                Type = "radio",
                Options = new()
                {
                    new() { Value = "yes", Label = "Yes", Description = "I have a confirmed job offer with sponsorship" },
                    new() { Value = "no", Label = "No", Description = "I do not have employer sponsorship" }
                }
            },
            new()
            {
                Key = "governmentOfficial",
                Question = "Are you a government official representing your country?",
                Type = "radio",
                Options = new()
                {
                    new() { Value = "yes", Label = "Yes", Description = "I am an official government representative" },
                    new() { Value = "no", Label = "No", Description = "I am not a government official" }
                }
            },
            new()
            {
                Key = "diplomat",
                Question = "Are you a diplomat, ambassador, or high-ranking government official?",
                Type = "radio",
                Options = new()
                {
                    new() { Value = "yes", Label = "Yes", Description = "I am a diplomat or high-ranking official" },
                    new() { Value = "no", Label = "No", Description = "I am not a diplomat" }
                }
            },
            new()
            {
                Key = "educationLevel",
                Question = "What is your highest level of education?",
                Type = "select",
                Options = new()
                {
                    new() { Value = "highschool", Label = "High School", Description = "High school diploma or equivalent" },
                    new() { Value = "bachelor", Label = "Bachelor's Degree", Description = "4-year college degree" },
                    new() { Value = "master", Label = "Master's Degree", Description = "Graduate degree" },
                    new() { Value = "phd", Label = "Doctorate (PhD)", Description = "Doctoral degree" },
                    new() { Value = "other", Label = "Other", Description = "Other professional qualifications" }
                }
            },
            new()
            {
                Key = "isStudent",
                Question = "Are you planning to study in the United States?",
                Type = "radio",
                Options = new()
                {
                    new() { Value = "yes", Label = "Yes", Description = "I will be enrolled in a U.S. educational institution" },
                    new() { Value = "no", Label = "No", Description = "I am not planning to study" }
                }
            },
            new()
            {
                Key = "studyLevel",
                Question = "What type of education will you pursue?",
                Type = "select",
                Options = new()
                {
                    new() { Value = "academic", Label = "Academic Study", Description = "University, college, or academic program" },
                    new() { Value = "vocational", Label = "Vocational Training", Description = "Technical or vocational school" }
                }
            },
            new()
            {
                Key = "isInvestor",
                Question = "Are you planning to invest in a U.S. business?",
                Type = "radio",
                Options = new()
                {
                    new() { Value = "yes", Label = "Yes", Description = "I plan to invest in or start a business" },
                    new() { Value = "no", Label = "No", Description = "I am not planning to invest" }
                }
            },
            new()
            {
                Key = "investmentAmount",
                Question = "How much do you plan to invest?",
                Type = "select",
                Options = new()
                {
                    new() { Value = "under100k", Label = "Under $100,000", Description = "Less than $100,000" },
                    new() { Value = "100k-500k", Label = "$100,000 - $500,000", Description = "Between $100,000 and $500,000" },
                    new() { Value = "500000+", Label = "$500,000 or more", Description = "$500,000 or more" },
                    new() { Value = "1000000+", Label = "$1,000,000 or more", Description = "$1,000,000 or more" }
                }
            },
            new()
            {
                Key = "extraordinaryAbility",
                Question = "Do you have extraordinary ability in sciences, arts, education, business, or athletics?",
                Type = "radio",
                Options = new()
                {
                    new() { Value = "yes", Label = "Yes", Description = "I have demonstrated extraordinary ability with national or international recognition" },
                    new() { Value = "no", Label = "No", Description = "I do not have extraordinary ability" }
                }
            },
            new()
            {
                Key = "sameCompany",
                Question = "Will you be working for the same company that employs you abroad?",
                Type = "radio",
                Options = new()
                {
                    new() { Value = "yes", Label = "Yes", Description = "I will transfer within the same company" },
                    new() { Value = "no", Label = "No", Description = "I will work for a different company" }
                }
            },
            new()
            {
                Key = "familyRelationship",
                Question = "What is your relationship to your U.S. family member?",
                Type = "select",
                Options = new()
                {
                    new() { Value = "spouse", Label = "Spouse", Description = "Married to a U.S. citizen or permanent resident" },
                    new() { Value = "parent", Label = "Parent", Description = "Child of a U.S. citizen or permanent resident" },
                    new() { Value = "child", Label = "Child", Description = "Parent of a U.S. citizen" },
                    new() { Value = "sibling", Label = "Sibling", Description = "Brother or sister of a U.S. citizen" },
                    new() { Value = "fiance", Label = "Fiancé(e)", Description = "Engaged to a U.S. citizen" },
                    new() { Value = "other", Label = "Other relative", Description = "Other family member" }
                }
            },
            new()
            {
                Key = "usFamilyStatus",
                Question = "What is your U.S. family member's status?",
                Type = "radio",
                Options = new()
                {
                    new() { Value = "citizen", Label = "U.S. Citizen", Description = "Born in the U.S. or naturalized citizen" },
                    new() { Value = "permanent_resident", Label = "Permanent Resident", Description = "Green card holder" },
                    new() { Value = "other", Label = "Other status", Description = "Other immigration status" }
                }
            },
            new()
            {
                Key = "internationalOrg",
                Question = "Will you be working for an international organization recognized by the U.S.?",
                Type = "radio",
                Options = new()
                {
                    new() { Value = "yes", Label = "Yes", Description = "I will work for the UN, World Bank, IMF, or other recognized international organization" },
                    new() { Value = "no", Label = "No", Description = "I will not work for an international organization" }
                }
            },
            new()
            {
                Key = "workingForDiplomat",
                Question = "Will you be working for a diplomat or diplomatic mission?",
                Type = "radio",
                Options = new()
                {
                    new() { Value = "yes", Label = "Yes", Description = "I will work for an ambassador, diplomat, or diplomatic mission" },
                    new() { Value = "no", Label = "No", Description = "I will not work for diplomatic personnel" }
                }
            },
            new()
            {
                Key = "workingForInternationalOrg",
                Question = "Will you be working directly for an international organization?",
                Type = "radio",
                Options = new()
                {
                    new() { Value = "yes", Label = "Yes", Description = "I will be an employee of an international organization" },
                    new() { Value = "no", Label = "No", Description = "I will not work for an international organization" }
                }
            },
            new()
            {
                Key = "workingForG4",
                Question = "Will you be working for someone with G-4 status?",
                Type = "radio",
                Options = new()
                {
                    new() { Value = "yes", Label = "Yes", Description = "I will work for someone with G-4 international organization status" },
                    new() { Value = "no", Label = "No", Description = "I will not work for G-4 personnel" }
                }
            },
            new()
            {
                Key = "isUNRelated",
                Question = "Is your transit related to the United Nations?",
                Type = "radio",
                Options = new()
                {
                    new() { Value = "yes", Label = "Yes", Description = "I am traveling to or from UN Headquarters in New York" },
                    new() { Value = "no", Label = "No", Description = "My transit is not UN-related" }
                }
            },
            new()
            {
                Key = "crewMember",
                Question = "Are you a crew member of a ship or aircraft?",
                Type = "radio",
                Options = new()
                {
                    new() { Value = "yes", Label = "Yes", Description = "I am a crew member on a ship or aircraft" },
                    new() { Value = "no", Label = "No", Description = "I am not a crew member" }
                }
            },

            new()
            {
                Key = "shipOrAircraft",
                Question = "Are you working on a ship or aircraft?",
                Type = "radio",
                Options = new()
                {
                    new() { Value = "yes", Label = "Yes", Description = "I work on a ship or aircraft" },
                    new() { Value = "no", Label = "No", Description = "I do not work on a ship or aircraft" }
                }
            },

            new()
            {
                Key = "treatyCountry",
                Question = "Are you a citizen of a country that has a trade treaty with the United States?",
                Type = "radio",
                Options = new()
                {
                    new() { Value = "yes", Label = "Yes", Description = "My country has a trade treaty with the U.S." },
                    new() { Value = "no", Label = "No", Description = "My country does not have a trade treaty with the U.S." }
                }
            },

            new()
            {
                Key = "tradeActivity",
                Question = "Will you be conducting substantial trade between the U.S. and your country?",
                Type = "radio",
                Options = new()
                {
                    new() { Value = "yes", Label = "Yes", Description = "I will engage in substantial trade activities" },
                    new() { Value = "no", Label = "No", Description = "I will not be conducting substantial trade" }
                }
            },

            new()
            {
                Key = "investment",
                Question = "Will you be making a substantial investment in a U.S. business?",
                Type = "radio",
                Options = new()
                {
                    new() { Value = "yes", Label = "Yes", Description = "I will make a substantial business investment" },
                    new() { Value = "no", Label = "No", Description = "I will not be making an investment" }
                }
            },

            new()
            {
                Key = "australian",
                Question = "Are you an Australian citizen?",
                Type = "radio",
                Options = new()
                {
                    new() { Value = "yes", Label = "Yes", Description = "I am an Australian citizen" },
                    new() { Value = "no", Label = "No", Description = "I am not an Australian citizen" }
                }
            },

            new()
            {
                Key = "specialtyOccupation",
                Question = "Will you be working in a specialty occupation requiring specialized knowledge?",
                Type = "radio",
                Options = new()
                {
                    new() { Value = "yes", Label = "Yes", Description = "My job requires specialized knowledge or skills" },
                    new() { Value = "no", Label = "No", Description = "My job does not require specialized knowledge" }
                }
            },

            // Immigration-specific questions
            new()
            {
                Key = "priorityWorker",
                Question = "Are you a priority worker with extraordinary ability or outstanding skills?",
                Type = "radio",
                Options = new()
                {
                    new() { Value = "yes", Label = "Yes", Description = "I have extraordinary ability, am an outstanding professor/researcher, or multinational executive" },
                    new() { Value = "no", Label = "No", Description = "I do not qualify as a priority worker" }
                }
            },

            new()
            {
                Key = "advancedDegree",
                Question = "Do you have an advanced degree (Master's or higher) or equivalent experience?",
                Type = "radio",
                Options = new()
                {
                    new() { Value = "yes", Label = "Yes", Description = "I have a Master's degree, PhD, or equivalent professional experience" },
                    new() { Value = "no", Label = "No", Description = "I do not have an advanced degree" }
                }
            },

            new()
            {
                Key = "professionalWorker",
                Question = "Are you a professional worker with advanced skills in your field?",
                Type = "radio",
                Options = new()
                {
                    new() { Value = "yes", Label = "Yes", Description = "I am a professional in my field requiring advanced education or skills" },
                    new() { Value = "no", Label = "No", Description = "I am not a professional worker" }
                }
            },

            new()
            {
                Key = "skilledWorker",
                Question = "Are you a skilled worker with at least 2 years of training or experience?",
                Type = "radio",
                Options = new()
                {
                    new() { Value = "yes", Label = "Yes", Description = "I have at least 2 years of training or work experience" },
                    new() { Value = "no", Label = "No", Description = "I do not have sufficient training or experience" }
                }
            },

            new()
            {
                Key = "laborCertification",
                Question = "Do you have an approved labor certification from the U.S. Department of Labor?",
                Type = "radio",
                Options = new()
                {
                    new() { Value = "yes", Label = "Yes", Description = "I have an approved PERM labor certification" },
                    new() { Value = "no", Label = "No", Description = "I do not have a labor certification" }
                }
            },

            new()
            {
                Key = "specialImmigrant",
                Question = "Are you eligible as a special immigrant (religious worker, Iraqi/Afghan translator, etc.)?",
                Type = "radio",
                Options = new()
                {
                    new() { Value = "yes", Label = "Yes", Description = "I qualify as a special immigrant in a specific category" },
                    new() { Value = "no", Label = "No", Description = "I do not qualify as a special immigrant" }
                }
            },

            new()
            {
                Key = "religiousWorker",
                Question = "Are you a religious worker coming to work for a qualifying religious organization?",
                Type = "radio",
                Options = new()
                {
                    new() { Value = "yes", Label = "Yes", Description = "I will work for a qualified religious organization in the U.S." },
                    new() { Value = "no", Label = "No", Description = "I am not a religious worker" }
                }
            },

            new()
            {
                Key = "diversityLottery",
                Question = "Have you won the Diversity Visa Lottery?",
                Type = "radio",
                Options = new()
                {
                    new() { Value = "yes", Label = "Yes", Description = "I was selected in the Diversity Visa Lottery program" },
                    new() { Value = "no", Label = "No", Description = "I was not selected in the Diversity Visa Lottery" }
                }
            }
        };
    }

    private static double CalculateDiscriminationScore(InterviewQuestion question, List<VisaType> possibleVisaTypes, Dictionary<string, string> answers)
    {
        // Simple scoring: return 1 if the question helps discriminate, 0 if not useful
        var testAnswers = new Dictionary<string, string>(answers);

        double bestScore = 0;
        foreach (var option in question.Options)
        {
            testAnswers[question.Key] = option.Value;
            var remainingTypes = possibleVisaTypes.Where(v => IsVisaTypePossible(v, testAnswers)).Count();
            var score = possibleVisaTypes.Count - remainingTypes;
            if (score > bestScore) bestScore = score;
        }

        return bestScore;
    }

    private static Dictionary<string, string> EnrichAnswersWithUserData(Dictionary<string, string> answers, User? user)
    {
        var enriched = new Dictionary<string, string>(answers);

        if (user != null)
        {
            // Add user profile data if not already answered in interview
            if (!enriched.ContainsKey("nationality") && !string.IsNullOrEmpty(user.Nationality))
                enriched["nationality"] = user.Nationality.ToLowerInvariant();

            if (!enriched.ContainsKey("citizenship") && !string.IsNullOrEmpty(user.Citizenship))
                enriched["citizenship"] = user.Citizenship.ToLowerInvariant();

            if (!enriched.ContainsKey("country") && !string.IsNullOrEmpty(user.Country))
                enriched["country"] = user.Country.ToLowerInvariant();

            if (!enriched.ContainsKey("maritalStatus") && !string.IsNullOrEmpty(user.MaritalStatus))
                enriched["maritalStatus"] = user.MaritalStatus.ToLowerInvariant();

            if (!enriched.ContainsKey("dateOfBirth") && user.DateOfBirth.HasValue)
            {
                var age = DateTime.Now.Year - user.DateOfBirth.Value.Year;
                if (DateTime.Now.DayOfYear < user.DateOfBirth.Value.DayOfYear) age--;
                enriched["age"] = age.ToString(System.Globalization.CultureInfo.InvariantCulture);
            }

            // Guardian information for minors
            if (!enriched.ContainsKey("hasGuardian") && !string.IsNullOrEmpty(user.GuardianEmail))
                enriched["hasGuardian"] = "yes";
        }

        return enriched;
    }

    private static string GenerateRationale(VisaType visaType, Dictionary<string, string> answers)
    {
        var purpose = answers.GetValueOrDefault("purpose", "");
        var employerSponsor = answers.GetValueOrDefault("employerSponsor", "");

        return visaType.Code switch
        {
            "A-1" => "Based on your diplomatic status and official purpose, an A-1 Diplomatic Visa is recommended for heads of state, ambassadors, and high-ranking diplomatic officials.",
            "A-2" => "Based on your government official status, an A-2 Official Visa is recommended for government employees on official business.",
            "B-1" => "Based on your business purpose without employer sponsorship, a B-1 Business Visitor Visa is recommended for temporary business activities.",
            "B-2" => "Based on your tourism or personal visit purpose, a B-2 Tourist Visa is recommended for temporary pleasure travel.",
            "F-1" => "Based on your study plans at an academic institution, an F-1 Academic Student Visa is recommended.",
            "H-1B" => "Based on your employment purpose with employer sponsorship and professional qualifications, an H-1B Specialty Occupation Visa is recommended.",
            "L-1" => "Based on your intracompany transfer with the same employer, an L-1 Intracompany Transferee Visa is recommended.",
            "O-1" => "Based on your extraordinary ability and employer sponsorship, an O-1 Extraordinary Ability Visa is recommended.",
            "EB-5" => "Based on your significant investment plans, an EB-5 Immigrant Investor Visa is recommended.",
            "K-1" => "Based on your engagement to a U.S. citizen, a K-1 Fiancé(e) Visa is recommended to enter the U.S. for marriage.",
            "CR-1" or "IR-1" => "Based on your marriage to a U.S. citizen, an IR-1/CR-1 Immediate Relative Spouse Visa is recommended for permanent residence.",
            "F-2A" => "Based on your marriage to a U.S. permanent resident, an F-2A Family Preference Visa is recommended.",
            "IR-2" or "IR-5" => "Based on your immediate family relationship to a U.S. citizen, this Immediate Relative Visa is recommended for permanent residence.",
            _ => $"Based on your answers, a {visaType.Name} visa appears most appropriate for your situation. Please consult with an immigration attorney for personalized guidance."
        };
    }

    private static VisaType SelectBestVisaType(List<VisaType> possibleVisaTypes, Dictionary<string, string> enrichedAnswers)
    {
        if (possibleVisaTypes.Count == 1)
        {
            return possibleVisaTypes.First();
        }

        // Get key answer values
        var purpose = enrichedAnswers.GetValueOrDefault("purpose", "").ToLowerInvariant();
        var governmentOfficial = enrichedAnswers.GetValueOrDefault("governmentOfficial", "").ToLowerInvariant();
        var internationalOrg = enrichedAnswers.GetValueOrDefault("internationalOrg", "").ToLowerInvariant();
        var isUNRelated = enrichedAnswers.GetValueOrDefault("isUNRelated", "").ToLowerInvariant();

        // Diplomatic purpose logic - use context to distinguish between A-1, A-2, A-3
        if (purpose == "diplomatic" || purpose == "official")
        {
            // For international organizations - G-series
            if (internationalOrg == "yes")
            {
                // G-1: Principal representatives to international organizations
                if (possibleVisaTypes.Any(v => v.Code == "G-1"))
                {
                    return possibleVisaTypes.First(v => v.Code == "G-1");
                }

                // G-2: Other representatives to international organizations
                if (possibleVisaTypes.Any(v => v.Code == "G-2"))
                {
                    return possibleVisaTypes.First(v => v.Code == "G-2");
                }
            }
            else if (governmentOfficial == "yes")
            {
                // For government officials - A-series
                // Need to distinguish A-1, A-2, A-3 by what's actually possible/filtered
                // If only one A-type is possible, use that
                var aTypes = possibleVisaTypes.Where(v => v.Code.StartsWith("A-")).ToList();
                if (aTypes.Count == 1)
                {
                    return aTypes.First();
                }

                // If multiple A-types, prefer in this order based on specificity
                if (possibleVisaTypes.Any(v => v.Code == "A-1"))
                {
                    return possibleVisaTypes.First(v => v.Code == "A-1");
                }
                if (possibleVisaTypes.Any(v => v.Code == "A-2"))
                {
                    return possibleVisaTypes.First(v => v.Code == "A-2");
                }
                if (possibleVisaTypes.Any(v => v.Code == "A-3"))
                {
                    return possibleVisaTypes.First(v => v.Code == "A-3");
                }
            }
        }

        // Transit purpose logic - prioritize specific transit types
        if (purpose == "transit")
        {
            // C-2: Transit to UN Headquarters
            if (possibleVisaTypes.Any(v => v.Code == "C-2") && isUNRelated == "yes")
            {
                return possibleVisaTypes.First(v => v.Code == "C-2");
            }

            // C-3: Foreign government officials in transit
            if (possibleVisaTypes.Any(v => v.Code == "C-3") && governmentOfficial == "yes")
            {
                return possibleVisaTypes.First(v => v.Code == "C-3");
            }

            // C-1/D: Transit/Crew member combination visa (prioritize over C-1)
            if (possibleVisaTypes.Any(v => v.Code == "C-1/D"))
            {
                return possibleVisaTypes.First(v => v.Code == "C-1/D");
            }

            // C-1: General transit (fallback)
            if (possibleVisaTypes.Any(v => v.Code == "C-1"))
            {
                return possibleVisaTypes.First(v => v.Code == "C-1");
            }
        }

        // Business purpose logic - prioritize treaty business visas over general business
        if (purpose == "business")
        {
            // E-1: Treaty Trader (highest priority for business)
            if (possibleVisaTypes.Any(v => v.Code == "E-1"))
            {
                return possibleVisaTypes.First(v => v.Code == "E-1");
            }

            // E-2: Treaty Investor (second priority for business)
            if (possibleVisaTypes.Any(v => v.Code == "E-2"))
            {
                return possibleVisaTypes.First(v => v.Code == "E-2");
            }

            // B-1: General business visitor (fallback)
            if (possibleVisaTypes.Any(v => v.Code == "B-1"))
            {
                return possibleVisaTypes.First(v => v.Code == "B-1");
            }
        }

        if (purpose == "tourism" && possibleVisaTypes.Any(v => v.Code == "B-2"))
        {
            return possibleVisaTypes.First(v => v.Code == "B-2");
        }

        // Employment purpose logic - prioritize crew and specialized workers
        if (purpose == "employment")
        {
            // D: Crew member (employment + ship/aircraft crew)
            if (possibleVisaTypes.Any(v => v.Code == "D"))
            {
                return possibleVisaTypes.First(v => v.Code == "D");
            }

            // Other employment visas in priority order
            var employmentOrder = new[] { "H-1B", "L-1", "O-1", "E-3" };
            foreach (var code in employmentOrder)
            {
                if (possibleVisaTypes.Any(v => v.Code == code))
                {
                    return possibleVisaTypes.First(v => v.Code == code);
                }
            }
        }

        // Generic prioritization: prefer more specific visa types
        var priorityOrder = new[]
        {
            "A-1", "A-3", "A-2",
            "G-1", "G-2", "G-3", "G-4", "G-5",
            "C-2", "C-3", "C-1/D", "C-1", "D",
            "B-1", "B-2",
            "F-1", "M-1", "J-1",
            "H-1B", "L-1", "O-1", "E-3",
            "EB-1", "EB-2", "EB-3", "EB-4", "EB-5",
            "E-1", "E-2", "Diversity"
        };

        foreach (var code in priorityOrder)
        {
            var visa = possibleVisaTypes.FirstOrDefault(v => v.Code == code);
            if (visa != null)
            {
                return visa;
            }
        }

        // Fallback: return first available (should not reach here normally)
        return possibleVisaTypes.First();
    }
}
using L4H.Infrastructure.Data;
using Microsoft.Extensions.Logging;
using L4H.Infrastructure.Entities;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;

namespace L4H.Infrastructure.Services
{
    public class AdaptiveInterviewService : IAdaptiveInterviewService
    {
        private readonly ILogger<AdaptiveInterviewService> _logger;
        private readonly L4HDbContext _context;
        private readonly IInterviewRecommender _recommender;

        public AdaptiveInterviewService(
            ILogger<AdaptiveInterviewService> logger, 
            L4HDbContext context,
            IInterviewRecommender recommender)
        {
            _logger = logger;
            _context = context;
            _recommender = recommender;
        }

        public async Task<InterviewQuestion> GetNextQuestionAsync(Dictionary<string, string>? answers, User? user = null)
        {
            try
            {
                _logger.LogInformation("Getting next question for user {UserId} with {AnswerCount} answers", 
                    user?.Id, answers?.Count ?? 0);

                // Get remaining visa types based on current answers and user profile
                var remainingVisaTypes = await GetRemainingVisaTypesAsync(answers, user).ConfigureAwait(false);
                
                _logger.LogInformation("Found {VisaTypeCount} remaining visa types: {VisaCodes}", 
                    remainingVisaTypes.Count, string.Join(", ", remainingVisaTypes.Select(v => v.Code)));

                // Check if we can complete the interview early
                if (await CanCompleteEarlyAsync(remainingVisaTypes, answers).ConfigureAwait(false))
                {
                    _logger.LogInformation("Interview can be completed early with {VisaTypeCount} remaining visa types", 
                        remainingVisaTypes.Count);
                    
                    return new InterviewQuestion
                    {
                        Key = "complete",
                        Question = "Interview Complete",
                        Type = "complete",
                        RemainingVisaTypes = remainingVisaTypes.Count,
                        RemainingVisaCodes = remainingVisaTypes.Select(v => v.Code).ToList()
                    };
                }

                // Determine the next question based on current state
                var nextQuestion = DetermineNextQuestion(answers, remainingVisaTypes, user);
                
                _logger.LogInformation("Next question determined: {QuestionKey}", nextQuestion.Key);
                
                return nextQuestion;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting next question for user {UserId}", user?.Id);
                throw;
            }
        }

        public async Task<RecommendationResult> GetRecommendationAsync(Dictionary<string, string>? answers, User? user = null)
        {
            try
            {
                _logger.LogInformation("Getting recommendation for user {UserId} with {AnswerCount} answers",
                    user?.Id, answers?.Count ?? 0);

                var result = await _recommender.GetRecommendationAsync(answers ?? new Dictionary<string, string>(), user?.Nationality).ConfigureAwait(false);

                if (result != null)
                {
                    _logger.LogInformation("Recommendation generated: VisaTypeId={VisaTypeId}, Rationale={Rationale}",
                        result.VisaTypeId, result.Rationale);
                }
                else
                {
                    _logger.LogWarning("Recommender returned null result for user {UserId}", user?.Id);
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting recommendation for user {UserId}", user?.Id);
                throw;
            }
        }

        public async Task<bool> IsCompleteAsync(Dictionary<string, string>? answers, User? user = null)
        {
            try
            {
                var remainingVisaTypes = await GetRemainingVisaTypesAsync(answers, user).ConfigureAwait(false);
                var canComplete = await CanCompleteEarlyAsync(remainingVisaTypes, answers).ConfigureAwait(false);
                
                _logger.LogInformation("Interview completion check: {CanComplete} with {VisaTypeCount} remaining visa types", 
                    canComplete, remainingVisaTypes.Count);
                
                return canComplete;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking completion status for user {UserId}", user?.Id);
                return false;
            }
        }

        private async Task<List<VisaType>> GetRemainingVisaTypesAsync(Dictionary<string, string>? answers, User? user)
        {
            var allVisaTypes = await _context.VisaTypes
                .Where(v => v.IsActive)
                .ToListAsync().ConfigureAwait(false);

            var filteredVisaTypes = allVisaTypes.AsEnumerable();

            // Apply user profile filters
            if (user != null)
            {
                filteredVisaTypes = ApplyUserProfileFilters(filteredVisaTypes, user);
            }

            // Apply answer-based filters
            if (answers != null && answers.Any())
            {
                filteredVisaTypes = ApplyAnswerFilters(filteredVisaTypes, answers);
            }

            var result = filteredVisaTypes.ToList();
            
            _logger.LogDebug("Visa filtering: Started with {InitialCount}, filtered to {FinalCount}", 
                allVisaTypes.Count, result.Count);
            
            return result;
        }

        private IEnumerable<VisaType> ApplyUserProfileFilters(IEnumerable<VisaType> visaTypes, User user)
        {
            var filtered = visaTypes;

            // Age-based filtering
            if (user.DateOfBirth.HasValue)
            {
                var age = CalculateAge(user.DateOfBirth.Value);
                _logger.LogDebug("Applying age filter: {Age} years old", age);
                
                // Filter out visas not appropriate for age
                if (age < 18)
                {
                    // Minors may need special visa categories or guardian consent
                    filtered = filtered.Where(v => !IsAdultOnlyVisa(v.Code));
                }
            }

            // Nationality/Citizenship filtering
            if (!string.IsNullOrEmpty(user.Nationality))
            {
                _logger.LogDebug("Applying nationality filter: {Nationality}", user.Nationality);
                filtered = filtered.Where(v => IsVisaAvailableForNationality(v.Code, user.Nationality));
            }

            // Marital status filtering
            if (!string.IsNullOrEmpty(user.MaritalStatus))
            {
                _logger.LogDebug("Applying marital status filter: {MaritalStatus}", user.MaritalStatus);
                // Some visas may have marital status requirements
                filtered = filtered.Where(v => IsVisaAvailableForMaritalStatus(v.Code, user.MaritalStatus));
            }

            return filtered;
        }

        private IEnumerable<VisaType> ApplyAnswerFilters(IEnumerable<VisaType> visaTypes, Dictionary<string, string>? answers)
        {
            var filtered = visaTypes;

            if (answers == null) return filtered;

            // Purpose of visit filtering
            if (answers.TryGetValue("purpose", out var purpose))
            {
                _logger.LogDebug("Applying purpose filter: {Purpose}", purpose);
                filtered = filtered.Where(v => IsVisaApplicableForPurpose(v.Code, purpose));
            }

            // Employment sponsor filtering
            if (answers.TryGetValue("hasEmployerSponsor", out var hasSponsor))
            {
                _logger.LogDebug("Applying employer sponsor filter: {HasSponsor}", hasSponsor);
                filtered = filtered.Where(v => IsVisaApplicableForSponsorStatus(v.Code, hasSponsor));
            }

            // Duration of stay filtering
            if (answers.TryGetValue("durationOfStay", out var duration))
            {
                _logger.LogDebug("Applying duration filter: {Duration}", duration);
                filtered = filtered.Where(v => IsVisaApplicableForDuration(v.Code, duration));
            }

            // Family relationship filtering
            if (answers.TryGetValue("familyRelationship", out var relationship))
            {
                _logger.LogDebug("Applying family relationship filter: {Relationship}", relationship);
                filtered = filtered.Where(v => IsVisaApplicableForFamilyRelationship(v.Code, relationship));
            }

            // Adoption-specific filtering
            if (answers.TryGetValue("adoptionType", out var adoptionType))
            {
                _logger.LogDebug("Applying adoption type filter: {AdoptionType}", adoptionType);
                filtered = filtered.Where(v => IsVisaApplicableForAdoption(v.Code, adoptionType));
            }

            if (answers.TryGetValue("adoptionCompleted", out var adoptionCompleted))
            {
                _logger.LogDebug("Applying adoption completion filter: {AdoptionCompleted}", adoptionCompleted);
                filtered = filtered.Where(v => IsVisaApplicableForAdoptionCompletion(v.Code, adoptionCompleted));
            }

            // Investment amount filtering
            if (answers.TryGetValue("investmentAmount", out var investment))
            {
                _logger.LogDebug("Applying investment filter: {Investment}", investment);
                filtered = filtered.Where(v => IsVisaApplicableForInvestment(v.Code, investment));
            }

            // Citizenship-specific filtering
            if (answers.TryGetValue("currentStatus", out var currentStatus))
            {
                _logger.LogDebug("Applying current status filter: {CurrentStatus}", currentStatus);
                filtered = filtered.Where(v => IsVisaApplicableForCurrentStatus(v.Code, currentStatus));
            }

            if (answers.TryGetValue("residencyYears", out var residencyYears))
            {
                _logger.LogDebug("Applying residency years filter: {ResidencyYears}", residencyYears);
                filtered = filtered.Where(v => IsVisaApplicableForResidencyYears(v.Code, residencyYears));
            }

            if (answers.TryGetValue("marriedToUSCitizen", out var marriedToUSCitizen))
            {
                _logger.LogDebug("Applying married to US citizen filter: {MarriedToUSCitizen}", marriedToUSCitizen);
                filtered = filtered.Where(v => IsVisaApplicableForMaritalStatusToCitizen(v.Code, marriedToUSCitizen));
            }

            return filtered;
        }

        private static InterviewQuestion DetermineNextQuestion(Dictionary<string, string>? answers, List<VisaType> remainingVisaTypes, User? user)
        {
            // Determine the most effective next question to ask
            var questionKey = GetNextQuestionKey(answers, remainingVisaTypes);
            
            return questionKey switch
            {
                "purpose" => CreatePurposeQuestion(remainingVisaTypes),
                "hasEmployerSponsor" => CreateEmployerSponsorQuestion(remainingVisaTypes),
                "durationOfStay" => CreateDurationQuestion(remainingVisaTypes),
                "familyRelationship" => CreateFamilyRelationshipQuestion(remainingVisaTypes),
                "investmentAmount" => CreateInvestmentQuestion(remainingVisaTypes),
                "educationLevel" => CreateEducationQuestion(remainingVisaTypes),
                "hasUsFamily" => CreateUsFamilyQuestion(remainingVisaTypes),
                "previousVisaHistory" => CreateVisaHistoryQuestion(remainingVisaTypes),
                // Adoption-specific questions
                "adoptionType" => CreateAdoptionTypeQuestion(remainingVisaTypes),
                "adoptionCompleted" => CreateAdoptionCompletedQuestion(remainingVisaTypes),
                "childAge" => CreateChildAgeQuestion(remainingVisaTypes),
                "childCountry" => CreateChildCountryQuestion(remainingVisaTypes),
                "hasLegalCustody" => CreateLegalCustodyQuestion(remainingVisaTypes),
                "homeStudyCompleted" => CreateHomeStudyQuestion(remainingVisaTypes),
                "agencyApproved" => CreateAgencyApprovedQuestion(remainingVisaTypes),
                // Citizenship-specific questions
                "currentStatus" => CreateCurrentStatusQuestion(remainingVisaTypes),
                "greenCardDate" => CreateGreenCardDateQuestion(remainingVisaTypes),
                "residencyYears" => CreateResidencyYearsQuestion(remainingVisaTypes),
                "physicalPresenceMonths" => CreatePhysicalPresenceQuestion(remainingVisaTypes),
                "continuousResidence" => CreateContinuousResidenceQuestion(remainingVisaTypes),
                "englishProficient" => CreateEnglishProficiencyQuestion(remainingVisaTypes),
                "civicsKnowledge" => CreateCivicsKnowledgeQuestion(remainingVisaTypes),
                "goodMoralCharacter" => CreateGoodMoralCharacterQuestion(remainingVisaTypes),
                "criminalHistory" => CreateCriminalHistoryQuestion(remainingVisaTypes),
                "taxCompliance" => CreateTaxComplianceQuestion(remainingVisaTypes),
                "militaryService" => CreateMilitaryServiceQuestion(remainingVisaTypes),
                "oathWillingness" => CreateOathWillingnessQuestion(remainingVisaTypes),
                "marriedToUSCitizen" => CreateMarriedToUSCitizenQuestion(remainingVisaTypes),
                "parentUSCitizen" => CreateParentUSCitizenQuestion(remainingVisaTypes),
                "bornAbroad" => CreateBornAbroadQuestion(remainingVisaTypes),
                "under18WhenParentNaturalized" => CreateUnder18WhenParentNaturalizedQuestion(remainingVisaTypes),
                _ => CreateDefaultQuestion(remainingVisaTypes)
            };
        }

        private static string GetNextQuestionKey(Dictionary<string, string>? answers, List<VisaType> remainingVisaTypes)
        {
            // Check if citizenship applications are being considered
            var hasCitizenshipTypes = remainingVisaTypes.Any(v => v.Code == "N-400" || v.Code == "N-600");
            
            // If purpose is citizenship, prioritize citizenship questions
            if (hasCitizenshipTypes && answers != null && answers.GetValueOrDefault("purpose") == "citizenship")
            {
                var citizenshipQuestionPriority = new[]
                {
                    "currentStatus",
                    "greenCardDate",
                    "residencyYears",
                    "physicalPresenceMonths",
                    "continuousResidence",
                    "marriedToUSCitizen",
                    "parentUSCitizen",
                    "bornAbroad",
                    "under18WhenParentNaturalized",
                    "englishProficient",
                    "civicsKnowledge",
                    "goodMoralCharacter",
                    "criminalHistory",
                    "taxCompliance",
                    "militaryService",
                    "oathWillingness"
                };

                foreach (var question in citizenshipQuestionPriority)
                {
                    if (answers == null || !answers.ContainsKey(question))
                    {
                        return question;
                    }
                }
            }

            // Check if adoption visas are still in consideration
            var hasAdoptionVisas = remainingVisaTypes.Any(v => v.Code == "IR-3" || v.Code == "IR-4");
            
            // If purpose is adoption or family and adoption visas are available, prioritize adoption questions
            if (hasAdoptionVisas && answers != null && (answers.GetValueOrDefault("purpose") == "adoption" || 
                                   answers.GetValueOrDefault("purpose") == "family"))
            {
                var adoptionQuestionPriority = new[]
                {
                    "adoptionType",
                    "adoptionCompleted",
                    "childAge",
                    "childCountry",
                    "hasLegalCustody",
                    "homeStudyCompleted",
                    "agencyApproved"
                };

                foreach (var question in adoptionQuestionPriority)
                {
                    if (answers == null || !answers.ContainsKey(question))
                    {
                        return question;
                    }
                }
            }

            // Priority order for general questions based on their filtering effectiveness
            var questionPriority = new[]
            {
                "purpose",
                "hasEmployerSponsor", 
                "durationOfStay",
                "familyRelationship",
                "investmentAmount",
                "educationLevel",
                "hasUsFamily",
                "previousVisaHistory"
            };

            // Return the first question that hasn't been answered yet
            foreach (var question in questionPriority)
            {
                if (answers == null || !answers.ContainsKey(question))
                {
                    return question;
                }
            }

            return "complete";
        }

        private static InterviewQuestion CreatePurposeQuestion(List<VisaType> remainingVisaTypes)
        {
            return new InterviewQuestion
            {
                Key = "purpose",
                Question = "What is the primary purpose of your visit to the United States?",
                Type = "single_choice",
                Options = new List<InterviewOption>
                {
                    new() { Value = "tourism", Label = "Tourism/Vacation" },
                    new() { Value = "business", Label = "Business meetings/conferences" },
                    new() { Value = "employment", Label = "Employment/Work" },
                    new() { Value = "study", Label = "Education/Study" },
                    new() { Value = "family", Label = "Visit family/relatives" },
                    new() { Value = "medical", Label = "Medical treatment" },
                    new() { Value = "investment", Label = "Investment/Business ownership" },
                    new() { Value = "immigration", Label = "Permanent immigration" },
                    new() { Value = "adoption", Label = "International adoption" },
                    new() { Value = "citizenship", Label = "Citizenship/Naturalization" },
                    new() { Value = "transit", Label = "Transit through US" },
                    new() { Value = "other", Label = "Other" }
                },
                RemainingVisaTypes = remainingVisaTypes.Count,
                RemainingVisaCodes = remainingVisaTypes.Select(v => v.Code).ToList()
            };
        }

        private static InterviewQuestion CreateEmployerSponsorQuestion(List<VisaType> remainingVisaTypes)
        {
            return new InterviewQuestion
            {
                Key = "hasEmployerSponsor",
                Question = "Do you have a US employer who will sponsor your visa?",
                Type = "single_choice",
                Options = new List<InterviewOption>
                {
                    new() { Value = "yes", Label = "Yes, I have an employer sponsor" },
                    new() { Value = "no", Label = "No, I do not have an employer sponsor" },
                    new() { Value = "seeking", Label = "I am seeking employment" }
                },
                RemainingVisaTypes = remainingVisaTypes.Count,
                RemainingVisaCodes = remainingVisaTypes.Select(v => v.Code).ToList()
            };
        }

        private static InterviewQuestion CreateDurationQuestion(List<VisaType> remainingVisaTypes)
        {
            return new InterviewQuestion
            {
                Key = "durationOfStay",
                Question = "How long do you plan to stay in the United States?",
                Type = "single_choice",
                Options = new List<InterviewOption>
                {
                    new() { Value = "short", Label = "Less than 90 days" },
                    new() { Value = "medium", Label = "3-12 months" },
                    new() { Value = "long", Label = "1-3 years" },
                    new() { Value = "permanent", Label = "Permanently" }
                },
                RemainingVisaTypes = remainingVisaTypes.Count,
                RemainingVisaCodes = remainingVisaTypes.Select(v => v.Code).ToList()
            };
        }

        private static InterviewQuestion CreateFamilyRelationshipQuestion(List<VisaType> remainingVisaTypes)
        {
            return new InterviewQuestion
            {
                Key = "familyRelationship",
                Question = "Do you have immediate family members who are US citizens or permanent residents?",
                Type = "single_choice",
                Options = new List<InterviewOption>
                {
                    new() { Value = "spouse", Label = "Spouse" },
                    new() { Value = "parent", Label = "Parent" },
                    new() { Value = "child", Label = "Child (over 21)" },
                    new() { Value = "child_minor", Label = "Child (under 21)" },
                    new() { Value = "sibling", Label = "Sibling" },
                    new() { Value = "other_relative", Label = "Other relative" },
                    new() { Value = "none", Label = "No immediate family in US" }
                },
                RemainingVisaTypes = remainingVisaTypes.Count,
                RemainingVisaCodes = remainingVisaTypes.Select(v => v.Code).ToList()
            };
        }

        private static InterviewQuestion CreateInvestmentQuestion(List<VisaType> remainingVisaTypes)
        {
            return new InterviewQuestion
            {
                Key = "investmentAmount",
                Question = "What is your planned investment amount in the US?",
                Type = "single_choice",
                Options = new List<InterviewOption>
                {
                    new() { Value = "none", Label = "No investment planned" },
                    new() { Value = "small", Label = "Under $100,000" },
                    new() { Value = "medium", Label = "$100,000 - $500,000" },
                    new() { Value = "large", Label = "$500,000 - $1,000,000" },
                    new() { Value = "eb5", Label = "Over $1,000,000 (EB-5 eligible)" }
                },
                RemainingVisaTypes = remainingVisaTypes.Count,
                RemainingVisaCodes = remainingVisaTypes.Select(v => v.Code).ToList()
            };
        }

        private static InterviewQuestion CreateEducationQuestion(List<VisaType> remainingVisaTypes)
        {
            return new InterviewQuestion
            {
                Key = "educationLevel",
                Question = "What is your highest level of education?",
                Type = "single_choice",
                Options = new List<InterviewOption>
                {
                    new() { Value = "high_school", Label = "High school or equivalent" },
                    new() { Value = "bachelor", Label = "Bachelor's degree" },
                    new() { Value = "master", Label = "Master's degree" },
                    new() { Value = "doctorate", Label = "Doctorate/PhD" },
                    new() { Value = "professional", Label = "Professional degree (JD, MD, etc.)" }
                },
                RemainingVisaTypes = remainingVisaTypes.Count,
                RemainingVisaCodes = remainingVisaTypes.Select(v => v.Code).ToList()
            };
        }

        private static InterviewQuestion CreateUsFamilyQuestion(List<VisaType> remainingVisaTypes)
        {
            return new InterviewQuestion
            {
                Key = "hasUsFamily",
                Question = "Do you have any family members in the United States?",
                Type = "single_choice",
                Options = new List<InterviewOption>
                {
                    new() { Value = "yes_citizen", Label = "Yes, US citizens" },
                    new() { Value = "yes_resident", Label = "Yes, permanent residents" },
                    new() { Value = "yes_visa", Label = "Yes, on temporary visas" },
                    new() { Value = "no", Label = "No family in US" }
                },
                RemainingVisaTypes = remainingVisaTypes.Count,
                RemainingVisaCodes = remainingVisaTypes.Select(v => v.Code).ToList()
            };
        }

        private static InterviewQuestion CreateVisaHistoryQuestion(List<VisaType> remainingVisaTypes)
        {
            return new InterviewQuestion
            {
                Key = "previousVisaHistory",
                Question = "Have you previously held a US visa?",
                Type = "single_choice",
                Options = new List<InterviewOption>
                {
                    new() { Value = "never", Label = "Never had a US visa" },
                    new() { Value = "tourist", Label = "Previous tourist/business visa" },
                    new() { Value = "student", Label = "Previous student visa" },
                    new() { Value = "work", Label = "Previous work visa" },
                    new() { Value = "denied", Label = "Previously denied" }
                },
                RemainingVisaTypes = remainingVisaTypes.Count,
                RemainingVisaCodes = remainingVisaTypes.Select(v => v.Code).ToList()
            };
        }

        private static InterviewQuestion CreateAdoptionTypeQuestion(List<VisaType> remainingVisaTypes)
        {
            return new InterviewQuestion
            {
                Key = "adoptionType",
                Question = "What type of adoption are you pursuing?",
                Type = "single_choice",
                Options = new List<InterviewOption>
                {
                    new() { Value = "international", Label = "International adoption (child from another country)" },
                    new() { Value = "domestic", Label = "Domestic adoption (child from US)" },
                    new() { Value = "relative", Label = "Relative adoption (family member)" },
                    new() { Value = "stepparent", Label = "Step-parent adoption" }
                },
                RemainingVisaTypes = remainingVisaTypes.Count,
                RemainingVisaCodes = remainingVisaTypes.Select(v => v.Code).ToList()
            };
        }

        private static InterviewQuestion CreateAdoptionCompletedQuestion(List<VisaType> remainingVisaTypes)
        {
            return new InterviewQuestion
            {
                Key = "adoptionCompleted",
                Question = "Has the adoption been legally completed in the child's country of birth?",
                Type = "single_choice",
                Options = new List<InterviewOption>
                {
                    new() { Value = "yes", Label = "Yes, adoption is legally completed abroad" },
                    new() { Value = "no", Label = "No, adoption will be completed in the United States" },
                    new() { Value = "in_process", Label = "Adoption is currently in process" }
                },
                RemainingVisaTypes = remainingVisaTypes.Count,
                RemainingVisaCodes = remainingVisaTypes.Select(v => v.Code).ToList()
            };
        }

        private static InterviewQuestion CreateChildAgeQuestion(List<VisaType> remainingVisaTypes)
        {
            return new InterviewQuestion
            {
                Key = "childAge",
                Question = "What is the age of the child you are adopting?",
                Type = "single_choice",
                Options = new List<InterviewOption>
                {
                    new() { Value = "infant", Label = "Infant (0-12 months)" },
                    new() { Value = "toddler", Label = "Toddler (1-3 years)" },
                    new() { Value = "preschool", Label = "Preschool (4-5 years)" },
                    new() { Value = "school_age", Label = "School age (6-12 years)" },
                    new() { Value = "teenager", Label = "Teenager (13-17 years)" },
                    new() { Value = "adult", Label = "Adult (18+ years)" }
                },
                RemainingVisaTypes = remainingVisaTypes.Count,
                RemainingVisaCodes = remainingVisaTypes.Select(v => v.Code).ToList()
            };
        }

        private static InterviewQuestion CreateChildCountryQuestion(List<VisaType> remainingVisaTypes)
        {
            return new InterviewQuestion
            {
                Key = "childCountry",
                Question = "What country is the child from?",
                Type = "single_choice",
                Options = new List<InterviewOption>
                {
                    new() { Value = "china", Label = "China" },
                    new() { Value = "russia", Label = "Russia" },
                    new() { Value = "south_korea", Label = "South Korea" },
                    new() { Value = "ethiopia", Label = "Ethiopia" },
                    new() { Value = "ukraine", Label = "Ukraine" },
                    new() { Value = "colombia", Label = "Colombia" },
                    new() { Value = "india", Label = "India" },
                    new() { Value = "guatemala", Label = "Guatemala" },
                    new() { Value = "other", Label = "Other country" }
                },
                RemainingVisaTypes = remainingVisaTypes.Count,
                RemainingVisaCodes = remainingVisaTypes.Select(v => v.Code).ToList()
            };
        }

        private static InterviewQuestion CreateLegalCustodyQuestion(List<VisaType> remainingVisaTypes)
        {
            return new InterviewQuestion
            {
                Key = "hasLegalCustody",
                Question = "Do you have legal custody of the child?",
                Type = "single_choice",
                Options = new List<InterviewOption>
                {
                    new() { Value = "yes", Label = "Yes, I have legal custody" },
                    new() { Value = "no", Label = "No, custody is pending" },
                    new() { Value = "guardianship", Label = "I have guardianship but not full custody" }
                },
                RemainingVisaTypes = remainingVisaTypes.Count,
                RemainingVisaCodes = remainingVisaTypes.Select(v => v.Code).ToList()
            };
        }

        private static InterviewQuestion CreateHomeStudyQuestion(List<VisaType> remainingVisaTypes)
        {
            return new InterviewQuestion
            {
                Key = "homeStudyCompleted",
                Question = "Have you completed a home study with an approved agency?",
                Type = "single_choice",
                Options = new List<InterviewOption>
                {
                    new() { Value = "yes", Label = "Yes, home study is completed and approved" },
                    new() { Value = "in_progress", Label = "Home study is in progress" },
                    new() { Value = "no", Label = "No, home study not started" },
                    new() { Value = "expired", Label = "Home study completed but expired" }
                },
                RemainingVisaTypes = remainingVisaTypes.Count,
                RemainingVisaCodes = remainingVisaTypes.Select(v => v.Code).ToList()
            };
        }

        private static InterviewQuestion CreateAgencyApprovedQuestion(List<VisaType> remainingVisaTypes)
        {
            return new InterviewQuestion
            {
                Key = "agencyApproved",
                Question = "Are you working with a Hague-accredited adoption agency?",
                Type = "single_choice",
                Options = new List<InterviewOption>
                {
                    new() { Value = "yes", Label = "Yes, working with Hague-accredited agency" },
                    new() { Value = "no", Label = "No, working with non-Hague agency" },
                    new() { Value = "independent", Label = "Independent adoption (no agency)" },
                    new() { Value = "unknown", Label = "Not sure about agency accreditation" }
                },
                RemainingVisaTypes = remainingVisaTypes.Count,
                RemainingVisaCodes = remainingVisaTypes.Select(v => v.Code).ToList()
            };
        }

        private static InterviewQuestion CreateDefaultQuestion(List<VisaType> remainingVisaTypes)
        {
            return new InterviewQuestion
            {
                Key = "complete",
                Question = "Based on your answers, we can provide a recommendation.",
                Type = "complete",
                RemainingVisaTypes = remainingVisaTypes.Count,
                RemainingVisaCodes = remainingVisaTypes.Select(v => v.Code).ToList()
            };
        }

        private static Task<bool> CanCompleteEarlyAsync(List<VisaType> remainingVisaTypes, Dictionary<string, string>? answers)
        {
            // Complete early if we have narrowed down to a small number of visa types
            if (remainingVisaTypes.Count <= 3)
            {
                return Task.FromResult(true);
            }

            // Complete early if we have enough information for a confident recommendation
            if (answers != null)
            {
                var essentialQuestions = new[] { "purpose", "hasEmployerSponsor", "durationOfStay" };
                var answeredEssentialQuestions = essentialQuestions.Count(q => answers.ContainsKey(q));
                
                if (answeredEssentialQuestions >= 2 && remainingVisaTypes.Count <= 5)
                {
                    return Task.FromResult(true);
                }
            }

            return Task.FromResult(false);
        }

        // Helper methods for visa filtering logic
        private static int CalculateAge(DateTime dateOfBirth)
        {
            var today = DateTime.Today;
            var age = today.Year - dateOfBirth.Year;
            if (dateOfBirth.Date > today.AddYears(-age)) age--;
            return age;
        }

        private static bool IsAdultOnlyVisa(string visaCode)
        {
            // Some visas that typically require adult status
            var adultOnlyVisas = new[] { "E-1", "E-2", "L-1A", "L-1B", "EB-1", "EB-2", "EB-3", "EB-4", "EB-5" };
            return adultOnlyVisas.Contains(visaCode);
        }

        private static bool IsVisaAvailableForNationality(string visaCode, string nationality)
        {
            // Most visas are available to all nationalities, but some have restrictions
            // This is a simplified implementation - in reality, this would be more complex
            return true;
        }

        private static bool IsVisaAvailableForMaritalStatus(string visaCode, string maritalStatus)
        {
            // Most visas don't have marital status restrictions
            return true;
        }

        private static bool IsVisaApplicableForPurpose(string visaCode, string purpose)
        {
            return purpose.ToLowerInvariant() switch
            {
                "tourism" => new[] { "B-1", "B-2", "ESTA" }.Contains(visaCode),
                "business" => new[] { "B-1", "E-1", "E-2", "L-1A", "L-1B" }.Contains(visaCode),
                "employment" => new[] { "H-1B", "H-2A", "H-2B", "L-1A", "L-1B", "O-1", "P-1", "E-1", "E-2", "EB-1", "EB-2", "EB-3" }.Contains(visaCode),
                "study" => new[] { "F-1", "J-1", "M-1" }.Contains(visaCode),
                "family" => new[] { "B-2", "IR-1", "IR-2", "IR-3", "IR-4", "IR-5", "K-1", "K-3", "F-1", "F-2A", "F-2B", "F-3", "F-4" }.Contains(visaCode),
                "medical" => new[] { "B-2" }.Contains(visaCode),
                "investment" => new[] { "E-1", "E-2", "EB-5" }.Contains(visaCode),
                "immigration" => new[] { "IR-1", "IR-2", "IR-3", "IR-4", "IR-5", "EB-1", "EB-2", "EB-3", "EB-4", "EB-5" }.Contains(visaCode),
                "adoption" => new[] { "IR-3", "IR-4" }.Contains(visaCode),
                "transit" => new[] { "C-1", "C-2", "C-3" }.Contains(visaCode),
                _ => true // Allow all visas for unknown purposes
            };
        }

        private static bool IsVisaApplicableForSponsorStatus(string visaCode, string hasSponsor)
        {
            var sponsorRequiredVisas = new[] { "H-1B", "H-2A", "H-2B", "L-1A", "L-1B", "O-1", "P-1", "EB-1", "EB-2", "EB-3" };
            
            return hasSponsor.ToLowerInvariant() switch
            {
                "yes" => true, // All visas available with sponsor
                "no" => !sponsorRequiredVisas.Contains(visaCode), // Only non-sponsored visas
                "seeking" => !sponsorRequiredVisas.Contains(visaCode), // Only non-sponsored visas for now
                _ => true
            };
        }

        private static bool IsVisaApplicableForDuration(string visaCode, string duration)
        {
            return duration.ToLowerInvariant() switch
            {
                "short" => new[] { "B-1", "B-2", "ESTA", "C-1", "C-2", "C-3" }.Contains(visaCode),
                "medium" => new[] { "B-1", "B-2", "F-1", "J-1", "M-1", "H-1B", "H-2A", "H-2B", "L-1A", "L-1B", "O-1", "P-1" }.Contains(visaCode),
                "long" => new[] { "F-1", "J-1", "H-1B", "L-1A", "L-1B", "O-1", "E-1", "E-2" }.Contains(visaCode),
                "permanent" => new[] { "IR-1", "IR-2", "IR-5", "EB-1", "EB-2", "EB-3", "EB-4", "EB-5" }.Contains(visaCode),
                _ => true
            };
        }

        private static bool IsVisaApplicableForFamilyRelationship(string visaCode, string relationship)
        {
            // Family relationship filtering should allow appropriate family visas AND non-family visas (like B-2 for visiting)
            return relationship.ToLowerInvariant() switch
            {
                "spouse" => new[] { "IR-1", "K-1", "K-3", "F-2A", "B-2" }.Contains(visaCode),
                "parent" => new[] { "IR-5", "B-2" }.Contains(visaCode),
                "child" => new[] { "IR-2", "F-1", "F-2B", "F-3", "F-4", "B-2" }.Contains(visaCode),
                "child_minor" => new[] { "IR-2", "F-2B", "B-2" }.Contains(visaCode),
                "sibling" => new[] { "F-4", "B-2" }.Contains(visaCode),
                "other_relative" => new[] { "F-3", "F-4", "B-2" }.Contains(visaCode),
                "none" => true, // All non-family visas available
                _ => true
            };
        }

        private static bool IsVisaApplicableForInvestment(string visaCode, string investment)
        {
            return investment.ToLowerInvariant() switch
            {
                "none" => !new[] { "E-1", "E-2", "EB-5" }.Contains(visaCode),
                "small" => !new[] { "EB-5" }.Contains(visaCode),
                "medium" => new[] { "E-1", "E-2" }.Contains(visaCode) || !new[] { "E-1", "E-2", "EB-5" }.Contains(visaCode),
                "large" => new[] { "E-1", "E-2", "EB-5" }.Contains(visaCode) || !new[] { "E-1", "E-2", "EB-5" }.Contains(visaCode),
                "eb5" => true, // All visas available for high investment
                _ => true
            };
        }

        private static bool IsVisaApplicableForAdoption(string visaCode, string adoptionType)
        {
            return adoptionType.ToLowerInvariant() switch
            {
                "international" => new[] { "IR-3", "IR-4" }.Contains(visaCode),
                "domestic" => false, // Domestic adoptions don't require immigration visas
                "relative" => new[] { "IR-3", "IR-4" }.Contains(visaCode), // May still need visa if child is abroad
                "stepparent" => false, // Step-parent adoptions typically don't require immigration visas
                _ => new[] { "IR-3", "IR-4" }.Contains(visaCode)
            };
        }

        private static bool IsVisaApplicableForAdoptionCompletion(string visaCode, string adoptionCompleted)
        {
            return adoptionCompleted.ToLowerInvariant() switch
            {
                "yes" => visaCode == "IR-3", // Adoption completed abroad = IR-3
                "no" => visaCode == "IR-4", // Adoption to be completed in US = IR-4
                "in_process" => new[] { "IR-3", "IR-4" }.Contains(visaCode), // Could be either
                _ => new[] { "IR-3", "IR-4" }.Contains(visaCode)
            };
        }

        // Citizenship-specific question creation methods
        private static InterviewQuestion CreateCurrentStatusQuestion(List<VisaType> remainingVisaTypes)
        {
            return new InterviewQuestion
            {
                Key = "currentStatus",
                Question = "What is your current immigration status?",
                Type = "single_choice",
                Options = new List<InterviewOption>
                {
                    new() { Value = "permanent_resident", Label = "Permanent Resident (Green Card holder)" },
                    new() { Value = "derived_citizen", Label = "Derived US Citizen (through parent)" },
                    new() { Value = "us_citizen_born_abroad", Label = "US Citizen born abroad" },
                    new() { Value = "conditional_resident", Label = "Conditional Permanent Resident" },
                    new() { Value = "other", Label = "Other status" }
                },
                RemainingVisaTypes = remainingVisaTypes.Count,
                RemainingVisaCodes = remainingVisaTypes.Select(v => v.Code).ToList()
            };
        }

        private static InterviewQuestion CreateGreenCardDateQuestion(List<VisaType> remainingVisaTypes)
        {
            return new InterviewQuestion
            {
                Key = "greenCardDate",
                Question = "When did you become a permanent resident (Green Card date)?",
                Type = "date",
                RemainingVisaTypes = remainingVisaTypes.Count,
                RemainingVisaCodes = remainingVisaTypes.Select(v => v.Code).ToList()
            };
        }

        private static InterviewQuestion CreateResidencyYearsQuestion(List<VisaType> remainingVisaTypes)
        {
            return new InterviewQuestion
            {
                Key = "residencyYears",
                Question = "How many years have you been a permanent resident?",
                Type = "single_choice",
                Options = new List<InterviewOption>
                {
                    new() { Value = "1", Label = "1 year" },
                    new() { Value = "2", Label = "2 years" },
                    new() { Value = "3", Label = "3 years" },
                    new() { Value = "4", Label = "4 years" },
                    new() { Value = "5", Label = "5 years" },
                    new() { Value = "6", Label = "6+ years" }
                },
                RemainingVisaTypes = remainingVisaTypes.Count,
                RemainingVisaCodes = remainingVisaTypes.Select(v => v.Code).ToList()
            };
        }

        private static InterviewQuestion CreatePhysicalPresenceQuestion(List<VisaType> remainingVisaTypes)
        {
            return new InterviewQuestion
            {
                Key = "physicalPresenceMonths",
                Question = "How many months have you been physically present in the US during your permanent residency?",
                Type = "single_choice",
                Options = new List<InterviewOption>
                {
                    new() { Value = "12", Label = "12 months (1 year)" },
                    new() { Value = "18", Label = "18 months (1.5 years)" },
                    new() { Value = "24", Label = "24 months (2 years)" },
                    new() { Value = "30", Label = "30 months (2.5 years)" },
                    new() { Value = "36", Label = "36 months (3 years)" },
                    new() { Value = "42", Label = "42+ months (3.5+ years)" }
                },
                RemainingVisaTypes = remainingVisaTypes.Count,
                RemainingVisaCodes = remainingVisaTypes.Select(v => v.Code).ToList()
            };
        }

        private static InterviewQuestion CreateContinuousResidenceQuestion(List<VisaType> remainingVisaTypes)
        {
            return new InterviewQuestion
            {
                Key = "continuousResidence",
                Question = "Have you maintained continuous residence in the United States?",
                Type = "single_choice",
                Options = new List<InterviewOption>
                {
                    new() { Value = "yes", Label = "Yes, continuous residence maintained" },
                    new() { Value = "no", Label = "No, had breaks in residence" },
                    new() { Value = "unsure", Label = "Not sure about continuous residence" }
                },
                RemainingVisaTypes = remainingVisaTypes.Count,
                RemainingVisaCodes = remainingVisaTypes.Select(v => v.Code).ToList()
            };
        }

        private static InterviewQuestion CreateEnglishProficiencyQuestion(List<VisaType> remainingVisaTypes)
        {
            return new InterviewQuestion
            {
                Key = "englishProficient",
                Question = "Are you proficient in English (speaking, reading, and writing)?",
                Type = "single_choice",
                Options = new List<InterviewOption>
                {
                    new() { Value = "yes", Label = "Yes, proficient in all areas" },
                    new() { Value = "partial", Label = "Proficient in some areas" },
                    new() { Value = "no", Label = "No, not proficient" },
                    new() { Value = "exempt", Label = "May qualify for exemption due to age/disability" }
                },
                RemainingVisaTypes = remainingVisaTypes.Count,
                RemainingVisaCodes = remainingVisaTypes.Select(v => v.Code).ToList()
            };
        }

        private static InterviewQuestion CreateCivicsKnowledgeQuestion(List<VisaType> remainingVisaTypes)
        {
            return new InterviewQuestion
            {
                Key = "civicsKnowledge",
                Question = "Do you have knowledge of US history and civics?",
                Type = "single_choice",
                Options = new List<InterviewOption>
                {
                    new() { Value = "yes", Label = "Yes, knowledgeable about US history and civics" },
                    new() { Value = "studying", Label = "Currently studying for the civics test" },
                    new() { Value = "no", Label = "No, need to study" },
                    new() { Value = "exempt", Label = "May qualify for exemption due to age/disability" }
                },
                RemainingVisaTypes = remainingVisaTypes.Count,
                RemainingVisaCodes = remainingVisaTypes.Select(v => v.Code).ToList()
            };
        }

        private static InterviewQuestion CreateGoodMoralCharacterQuestion(List<VisaType> remainingVisaTypes)
        {
            return new InterviewQuestion
            {
                Key = "goodMoralCharacter",
                Question = "Do you have good moral character (no serious criminal history, tax issues, etc.)?",
                Type = "single_choice",
                Options = new List<InterviewOption>
                {
                    new() { Value = "yes", Label = "Yes, good moral character" },
                    new() { Value = "no", Label = "No, have issues that may affect moral character" },
                    new() { Value = "unsure", Label = "Not sure about moral character requirements" }
                },
                RemainingVisaTypes = remainingVisaTypes.Count,
                RemainingVisaCodes = remainingVisaTypes.Select(v => v.Code).ToList()
            };
        }

        private static InterviewQuestion CreateCriminalHistoryQuestion(List<VisaType> remainingVisaTypes)
        {
            return new InterviewQuestion
            {
                Key = "criminalHistory",
                Question = "Do you have any criminal history (arrests, citations, convictions)?",
                Type = "single_choice",
                Options = new List<InterviewOption>
                {
                    new() { Value = "no", Label = "No criminal history" },
                    new() { Value = "minor", Label = "Minor violations (traffic tickets, etc.)" },
                    new() { Value = "misdemeanor", Label = "Misdemeanor convictions" },
                    new() { Value = "felony", Label = "Felony convictions" }
                },
                RemainingVisaTypes = remainingVisaTypes.Count,
                RemainingVisaCodes = remainingVisaTypes.Select(v => v.Code).ToList()
            };
        }

        private static InterviewQuestion CreateTaxComplianceQuestion(List<VisaType> remainingVisaTypes)
        {
            return new InterviewQuestion
            {
                Key = "taxCompliance",
                Question = "Have you filed all required tax returns and paid taxes owed?",
                Type = "single_choice",
                Options = new List<InterviewOption>
                {
                    new() { Value = "yes", Label = "Yes, fully tax compliant" },
                    new() { Value = "no", Label = "No, have tax issues" },
                    new() { Value = "resolving", Label = "Currently resolving tax issues" },
                    new() { Value = "exempt", Label = "Not required to file taxes" }
                },
                RemainingVisaTypes = remainingVisaTypes.Count,
                RemainingVisaCodes = remainingVisaTypes.Select(v => v.Code).ToList()
            };
        }

        private static InterviewQuestion CreateMilitaryServiceQuestion(List<VisaType> remainingVisaTypes)
        {
            return new InterviewQuestion
            {
                Key = "militaryService",
                Question = "Have you served in the US military?",
                Type = "single_choice",
                Options = new List<InterviewOption>
                {
                    new() { Value = "yes", Label = "Yes, served in US military" },
                    new() { Value = "no", Label = "No military service" },
                    new() { Value = "foreign", Label = "Served in foreign military" }
                },
                RemainingVisaTypes = remainingVisaTypes.Count,
                RemainingVisaCodes = remainingVisaTypes.Select(v => v.Code).ToList()
            };
        }

        private static InterviewQuestion CreateOathWillingnessQuestion(List<VisaType> remainingVisaTypes)
        {
            return new InterviewQuestion
            {
                Key = "oathWillingness",
                Question = "Are you willing to take the Oath of Allegiance to the United States?",
                Type = "single_choice",
                Options = new List<InterviewOption>
                {
                    new() { Value = "yes", Label = "Yes, willing to take oath" },
                    new() { Value = "no", Label = "No, not willing" },
                    new() { Value = "religious_objection", Label = "Religious objection to oath" }
                },
                RemainingVisaTypes = remainingVisaTypes.Count,
                RemainingVisaCodes = remainingVisaTypes.Select(v => v.Code).ToList()
            };
        }

        private static InterviewQuestion CreateMarriedToUSCitizenQuestion(List<VisaType> remainingVisaTypes)
        {
            return new InterviewQuestion
            {
                Key = "marriedToUSCitizen",
                Question = "Are you married to a US citizen?",
                Type = "single_choice",
                Options = new List<InterviewOption>
                {
                    new() { Value = "yes", Label = "Yes, married to US citizen" },
                    new() { Value = "no", Label = "No, not married to US citizen" },
                    new() { Value = "divorced", Label = "Previously married to US citizen (divorced)" },
                    new() { Value = "widowed", Label = "Previously married to US citizen (widowed)" }
                },
                RemainingVisaTypes = remainingVisaTypes.Count,
                RemainingVisaCodes = remainingVisaTypes.Select(v => v.Code).ToList()
            };
        }

        private static InterviewQuestion CreateParentUSCitizenQuestion(List<VisaType> remainingVisaTypes)
        {
            return new InterviewQuestion
            {
                Key = "parentUSCitizen",
                Question = "Is at least one of your parents a US citizen?",
                Type = "single_choice",
                Options = new List<InterviewOption>
                {
                    new() { Value = "yes", Label = "Yes, at least one parent is US citizen" },
                    new() { Value = "no", Label = "No, parents are not US citizens" },
                    new() { Value = "naturalized", Label = "Parent became US citizen after my birth" },
                    new() { Value = "unknown", Label = "Unknown or uncertain" }
                },
                RemainingVisaTypes = remainingVisaTypes.Count,
                RemainingVisaCodes = remainingVisaTypes.Select(v => v.Code).ToList()
            };
        }

        private static InterviewQuestion CreateBornAbroadQuestion(List<VisaType> remainingVisaTypes)
        {
            return new InterviewQuestion
            {
                Key = "bornAbroad",
                Question = "Were you born outside the United States?",
                Type = "single_choice",
                Options = new List<InterviewOption>
                {
                    new() { Value = "yes", Label = "Yes, born outside the US" },
                    new() { Value = "no", Label = "No, born in the US" },
                    new() { Value = "territory", Label = "Born in US territory" }
                },
                RemainingVisaTypes = remainingVisaTypes.Count,
                RemainingVisaCodes = remainingVisaTypes.Select(v => v.Code).ToList()
            };
        }

        private static InterviewQuestion CreateUnder18WhenParentNaturalizedQuestion(List<VisaType> remainingVisaTypes)
        {
            return new InterviewQuestion
            {
                Key = "under18WhenParentNaturalized",
                Question = "Were you under 18 years old when your parent became a US citizen?",
                Type = "single_choice",
                Options = new List<InterviewOption>
                {
                    new() { Value = "yes", Label = "Yes, under 18 when parent naturalized" },
                    new() { Value = "no", Label = "No, 18 or older when parent naturalized" },
                    new() { Value = "not_applicable", Label = "Parent was citizen at my birth" }
                },
                RemainingVisaTypes = remainingVisaTypes.Count,
                RemainingVisaCodes = remainingVisaTypes.Select(v => v.Code).ToList()
            };
        }

        // Citizenship-specific filtering methods
        private static bool IsVisaApplicableForCurrentStatus(string visaCode, string currentStatus)
        {
            return currentStatus.ToLowerInvariant() switch
            {
                "permanent_resident" => visaCode == "N-400",
                "derived_citizen" => visaCode == "N-600",
                "us_citizen_born_abroad" => visaCode == "N-600",
                "conditional_resident" => visaCode == "N-400", // May need to remove conditions first
                _ => new[] { "N-400", "N-600" }.Contains(visaCode)
            };
        }

        private static bool IsVisaApplicableForResidencyYears(string visaCode, string residencyYears)
        {
            if (visaCode != "N-400") return true; // Only applies to N-400

            return int.TryParse(residencyYears, out var years) && years >= 3; // Minimum 3 years for married to citizen, 5 for others
        }

        private static bool IsVisaApplicableForMaritalStatusToCitizen(string visaCode, string marriedToUSCitizen)
        {
            if (visaCode != "N-400") return true; // Only applies to N-400

            // Both married and unmarried can apply for N-400, just different requirements
            return true;
        }
    }
}

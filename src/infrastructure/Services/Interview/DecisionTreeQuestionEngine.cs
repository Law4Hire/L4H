using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using Microsoft.EntityFrameworkCore;

namespace L4H.Infrastructure.Services.Interview;

/// <summary>
/// Hierarchical decision tree question engine that guides users through
/// a structured interview process to determine their visa options.
///
/// Flow:
/// 1. Location (in/outside US) + Category (immigrant/nonimmigrant/citizen/investor)
/// 2. Category-specific narrowing questions
/// 3. Contact information collection
/// </summary>
public class DecisionTreeQuestionEngine : IQuestionEngine
{
    private readonly L4HDbContext _context;
    private readonly IVisaEvaluationEngine _evaluationEngine;

    public DecisionTreeQuestionEngine(L4HDbContext context, IVisaEvaluationEngine evaluationEngine)
    {
        _context = context;
        _evaluationEngine = evaluationEngine;
    }

    public async Task<InterviewQuestion?> GetNextQuestionAsync(
        InterviewSession session,
        List<InterviewQA> answeredQuestions)
    {
        var answers = answeredQuestions.ToDictionary(qa => qa.QuestionKey, qa => qa.AnswerValue);

        // Step 1: Location question
        if (!answers.ContainsKey("location"))
        {
            return GetLocationQuestion();
        }

        // Step 2: Category question
        if (!answers.ContainsKey("category"))
        {
            return GetCategoryQuestion();
        }

        var category = answers["category"];

        // Step 3: Category-specific questions
        switch (category)
        {
            case "nonimmigrant":
                return GetNonimmigrantQuestions(answers);

            case "immigrant":
                return GetImmigrantQuestions(answers);

            case "citizen":
                return GetCitizenshipQuestions(answers);

            case "investor":
                return GetInvestorQuestions(answers);

            case "family":
                return GetFamilyBasedQuestions(answers);

            case "student":
                return GetStudentQuestions(answers);
        }

        // Step 4: Contact information collection
        if (!HasAllContactInfo(answers))
        {
            return GetContactInfoQuestion(answers);
        }

        // All done
        return null;
    }

    public async Task<bool> IsCompleteAsync(
        List<VisaType> remainingVisas,
        int questionsAnswered)
    {
        // Complete when we have location, category, specific visa narrowing, and contact info
        // This will be determined by GetNextQuestionAsync returning null
        return false; // Let GetNextQuestionAsync drive completion
    }

    private InterviewQuestion GetLocationQuestion()
    {
        return new InterviewQuestion
        {
            Key = "location",
            Text = "Are you currently inside or outside the United States?",
            Category = "foundation",
            InputType = "select",
            Order = 1,
            IsRequired = true,
            Options = new List<QuestionOption>
            {
                new() { Value = "inside_us", Label = "Inside the United States" },
                new() { Value = "outside_us", Label = "Outside the United States" }
            }
        };
    }

    private InterviewQuestion GetCategoryQuestion()
    {
        return new InterviewQuestion
        {
            Key = "category",
            Text = "What is your primary immigration purpose?",
            Category = "foundation",
            InputType = "select",
            Order = 2,
            IsRequired = true,
            Options = new List<QuestionOption>
            {
                new() { Value = "nonimmigrant", Label = "Nonimmigrant (Temporary stay/work)" },
                new() { Value = "immigrant", Label = "Immigrant (Permanent residence/Green Card)" },
                new() { Value = "family", Label = "Family-based immigration" },
                new() { Value = "student", Label = "Student visa" },
                new() { Value = "investor", Label = "Investor visa" },
                new() { Value = "citizen", Label = "US Citizenship/Naturalization" }
            }
        };
    }

    #region Nonimmigrant Worker Path

    private InterviewQuestion? GetNonimmigrantQuestions(Dictionary<string, string> answers)
    {
        // First, determine the specific nonimmigrant subcategory
        if (!answers.ContainsKey("nonimmigrant_type"))
        {
            return new InterviewQuestion
            {
                Key = "nonimmigrant_type",
                Text = "What type of nonimmigrant visa are you seeking?",
                Category = "nonimmigrant",
                InputType = "select",
                Order = 3,
                IsRequired = true,
                Options = new List<QuestionOption>
                {
                    new() { Value = "work", Label = "Work/Employment" },
                    new() { Value = "business", Label = "Business visitor" },
                    new() { Value = "tourism", Label = "Tourism/Visit" },
                    new() { Value = "exchange", Label = "Exchange visitor program" },
                    new() { Value = "other", Label = "Other temporary purpose" }
                }
            };
        }

        var nonimmigrantType = answers["nonimmigrant_type"];

        // For work visas, narrow down further
        if (nonimmigrantType == "work" && !answers.ContainsKey("work_visa_type"))
        {
            return new InterviewQuestion
            {
                Key = "work_visa_type",
                Text = "Which work visa category best describes your situation?",
                Category = "nonimmigrant",
                InputType = "select",
                Order = 4,
                IsRequired = true,
                Options = new List<QuestionOption>
                {
                    new() { Value = "H-1B", Label = "H-1B - Specialty occupation requiring bachelor's degree or higher" },
                    new() { Value = "L-1", Label = "L-1 - Intracompany transferee (manager, executive, or specialized knowledge)" },
                    new() { Value = "O-1", Label = "O-1 - Extraordinary ability in sciences, arts, education, business, or athletics" },
                    new() { Value = "E-2", Label = "E-2 - Treaty investor" },
                    new() { Value = "TN", Label = "TN - NAFTA professional (Canadian or Mexican)" },
                    new() { Value = "H-2A", Label = "H-2A - Temporary agricultural worker" },
                    new() { Value = "H-2B", Label = "H-2B - Temporary non-agricultural worker" },
                    new() { Value = "other", Label = "Other work visa" }
                }
            };
        }

        // Additional refinement questions based on specific visa type
        if (nonimmigrantType == "work" && answers.ContainsKey("work_visa_type"))
        {
            var workVisaType = answers["work_visa_type"];

            // H-1B specific questions
            if (workVisaType == "H-1B" && !answers.ContainsKey("h1b_employer"))
            {
                return new InterviewQuestion
                {
                    Key = "h1b_employer",
                    Text = "Do you have a US employer willing to sponsor your H-1B visa?",
                    Category = "nonimmigrant",
                    InputType = "radio",
                    Order = 5,
                    IsRequired = true,
                    Options = new List<QuestionOption>
                    {
                        new() { Value = "yes", Label = "Yes, I have an employer sponsor" },
                        new() { Value = "no", Label = "No, but I'm looking for one" },
                        new() { Value = "unsure", Label = "Not sure yet" }
                    }
                };
            }

            // L-1 specific questions
            if (workVisaType == "L-1" && !answers.ContainsKey("l1_company_relationship"))
            {
                return new InterviewQuestion
                {
                    Key = "l1_company_relationship",
                    Text = "Have you worked for a related foreign company for at least 1 year in the past 3 years?",
                    Category = "nonimmigrant",
                    InputType = "radio",
                    Order = 5,
                    IsRequired = true,
                    Options = new List<QuestionOption>
                    {
                        new() { Value = "yes", Label = "Yes" },
                        new() { Value = "no", Label = "No" }
                    }
                };
            }

            // O-1 specific questions
            if (workVisaType == "O-1" && !answers.ContainsKey("o1_recognition"))
            {
                return new InterviewQuestion
                {
                    Key = "o1_recognition",
                    Text = "Do you have sustained national or international acclaim in your field?",
                    Category = "nonimmigrant",
                    InputType = "radio",
                    Order = 5,
                    IsRequired = true,
                    Options = new List<QuestionOption>
                    {
                        new() { Value = "yes", Label = "Yes, with documentation (awards, media coverage, etc.)" },
                        new() { Value = "maybe", Label = "I'm not sure if I qualify" },
                        new() { Value = "no", Label = "No" }
                    }
                };
            }
        }

        return null; // Move to contact info
    }

    #endregion

    #region Immigrant EB Path

    private InterviewQuestion? GetImmigrantQuestions(Dictionary<string, string> answers)
    {
        // Determine employment-based vs other immigrant paths
        if (!answers.ContainsKey("immigrant_basis"))
        {
            return new InterviewQuestion
            {
                Key = "immigrant_basis",
                Text = "What is the basis for your immigrant visa application?",
                Category = "immigrant",
                InputType = "select",
                Order = 3,
                IsRequired = true,
                Options = new List<QuestionOption>
                {
                    new() { Value = "employment", Label = "Employment-based (EB)" },
                    new() { Value = "family", Label = "Family-based" },
                    new() { Value = "diversity", Label = "Diversity Visa Lottery" },
                    new() { Value = "humanitarian", Label = "Humanitarian (refugee, asylee)" },
                    new() { Value = "other", Label = "Other" }
                }
            };
        }

        var immigrantBasis = answers["immigrant_basis"];

        // Employment-based immigrant visas (EB-1, EB-2, EB-3, EB-5)
        if (immigrantBasis == "employment" && !answers.ContainsKey("eb_category"))
        {
            return new InterviewQuestion
            {
                Key = "eb_category",
                Text = "Which employment-based category best describes your qualifications?",
                Category = "immigrant",
                InputType = "select",
                Order = 4,
                IsRequired = true,
                Options = new List<QuestionOption>
                {
                    new() { Value = "EB-1", Label = "EB-1 - Extraordinary ability, outstanding professors/researchers, or multinational executives" },
                    new() { Value = "EB-2", Label = "EB-2 - Advanced degree (Master's or higher) or exceptional ability" },
                    new() { Value = "EB-3", Label = "EB-3 - Skilled workers, professionals, or other workers" },
                    new() { Value = "EB-5", Label = "EB-5 - Immigrant investor ($800,000 or $1,050,000)" },
                    new() { Value = "unsure", Label = "Not sure which category" }
                }
            };
        }

        // EB category refinement
        if (immigrantBasis == "employment" && answers.ContainsKey("eb_category"))
        {
            var ebCategory = answers["eb_category"];

            // EB-1 refinement
            if (ebCategory == "EB-1" && !answers.ContainsKey("eb1_type"))
            {
                return new InterviewQuestion
                {
                    Key = "eb1_type",
                    Text = "Which EB-1 subcategory applies to you?",
                    Category = "immigrant",
                    InputType = "select",
                    Order = 5,
                    IsRequired = true,
                    Options = new List<QuestionOption>
                    {
                        new() { Value = "EB-1A", Label = "EB-1A - Extraordinary ability in sciences, arts, education, business, or athletics" },
                        new() { Value = "EB-1B", Label = "EB-1B - Outstanding professor or researcher" },
                        new() { Value = "EB-1C", Label = "EB-1C - Multinational manager or executive" }
                    }
                };
            }

            // EB-2 refinement
            if (ebCategory == "EB-2" && !answers.ContainsKey("eb2_niw"))
            {
                return new InterviewQuestion
                {
                    Key = "eb2_niw",
                    Text = "Are you seeking a National Interest Waiver (NIW) to self-petition without employer sponsorship?",
                    Category = "immigrant",
                    InputType = "radio",
                    Order = 5,
                    IsRequired = true,
                    Options = new List<QuestionOption>
                    {
                        new() { Value = "yes", Label = "Yes, I want to apply for NIW" },
                        new() { Value = "no", Label = "No, I have employer sponsorship" },
                        new() { Value = "unsure", Label = "Not sure" }
                    }
                };
            }

            // EB-3 refinement
            if (ebCategory == "EB-3" && !answers.ContainsKey("eb3_category"))
            {
                return new InterviewQuestion
                {
                    Key = "eb3_category",
                    Text = "Which EB-3 category do you fall under?",
                    Category = "immigrant",
                    InputType = "select",
                    Order = 5,
                    IsRequired = true,
                    Options = new List<QuestionOption>
                    {
                        new() { Value = "skilled", Label = "Skilled worker - At least 2 years training or experience" },
                        new() { Value = "professional", Label = "Professional - Bachelor's degree required" },
                        new() { Value = "other", Label = "Other worker - Less than 2 years experience" }
                    }
                };
            }
        }

        return null; // Move to contact info
    }

    #endregion

    #region Family-Based Path

    private InterviewQuestion? GetFamilyBasedQuestions(Dictionary<string, string> answers)
    {
        // Determine who is the petitioner
        if (!answers.ContainsKey("family_petitioner"))
        {
            return new InterviewQuestion
            {
                Key = "family_petitioner",
                Text = "Who is petitioning for you?",
                Category = "family",
                InputType = "select",
                Order = 3,
                IsRequired = true,
                Options = new List<QuestionOption>
                {
                    new() { Value = "us_citizen", Label = "US Citizen family member" },
                    new() { Value = "green_card", Label = "Green Card holder (Permanent Resident)" },
                    new() { Value = "self", Label = "I'm petitioning for a family member" }
                }
            };
        }

        var petitioner = answers["family_petitioner"];

        // Immediate relatives of US citizens
        if (petitioner == "us_citizen" && !answers.ContainsKey("relationship_to_citizen"))
        {
            return new InterviewQuestion
            {
                Key = "relationship_to_citizen",
                Text = "What is your relationship to the US citizen?",
                Category = "family",
                InputType = "select",
                Order = 4,
                IsRequired = true,
                Options = new List<QuestionOption>
                {
                    new() { Value = "spouse", Label = "Spouse" },
                    new() { Value = "parent", Label = "Parent of US citizen (age 21+)" },
                    new() { Value = "child_under21", Label = "Unmarried child under 21" },
                    new() { Value = "child_over21", Label = "Unmarried son or daughter over 21" },
                    new() { Value = "married_child", Label = "Married son or daughter" },
                    new() { Value = "sibling", Label = "Brother or sister" },
                    new() { Value = "fiance", Label = "Fiancé(e)" }
                }
            };
        }

        // Spouse visa specifics (IR-1 vs CR-1)
        if (answers.ContainsKey("relationship_to_citizen") &&
            answers["relationship_to_citizen"] == "spouse" &&
            !answers.ContainsKey("marriage_duration"))
        {
            return new InterviewQuestion
            {
                Key = "marriage_duration",
                Text = "How long have you been married?",
                Category = "family",
                InputType = "select",
                Order = 5,
                IsRequired = true,
                Options = new List<QuestionOption>
                {
                    new() { Value = "over_2_years", Label = "2 years or more (IR-1 - Immediate Relative)" },
                    new() { Value = "under_2_years", Label = "Less than 2 years (CR-1 - Conditional Resident)" }
                }
            };
        }

        // Green card holder sponsorship
        if (petitioner == "green_card" && !answers.ContainsKey("relationship_to_lpr"))
        {
            return new InterviewQuestion
            {
                Key = "relationship_to_lpr",
                Text = "What is your relationship to the Green Card holder?",
                Category = "family",
                InputType = "select",
                Order = 4,
                IsRequired = true,
                Options = new List<QuestionOption>
                {
                    new() { Value = "spouse", Label = "Spouse (F2A)" },
                    new() { Value = "child_under21", Label = "Unmarried child under 21 (F2A)" },
                    new() { Value = "child_over21", Label = "Unmarried son or daughter over 21 (F2B)" }
                }
            };
        }

        return null; // Move to contact info
    }

    #endregion

    #region Student Path

    private InterviewQuestion? GetStudentQuestions(Dictionary<string, string> answers)
    {
        if (!answers.ContainsKey("student_visa_type"))
        {
            return new InterviewQuestion
            {
                Key = "student_visa_type",
                Text = "What type of educational program will you pursue?",
                Category = "student",
                InputType = "select",
                Order = 3,
                IsRequired = true,
                Options = new List<QuestionOption>
                {
                    new() { Value = "F-1", Label = "F-1 - Academic studies at accredited US institution" },
                    new() { Value = "M-1", Label = "M-1 - Vocational or technical studies" },
                    new() { Value = "J-1", Label = "J-1 - Exchange visitor program" }
                }
            };
        }

        if (!answers.ContainsKey("acceptance_status"))
        {
            return new InterviewQuestion
            {
                Key = "acceptance_status",
                Text = "Have you been accepted to a US educational institution?",
                Category = "student",
                InputType = "radio",
                Order = 4,
                IsRequired = true,
                Options = new List<QuestionOption>
                {
                    new() { Value = "yes", Label = "Yes, I have an acceptance letter" },
                    new() { Value = "applying", Label = "I'm currently applying" },
                    new() { Value = "no", Label = "Not yet" }
                }
            };
        }

        return null; // Move to contact info
    }

    #endregion

    #region Citizenship Path

    private InterviewQuestion? GetCitizenshipQuestions(Dictionary<string, string> answers)
    {
        if (!answers.ContainsKey("citizenship_basis"))
        {
            return new InterviewQuestion
            {
                Key = "citizenship_basis",
                Text = "What is the basis for your citizenship application?",
                Category = "citizenship",
                InputType = "select",
                Order = 3,
                IsRequired = true,
                Options = new List<QuestionOption>
                {
                    new() { Value = "naturalization", Label = "Naturalization (I've been a Green Card holder)" },
                    new() { Value = "birth_abroad", Label = "Citizenship through US citizen parent(s)" },
                    new() { Value = "military", Label = "Military service" },
                    new() { Value = "other", Label = "Other" }
                }
            };
        }

        var basis = answers["citizenship_basis"];

        if (basis == "naturalization" && !answers.ContainsKey("green_card_duration"))
        {
            return new InterviewQuestion
            {
                Key = "green_card_duration",
                Text = "How long have you been a permanent resident (Green Card holder)?",
                Category = "citizenship",
                InputType = "select",
                Order = 4,
                IsRequired = true,
                Options = new List<QuestionOption>
                {
                    new() { Value = "5_years", Label = "5 years or more" },
                    new() { Value = "3_years_married", Label = "3+ years (married to US citizen)" },
                    new() { Value = "under_3", Label = "Less than 3 years" }
                }
            };
        }

        return null; // Move to contact info
    }

    #endregion

    #region Investor Path

    private InterviewQuestion? GetInvestorQuestions(Dictionary<string, string> answers)
    {
        if (!answers.ContainsKey("investment_amount"))
        {
            return new InterviewQuestion
            {
                Key = "investment_amount",
                Text = "How much capital are you planning to invest?",
                Category = "investor",
                InputType = "select",
                Order = 3,
                IsRequired = true,
                Options = new List<QuestionOption>
                {
                    new() { Value = "eb5_tep", Label = "$800,000+ (EB-5 Targeted Employment Area)" },
                    new() { Value = "eb5_standard", Label = "$1,050,000+ (EB-5 Standard)" },
                    new() { Value = "e2", Label = "$100,000-$500,000 (E-2 Treaty Investor)" },
                    new() { Value = "under_100k", Label = "Under $100,000" }
                }
            };
        }

        var investment = answers["investment_amount"];

        if ((investment == "eb5_tep" || investment == "eb5_standard") &&
            !answers.ContainsKey("eb5_project_type"))
        {
            return new InterviewQuestion
            {
                Key = "eb5_project_type",
                Text = "What type of EB-5 investment are you considering?",
                Category = "investor",
                InputType = "select",
                Order = 4,
                IsRequired = true,
                Options = new List<QuestionOption>
                {
                    new() { Value = "regional_center", Label = "Regional Center (indirect job creation)" },
                    new() { Value = "direct", Label = "Direct investment (create/manage business)" }
                }
            };
        }

        if (investment == "e2" && !answers.ContainsKey("e2_treaty_country"))
        {
            return new InterviewQuestion
            {
                Key = "e2_treaty_country",
                Text = "Are you a national of a country with an E-2 treaty with the United States?",
                Category = "investor",
                InputType = "radio",
                Order = 4,
                IsRequired = true,
                Options = new List<QuestionOption>
                {
                    new() { Value = "yes", Label = "Yes" },
                    new() { Value = "no", Label = "No" },
                    new() { Value = "unsure", Label = "Not sure" }
                }
            };
        }

        return null; // Move to contact info
    }

    #endregion

    #region Contact Information Collection

    private bool HasAllContactInfo(Dictionary<string, string> answers)
    {
        return answers.ContainsKey("full_name") &&
               answers.ContainsKey("email") &&
               answers.ContainsKey("phone") &&
               answers.ContainsKey("current_country") &&
               (answers.ContainsKey("us_address") || answers.ContainsKey("foreign_address"));
    }

    private InterviewQuestion? GetContactInfoQuestion(Dictionary<string, string> answers)
    {
        // Collect contact information in sequence
        if (!answers.ContainsKey("full_name"))
        {
            return new InterviewQuestion
            {
                Key = "full_name",
                Text = "What is your full legal name (as shown on your passport)?",
                Category = "contact",
                InputType = "text",
                Order = 100,
                IsRequired = true,
                Options = new List<QuestionOption>()
            };
        }

        if (!answers.ContainsKey("email"))
        {
            return new InterviewQuestion
            {
                Key = "email",
                Text = "What is your email address?",
                Category = "contact",
                InputType = "email",
                Order = 101,
                IsRequired = true,
                Options = new List<QuestionOption>()
            };
        }

        if (!answers.ContainsKey("phone"))
        {
            return new InterviewQuestion
            {
                Key = "phone",
                Text = "What is your phone number with country code? (e.g., +1-555-123-4567)",
                Category = "contact",
                InputType = "tel",
                Order = 102,
                IsRequired = true,
                Options = new List<QuestionOption>()
            };
        }

        if (!answers.ContainsKey("current_country"))
        {
            return new InterviewQuestion
            {
                Key = "current_country",
                Text = "What country do you currently reside in?",
                Category = "contact",
                InputType = "text",
                Order = 103,
                IsRequired = true,
                Options = new List<QuestionOption>()
            };
        }

        var location = answers.GetValueOrDefault("location", "");

        if (location == "inside_us" && !answers.ContainsKey("us_address"))
        {
            return new InterviewQuestion
            {
                Key = "us_address",
                Text = "What is your current US address?",
                Category = "contact",
                InputType = "textarea",
                Order = 104,
                IsRequired = true,
                Options = new List<QuestionOption>()
            };
        }

        if (location == "inside_us" && !answers.ContainsKey("residence_status"))
        {
            return new InterviewQuestion
            {
                Key = "residence_status",
                Text = "What is your current residence arrangement in the US?",
                Category = "contact",
                InputType = "select",
                Order = 105,
                IsRequired = false,
                Options = new List<QuestionOption>
                {
                    new() { Value = "own_mortgage", Label = "Own with mortgage" },
                    new() { Value = "own_outright", Label = "Own outright" },
                    new() { Value = "rent", Label = "Rent" },
                    new() { Value = "family", Label = "Living with family/friends" },
                    new() { Value = "other", Label = "Other" }
                }
            };
        }

        if (location == "outside_us" && !answers.ContainsKey("foreign_address"))
        {
            return new InterviewQuestion
            {
                Key = "foreign_address",
                Text = "What is your current address outside the US?",
                Category = "contact",
                InputType = "textarea",
                Order = 104,
                IsRequired = true,
                Options = new List<QuestionOption>()
            };
        }

        return null; // All contact info collected
    }

    #endregion
}

using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using Microsoft.EntityFrameworkCore;

namespace L4H.Infrastructure.Services.Interview;

/// <summary>
/// Version 2 of the Decision Tree Question Engine - complete refactor matching React prototype
/// Flow: Location → Status → Category → Subcategory → Checklist → Evaluation → Contact Info
/// </summary>
public class DecisionTreeQuestionEngineV2 : IQuestionEngine
{
    private readonly L4HDbContext _context;
    private readonly IVisaEvaluationEngine _evaluationEngine;

    public DecisionTreeQuestionEngineV2(L4HDbContext context, IVisaEvaluationEngine evaluationEngine)
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

        // Step 2: Status question (NEW - replaces old "category")
        if (!answers.ContainsKey("status"))
        {
            return GetStatusQuestion();
        }

        var status = answers["status"];

        // Step 3: Category question (based on status)
        if (!answers.ContainsKey("category"))
        {
            return GetCategoryQuestion(status);
        }

        var category = answers["category"];

        // Step 4: Subcategory question (if applicable for this category)
        if (RequiresSubcategory(status, category) && !answers.ContainsKey("subcategory"))
        {
            return GetSubcategoryQuestion(status, category);
        }

        // Step 5: Eligibility checklist questions (if subcategory has one)
        var subcategory = answers.ContainsKey("subcategory") ? answers["subcategory"] : null;
        if (!string.IsNullOrEmpty(subcategory) && HasChecklist(subcategory))
        {
            var checklistComplete = await IsChecklistComplete(subcategory, answers);
            if (!checklistComplete)
            {
                return GetNextChecklistQuestion(subcategory, answers);
            }
        }

        // Step 6: Evaluation happens here (handled by orchestrator before contact info)
        // This engine returns null, orchestrator runs evaluation, then asks for contact

        // Step 7: Contact information collection
        if (!HasAllContactInfo(answers))
        {
            return await GetContactInfoQuestion(answers);
        }

        // All done
        return null;
    }

    public async Task<bool> IsCompleteAsync(
        List<VisaType> remainingVisas,
        int questionsAnswered)
    {
        // Completion is determined by GetNextQuestionAsync returning null
        return false;
    }

    #region Step 1: Location Question

    private InterviewQuestion GetLocationQuestion()
    {
        return new InterviewQuestion
        {
            Key = "location",
            Text = "Where are you currently located?",
            Category = "foundation",
            InputType = "select",
            Order = 1,
            IsRequired = true,
            Options = new List<QuestionOption>
            {
                new() { Value = "inside", Label = "Inside the United States" },
                new() { Value = "outside", Label = "Outside the United States" }
            }
        };
    }

    #endregion

    #region Step 2: Status Question (NEW)

    private InterviewQuestion GetStatusQuestion()
    {
        return new InterviewQuestion
        {
            Key = "status",
            Text = "What is your current status?",
            Category = "foundation",
            InputType = "select",
            Order = 2,
            IsRequired = true,
            Options = new List<QuestionOption>
            {
                new() { Value = "immigrant", Label = "Immigrant/Permanent Resident - Green card holder or seeking permanent residency" },
                new() { Value = "nonimmigrant", Label = "Nonimmigrant - Temporary visa holder (work, student, visitor)" },
                new() { Value = "citizen", Label = "U.S. Citizen - Helping family members immigrate" },
                new() { Value = "investor", Label = "Investor/Entrepreneur - Investment-based immigration options" },
                new() { Value = "asylum", Label = "Asylum Seeker/Refugee - Seeking protection or humanitarian relief" },
                new() { Value = "undocumented", Label = "Undocumented/Other - No current legal status or other situation" }
            }
        };
    }

    #endregion

    #region Step 3: Category Question (Status-Based)

    private InterviewQuestion GetCategoryQuestion(string status)
    {
        return status switch
        {
            "immigrant" => GetImmigrantCategoryQuestion(),
            "nonimmigrant" => GetNonimmigrantCategoryQuestion(),
            "citizen" => GetCitizenCategoryQuestion(),
            "investor" => GetInvestorCategoryQuestion(),
            "asylum" => GetAsylumCategoryQuestion(),
            "undocumented" => GetUndocumentedCategoryQuestion(),
            _ => throw new ArgumentException($"Unknown status: {status}")
        };
    }

    private InterviewQuestion GetImmigrantCategoryQuestion()
    {
        return new InterviewQuestion
        {
            Key = "category",
            Text = "What type of help do you need?",
            Category = "immigrant",
            InputType = "select",
            Order = 3,
            IsRequired = true,
            Options = new List<QuestionOption>
            {
                new() { Value = "green_card_employment", Label = "Employment-Based Green Card - EB-1, EB-2, EB-3, EB-4, EB-5" },
                new() { Value = "green_card_family", Label = "Family-Based Green Card - Sponsored by family member" },
                new() { Value = "renew_replace", Label = "Renew/Replace Green Card - Lost, stolen, or expired green card" },
                new() { Value = "citizenship", Label = "Naturalization/Citizenship - Become a U.S. citizen" },
                new() { Value = "removal", Label = "Removal/Deportation Defense - Fighting deportation proceedings" }
            }
        };
    }

    private InterviewQuestion GetNonimmigrantCategoryQuestion()
    {
        return new InterviewQuestion
        {
            Key = "category",
            Text = "What type of help do you need?",
            Category = "nonimmigrant",
            InputType = "select",
            Order = 3,
            IsRequired = true,
            Options = new List<QuestionOption>
            {
                new() { Value = "work_visa", Label = "Work Visa - H-1B, L-1, O-1, and other employment visas" },
                new() { Value = "student_visa", Label = "Student Visa - F-1, M-1, J-1 student programs" },
                new() { Value = "visitor_visa", Label = "Visitor/Tourist Visa - B-1 business, B-2 tourism" },
                new() { Value = "visa_extension", Label = "Extend/Change Visa Status - Modify your current nonimmigrant visa" },
                new() { Value = "adjust_status", Label = "Adjust to Permanent Status - Transition to green card" }
            }
        };
    }

    private InterviewQuestion GetCitizenCategoryQuestion()
    {
        return new InterviewQuestion
        {
            Key = "category",
            Text = "What type of help do you need?",
            Category = "citizen",
            InputType = "select",
            Order = 3,
            IsRequired = true,
            Options = new List<QuestionOption>
            {
                new() { Value = "family_petition", Label = "Family-Based Petition - Sponsor spouse, children, parents, or siblings" },
                new() { Value = "fiance_visa", Label = "Fiancé(e) Visa (K-1) - Bring fiancé(e) to the U.S." },
                new() { Value = "consular_processing", Label = "Consular Processing - Help family abroad with visa interview" }
            }
        };
    }

    private InterviewQuestion GetInvestorCategoryQuestion()
    {
        return new InterviewQuestion
        {
            Key = "category",
            Text = "What type of help do you need?",
            Category = "investor",
            InputType = "select",
            Order = 3,
            IsRequired = true,
            Options = new List<QuestionOption>
            {
                new() { Value = "eb5", Label = "EB-5 Investor Visa - Investment-based green card" },
                new() { Value = "e2", Label = "E-2 Treaty Investor - Investment from treaty country" },
                new() { Value = "l1", Label = "L-1 Intracompany Transfer - Transfer to U.S. office" }
            }
        };
    }

    private InterviewQuestion GetAsylumCategoryQuestion()
    {
        return new InterviewQuestion
        {
            Key = "category",
            Text = "What type of help do you need?",
            Category = "asylum",
            InputType = "select",
            Order = 3,
            IsRequired = true,
            Options = new List<QuestionOption>
            {
                new() { Value = "asylum_app", Label = "Asylum Application - Apply for asylum protection" },
                new() { Value = "refugee", Label = "Refugee Status - Refugee resettlement" },
                new() { Value = "tps", Label = "TPS/Humanitarian Relief - Temporary Protected Status" }
            }
        };
    }

    private InterviewQuestion GetUndocumentedCategoryQuestion()
    {
        return new InterviewQuestion
        {
            Key = "category",
            Text = "What type of help do you need?",
            Category = "undocumented",
            InputType = "select",
            Order = 3,
            IsRequired = true,
            Options = new List<QuestionOption>
            {
                new() { Value = "daca", Label = "DACA - Deferred Action for Childhood Arrivals" },
                new() { Value = "adjustment_options", Label = "Explore Legal Options - Find pathways to legal status" },
                new() { Value = "deportation_defense", Label = "Deportation Defense - Fight removal proceedings" },
                new() { Value = "waiver", Label = "Waivers - Forgiveness for past violations" }
            }
        };
    }

    #endregion

    #region Step 4: Subcategory Question

    private bool RequiresSubcategory(string status, string category)
    {
        // Categories that go directly to results/contact without subcategory selection
        var skipSubcategory = new[]
        {
            "green_card_family", "renew_replace", "citizenship", "removal",
            "adjust_status", "fiance_visa", "consular_processing",
            "eb5", "e2", "l1",
            "asylum_app", "refugee", "tps",
            "daca", "adjustment_options", "deportation_defense", "waiver"
        };

        return !skipSubcategory.Contains(category);
    }

    private InterviewQuestion GetSubcategoryQuestion(string status, string category)
    {
        return category switch
        {
            "work_visa" => GetWorkVisaSubcategoryQuestion(),
            "student_visa" => GetStudentVisaSubcategoryQuestion(),
            "visitor_visa" => GetVisitorVisaSubcategoryQuestion(),
            "visa_extension" => GetVisaExtensionSubcategoryQuestion(),
            "green_card_employment" => GetEmploymentGreenCardSubcategoryQuestion(),
            "family_petition" => GetFamilyPetitionSubcategoryQuestion(),
            _ => throw new ArgumentException($"Unknown category requiring subcategory: {category}")
        };
    }

    private InterviewQuestion GetWorkVisaSubcategoryQuestion()
    {
        return new InterviewQuestion
        {
            Key = "subcategory",
            Text = "What type of work visa do you need?",
            Category = "work_visa",
            InputType = "select",
            Order = 4,
            IsRequired = true,
            Options = new List<QuestionOption>
            {
                new() { Value = "H-1B", Label = "H-1B Specialty Occupation - Requires bachelor's degree or higher in specific field" },
                new() { Value = "H-2A", Label = "H-2A Agricultural Worker - Seasonal agricultural employment" },
                new() { Value = "H-2B", Label = "H-2B Temporary Worker - Non-agricultural temporary work" },
                new() { Value = "L-1", Label = "L-1 Intracompany Transfer - Transfer within same company to U.S. office" },
                new() { Value = "O-1", Label = "O-1 Extraordinary Ability - Arts, sciences, business, athletics, or entertainment" },
                new() { Value = "P-1", Label = "P-1 Athlete/Entertainer - Individual or team athletes, entertainment groups" },
                new() { Value = "E-1/E-2", Label = "E-1/E-2 Treaty Trader/Investor - Trade or investment from treaty country" },
                new() { Value = "TN", Label = "TN NAFTA Professional - Canadian or Mexican professionals" },
                new() { Value = "J-1", Label = "J-1 Exchange Visitor - Educational and cultural exchange programs" },
                new() { Value = "R-1", Label = "R-1 Religious Worker - Religious occupations and vocations" }
            }
        };
    }

    private InterviewQuestion GetStudentVisaSubcategoryQuestion()
    {
        return new InterviewQuestion
        {
            Key = "subcategory",
            Text = "What type of student visa do you need?",
            Category = "student_visa",
            InputType = "select",
            Order = 4,
            IsRequired = true,
            Options = new List<QuestionOption>
            {
                new() { Value = "F-1", Label = "F-1 Academic Student - Academic studies at university, college, or language school" },
                new() { Value = "M-1", Label = "M-1 Vocational Student - Vocational or technical training programs" },
                new() { Value = "J-1 Student", Label = "J-1 Exchange Student - Exchange visitor program (high school, university, research)" }
            }
        };
    }

    private InterviewQuestion GetVisitorVisaSubcategoryQuestion()
    {
        return new InterviewQuestion
        {
            Key = "subcategory",
            Text = "What type of visitor visa do you need?",
            Category = "visitor_visa",
            InputType = "select",
            Order = 4,
            IsRequired = true,
            Options = new List<QuestionOption>
            {
                new() { Value = "B-1", Label = "B-1 Business Visitor - Temporary business activities, meetings, conferences" },
                new() { Value = "B-2", Label = "B-2 Tourist Visitor - Tourism, vacation, visit family/friends, medical treatment" },
                new() { Value = "B-1/B-2", Label = "B-1/B-2 Combined - Both business and tourism purposes" }
            }
        };
    }

    private InterviewQuestion GetVisaExtensionSubcategoryQuestion()
    {
        return new InterviewQuestion
        {
            Key = "subcategory",
            Text = "What type of visa service do you need?",
            Category = "visa_extension",
            InputType = "select",
            Order = 4,
            IsRequired = true,
            Options = new List<QuestionOption>
            {
                new() { Value = "Extension of Stay", Label = "Extension of Stay - Extend current nonimmigrant status" },
                new() { Value = "Change of Status", Label = "Change of Status - Change to a different nonimmigrant category" },
                new() { Value = "Reinstatement", Label = "Reinstatement - Reinstate status after falling out of status" }
            }
        };
    }

    private InterviewQuestion GetEmploymentGreenCardSubcategoryQuestion()
    {
        return new InterviewQuestion
        {
            Key = "subcategory",
            Text = "What is your professional background?",
            Category = "green_card_employment",
            InputType = "select",
            Order = 4,
            IsRequired = true,
            Options = new List<QuestionOption>
            {
                new() { Value = "EB-1A", Label = "EB-1A Extraordinary Ability - Top of field: sciences, arts, education, business, athletics" },
                new() { Value = "EB-1B", Label = "EB-1B Outstanding Researcher/Professor - 3+ years research/teaching experience, international recognition" },
                new() { Value = "EB-1C", Label = "EB-1C Multinational Manager/Executive - 1+ year as manager/executive for foreign affiliate" },
                new() { Value = "EB-2 Advanced Degree", Label = "EB-2 Advanced Degree - Master's degree or higher (or bachelor's + 5 years experience)" },
                new() { Value = "EB-2 NIW", Label = "EB-2 NIW (National Interest Waiver) - Work benefits U.S. national interest, no job offer needed" },
                new() { Value = "EB-2 Exceptional Ability", Label = "EB-2 Exceptional Ability - Exceptional ability in sciences, arts, or business" },
                new() { Value = "EB-3 Skilled Worker", Label = "EB-3 Skilled Worker - 2+ years training/experience, not temporary or seasonal" },
                new() { Value = "EB-3 Professional", Label = "EB-3 Professional - Bachelor's degree required for position" },
                new() { Value = "EB-3 Unskilled Worker", Label = "EB-3 Unskilled Worker - Less than 2 years training/experience required" },
                new() { Value = "EB-4", Label = "EB-4 Special Immigrant - Religious workers, broadcasters, certain international employees" },
                new() { Value = "EB-5", Label = "EB-5 Immigrant Investor - $800K-$1.05M investment creating 10+ jobs" }
            }
        };
    }

    private InterviewQuestion GetFamilyPetitionSubcategoryQuestion()
    {
        return new InterviewQuestion
        {
            Key = "subcategory",
            Text = "What is your family relationship?",
            Category = "family_petition",
            InputType = "select",
            Order = 4,
            IsRequired = true,
            Options = new List<QuestionOption>
            {
                new() { Value = "IR1", Label = "IR-1: Spouse of U.S. Citizen - Married 2+ years (Immediate Relative)" },
                new() { Value = "CR1", Label = "CR-1: Spouse of U.S. Citizen - Married less than 2 years (Conditional)" },
                new() { Value = "IR2", Label = "IR-2: Unmarried Child Under 21 - Child of U.S. Citizen (Immediate Relative)" },
                new() { Value = "CR2", Label = "CR-2: Child of CR-1 Applicant - Derivative beneficiary (Conditional)" },
                new() { Value = "IR5", Label = "IR-5: Parent of U.S. Citizen - Petitioner must be 21+ (Immediate Relative)" },
                new() { Value = "F1", Label = "F1: Unmarried Adult Child - 21+ unmarried son/daughter of U.S. Citizen (1st Preference)" },
                new() { Value = "F2A", Label = "F2A: Spouse/Child of LPR - Spouse or child under 21 of Green Card Holder (2A Preference)" },
                new() { Value = "F2B", Label = "F2B: Unmarried Adult Child of LPR - 21+ unmarried son/daughter of Green Card Holder (2B Preference)" },
                new() { Value = "F3", Label = "F3: Married Adult Child - Married son/daughter of U.S. Citizen (3rd Preference)" },
                new() { Value = "F4", Label = "F4: Sibling of U.S. Citizen - Brother/sister of U.S. Citizen 21+ (4th Preference)" }
            }
        };
    }

    #endregion

    #region Step 5: Checklist Questions

    private bool HasChecklist(string subcategory)
    {
        // These visa types have eligibility checklists
        var visasWithChecklists = new[]
        {
            "H-1B", "H-2A", "H-2B", "L-1", "O-1", "P-1", "E-1/E-2", "TN", "R-1",
            "F-1", "M-1", "J-1 Student",
            "B-1", "B-2", "B-1/B-2",
            "Extension of Stay", "Change of Status", "Reinstatement",
            "EB-1A", "EB-1B", "EB-1C", "EB-2 Advanced Degree", "EB-2 NIW", "EB-2 Exceptional Ability",
            "EB-3 Skilled Worker", "EB-3 Professional", "EB-3 Unskilled Worker"
        };

        return visasWithChecklists.Contains(subcategory);
    }

    private async Task<bool> IsChecklistComplete(string subcategory, Dictionary<string, string> answers)
    {
        var checklistQuestions = GetChecklistDefinition(subcategory);
        if (checklistQuestions == null || checklistQuestions.Count == 0)
        {
            return true;
        }

        // Check if all checklist questions have been answered
        foreach (var question in checklistQuestions)
        {
            var checklistKey = $"checklist_{question.id}";
            if (!answers.ContainsKey(checklistKey))
            {
                return false;
            }
        }

        return true;
    }

    private InterviewQuestion? GetNextChecklistQuestion(string subcategory, Dictionary<string, string> answers)
    {
        var checklistQuestions = GetChecklistDefinition(subcategory);
        if (checklistQuestions == null || checklistQuestions.Count == 0)
        {
            return null;
        }

        // Find the first unanswered checklist question
        for (int i = 0; i < checklistQuestions.Count; i++)
        {
            var question = checklistQuestions[i];
            var checklistKey = $"checklist_{question.id}";

            if (!answers.ContainsKey(checklistKey))
            {
                return new InterviewQuestion
                {
                    Key = checklistKey,
                    Text = $"{i + 1}. {question.text}",
                    Category = "checklist",
                    InputType = "radio",
                    Order = 50 + i,
                    IsRequired = true,
                    Options = new List<QuestionOption>
                    {
                        new() { Value = "yes", Label = "Yes" },
                        new() { Value = "no", Label = "No" }
                    }
                };
            }
        }

        return null;
    }

    private List<(string id, string text)>? GetChecklistDefinition(string subcategory)
    {
        return subcategory switch
        {
            // Work Visas
            "H-1B" => GetH1BChecklist(),
            "H-2A" => GetH2AChecklist(),
            "H-2B" => GetH2BChecklist(),
            "L-1" => GetL1Checklist(),
            "O-1" => GetO1Checklist(),
            "P-1" => GetP1Checklist(),
            "E-1/E-2" => GetE1E2Checklist(),
            "TN" => GetTNChecklist(),
            "R-1" => GetR1Checklist(),

            // Student Visas
            "F-1" => GetF1Checklist(),
            "M-1" => GetM1Checklist(),
            "J-1 Student" => GetJ1StudentChecklist(),

            // Visitor Visas
            "B-1" => GetB1Checklist(),
            "B-2" => GetB2Checklist(),
            "B-1/B-2" => GetB1B2Checklist(),

            // Visa Extensions
            "Extension of Stay" => GetExtensionOfStayChecklist(),
            "Change of Status" => GetChangeOfStatusChecklist(),
            "Reinstatement" => GetReinstatementChecklist(),

            // Employment-Based Green Cards
            "EB-1A" => GetEB1AChecklist(),
            "EB-1B" => GetEB1BChecklist(),
            "EB-1C" => GetEB1CChecklist(),
            "EB-2 Advanced Degree" => GetEB2AdvancedDegreeChecklist(),
            "EB-2 NIW" => GetEB2NIWChecklist(),
            "EB-2 Exceptional Ability" => GetEB2ExceptionalAbilityChecklist(),
            "EB-3 Skilled Worker" => GetEB3SkilledWorkerChecklist(),
            "EB-3 Professional" => GetEB3ProfessionalChecklist(),
            "EB-3 Unskilled Worker" => GetEB3UnskilledWorkerChecklist(),

            _ => null
        };
    }

    // Work Visa Checklists
    private List<(string id, string text)> GetH1BChecklist() => new()
    {
        ("degree", "Do you have a bachelor's degree or higher in a specialty field?"),
        ("jobOffer", "Do you have a job offer from a U.S. employer?"),
        ("specialty", "Does the position require specialized knowledge in your field?"),
        ("licenseReq", "If required for the position, do you have the necessary license?")
    };

    private List<(string id, string text)> GetH2AChecklist() => new()
    {
        ("seasonal", "Is the work seasonal or temporary agricultural work?"),
        ("jobOffer", "Do you have a job offer from a U.S. agricultural employer?"),
        ("labor", "Has the employer obtained temporary labor certification?")
    };

    private List<(string id, string text)> GetH2BChecklist() => new()
    {
        ("temporary", "Is the work temporary or seasonal (non-agricultural)?"),
        ("jobOffer", "Do you have a job offer from a U.S. employer?"),
        ("labor", "Has the employer obtained temporary labor certification?")
    };

    private List<(string id, string text)> GetL1Checklist() => new()
    {
        ("employment", "Have you worked for the foreign company for at least 1 year in the past 3 years?"),
        ("managerial", "Is your position managerial, executive, or requires specialized knowledge?"),
        ("relationship", "Does the U.S. company have a qualifying relationship with the foreign company (parent, subsidiary, affiliate, or branch)?"),
        ("continuing", "Will you be working for the U.S. company in a similar capacity?")
    };

    private List<(string id, string text)> GetO1Checklist() => new()
    {
        ("extraordinary", "Have you received national or international recognition in your field?"),
        ("awards", "Have you received major awards or prizes (e.g., Oscar, Emmy, Grammy, Nobel Prize)?"),
        ("publications", "Have you been written about in major publications or media?"),
        ("judging", "Have you judged the work of others in your field?"),
        ("original", "Have you made original contributions of major significance?"),
        ("membership", "Are you a member of associations requiring outstanding achievements?")
    };

    private List<(string id, string text)> GetP1Checklist() => new()
    {
        ("athlete", "Are you an internationally recognized athlete or member of an entertainment group?"),
        ("performance", "Do you have contracts or itineraries showing performances in the U.S.?"),
        ("recognition", "Can you demonstrate international recognition and achievements?")
    };

    private List<(string id, string text)> GetE1E2Checklist() => new()
    {
        ("treaty", "Are you a national of a treaty country?"),
        ("trade", "For E-1: Is there substantial trade between the U.S. and your country?"),
        ("investment", "For E-2: Have you made or are you making a substantial investment in a U.S. business?"),
        ("ownership", "Do you own at least 50% of the business?")
    };

    private List<(string id, string text)> GetTNChecklist() => new()
    {
        ("citizenship", "Are you a citizen of Canada or Mexico?"),
        ("profession", "Is your profession on the NAFTA professional list?"),
        ("qualifications", "Do you meet the educational/licensing requirements for your profession?"),
        ("jobOffer", "Do you have a job offer from a U.S. employer?")
    };

    private List<(string id, string text)> GetR1Checklist() => new()
    {
        ("religious", "Are you a minister or working in a religious vocation or occupation?"),
        ("membership", "Have you been a member of the religious denomination for at least 2 years?"),
        ("offer", "Do you have an offer from a U.S. religious organization?"),
        ("nonprofit", "Is the organization a bona fide nonprofit religious organization?")
    };

    // Student Visa Checklists
    private List<(string id, string text)> GetF1Checklist() => new()
    {
        ("acceptance", "Have you been accepted by a SEVP-certified school in the U.S.?"),
        ("i20", "Have you received Form I-20 from your school?"),
        ("fullTime", "Will you be enrolled as a full-time student?"),
        ("funds", "Can you demonstrate sufficient funds to cover tuition and living expenses?"),
        ("ties", "Do you have strong ties to your home country (residence, family, job)?"),
        ("intent", "Do you intend to return home after completing your studies?")
    };

    private List<(string id, string text)> GetM1Checklist() => new()
    {
        ("acceptance", "Have you been accepted by a SEVP-certified vocational school?"),
        ("i20", "Have you received Form I-20 from your school?"),
        ("fullTime", "Will you be enrolled full-time in a vocational program?"),
        ("funds", "Can you demonstrate sufficient funds to cover tuition and living expenses?"),
        ("ties", "Do you have strong ties to your home country?"),
        ("nonAcademic", "Is the program vocational or technical (not academic)?")
    };

    private List<(string id, string text)> GetJ1StudentChecklist() => new()
    {
        ("program", "Have you been accepted into an approved exchange visitor program?"),
        ("ds2019", "Have you received Form DS-2019 from your program sponsor?"),
        ("sevis", "Have you paid the SEVIS I-901 fee?"),
        ("funds", "Can you demonstrate sufficient funds for the program?"),
        ("homeResidence", "Do you have a residence abroad you have no intention of abandoning?"),
        ("twoYearRule", "Are you aware of and willing to comply with the two-year home residency requirement (if applicable)?")
    };

    // Visitor Visa Checklists
    private List<(string id, string text)> GetB1Checklist() => new()
    {
        ("businessPurpose", "Is your trip for legitimate business purposes (meetings, conferences, negotiations)?"),
        ("temporary", "Is your trip temporary with a specific return date?"),
        ("funds", "Do you have sufficient funds to cover your stay?"),
        ("ties", "Do you have strong ties to your home country (job, property, family)?"),
        ("noWork", "Do you understand you cannot be employed or receive salary from a U.S. source?"),
        ("intent", "Do you intend to return to your home country after your business activities?")
    };

    private List<(string id, string text)> GetB2Checklist() => new()
    {
        ("tourismPurpose", "Is your trip for tourism, visiting family/friends, or medical treatment?"),
        ("temporary", "Is your trip temporary with a specific return date?"),
        ("funds", "Do you have sufficient funds to cover your stay?"),
        ("ties", "Do you have strong ties to your home country (job, property, family)?"),
        ("noWork", "Do you understand you cannot work or study on a B-2 visa?"),
        ("intent", "Do you intend to return to your home country after your visit?")
    };

    private List<(string id, string text)> GetB1B2Checklist() => new()
    {
        ("combinedPurpose", "Will your trip involve both business and tourism activities?"),
        ("temporary", "Is your trip temporary with a specific return date?"),
        ("funds", "Do you have sufficient funds to cover your stay?"),
        ("ties", "Do you have strong ties to your home country (job, property, family)?"),
        ("noWork", "Do you understand you cannot be employed in the U.S.?"),
        ("intent", "Do you intend to return to your home country?")
    };

    // Visa Extension Checklists
    private List<(string id, string text)> GetExtensionOfStayChecklist() => new()
    {
        ("currentStatus", "Are you currently in valid nonimmigrant status?"),
        ("notExpired", "Is your current I-94 not yet expired (or expired less than 180 days ago)?"),
        ("validReason", "Do you have a valid reason for extending your stay?"),
        ("noViolations", "Have you maintained your status without violations?"),
        ("timely", "Will you file the extension before your current status expires?")
    };

    private List<(string id, string text)> GetChangeOfStatusChecklist() => new()
    {
        ("currentStatus", "Are you currently in valid nonimmigrant status?"),
        ("eligible", "Are you eligible for the new visa category you are seeking?"),
        ("maintained", "Have you maintained your current status without violations?"),
        ("timely", "Will you file the change of status before your current status expires?"),
        ("noIntent", "Did you not enter the U.S. with preconceived intent to change status?")
    };

    private List<(string id, string text)> GetReinstatementChecklist() => new()
    {
        ("student", "Are you an F-1 or M-1 student who fell out of status?"),
        ("fiveMonths", "Has it been less than 5 months since you violated your status?"),
        ("circumstances", "Was the status violation due to circumstances beyond your control?"),
        ("pursuing", "Are you currently pursuing or intending to pursue a full course of study?"),
        ("noRepeated", "Have you not repeatedly or willfully violated status?"),
        ("noUnauthorized", "Have you not engaged in unauthorized employment?")
    };

    // Employment-Based Green Card Checklists
    private List<(string id, string text)> GetEB1AChecklist() => new()
    {
        ("awards", "Have you received major internationally recognized awards (like Nobel Prize, Oscar, Olympic Medal)?"),
        ("membership", "Are you a member of associations requiring outstanding achievements?"),
        ("published", "Have major publications or media written about you?"),
        ("judging", "Have you judged the work of others in your field?"),
        ("contribution", "Have you made original scholarly, artistic, or business contributions of major significance?"),
        ("authorship", "Have you authored scholarly articles in professional journals?"),
        ("critical", "Have you performed in a leading or critical role for distinguished organizations?"),
        ("salary", "Do you command a high salary relative to others in your field?")
    };

    private List<(string id, string text)> GetEB1BChecklist() => new()
    {
        ("research", "Do you have at least 3 years of experience in teaching or research?"),
        ("recognition", "Are you recognized internationally as outstanding in your academic field?"),
        ("offer", "Do you have a job offer for a tenured or tenure-track teaching position or comparable research position?"),
        ("achievements", "Can you demonstrate at least 2 of: major awards, membership in associations, published material about your work, judging others' work, original contributions, or scholarly articles?")
    };

    private List<(string id, string text)> GetEB1CChecklist() => new()
    {
        ("employment", "Have you been employed abroad for at least 1 year in the 3 years before your petition?"),
        ("managerial", "Were you employed in a managerial or executive capacity?"),
        ("relationship", "Does the U.S. employer have a qualifying relationship with your foreign employer?"),
        ("continuing", "Will you be employed in a managerial or executive capacity in the U.S.?")
    };

    private List<(string id, string text)> GetEB2AdvancedDegreeChecklist() => new()
    {
        ("degree", "Do you have a master's degree or higher?"),
        ("bachelor", "OR do you have a bachelor's degree plus 5 years progressive work experience?"),
        ("jobOffer", "Do you have a job offer requiring an advanced degree?"),
        ("labor", "Has your employer obtained labor certification (PERM)?")
    };

    private List<(string id, string text)> GetEB2NIWChecklist() => new()
    {
        ("degree", "Do you have a master's degree or higher (or bachelor's plus 5 years experience)?"),
        ("merit", "Does your work have substantial merit and national importance?"),
        ("positioned", "Are you well positioned to advance your proposed endeavor?"),
        ("beneficial", "Would it benefit the U.S. to waive the job offer and labor certification requirements?")
    };

    private List<(string id, string text)> GetEB2ExceptionalAbilityChecklist() => new()
    {
        ("degree", "Do you have a degree, diploma, certificate, or similar award from a college or university?"),
        ("experience", "Do you have at least 10 years of full-time experience in your occupation?"),
        ("license", "Do you have a license or certification for your profession?"),
        ("salary", "Have you commanded a high salary or remuneration?"),
        ("membership", "Are you a member of professional associations?"),
        ("recognition", "Have you received recognition for achievements from peers, organizations, or agencies?")
    };

    private List<(string id, string text)> GetEB3SkilledWorkerChecklist() => new()
    {
        ("experience", "Do you have at least 2 years of job experience or training?"),
        ("jobOffer", "Do you have a full-time job offer from a U.S. employer?"),
        ("labor", "Has your employer obtained labor certification (PERM)?"),
        ("qualified", "Do you meet the job requirements as of the priority date?")
    };

    private List<(string id, string text)> GetEB3ProfessionalChecklist() => new()
    {
        ("degree", "Do you have a U.S. bachelor's degree or foreign equivalent?"),
        ("jobOffer", "Do you have a full-time job offer requiring a bachelor's degree?"),
        ("labor", "Has your employer obtained labor certification (PERM)?"),
        ("qualified", "Do you meet the job requirements as of the priority date?")
    };

    private List<(string id, string text)> GetEB3UnskilledWorkerChecklist() => new()
    {
        ("jobOffer", "Do you have a full-time job offer for unskilled work?"),
        ("labor", "Has your employer obtained labor certification (PERM)?"),
        ("capable", "Are you capable of performing the unskilled labor?"),
        ("permanent", "Is the position permanent (not seasonal or temporary)?")
    };

    #endregion

    #region Step 6: Contact Information

    private bool HasAllContactInfo(Dictionary<string, string> answers)
    {
        var requiredFields = new[] { "full_name", "email", "phone", "current_country" };

        if (!requiredFields.All(f => answers.ContainsKey(f)))
        {
            return false;
        }

        // If outside US, need foreign address
        if (answers.ContainsKey("location") && answers["location"] == "outside")
        {
            if (!answers.ContainsKey("foreign_address"))
            {
                return false;
            }
        }

        // If inside US, need US address
        if (answers.ContainsKey("location") && answers["location"] == "inside")
        {
            if (!answers.ContainsKey("has_us_address"))
            {
                return false;
            }

            if (answers["has_us_address"] == "yes" && !answers.ContainsKey("us_address"))
            {
                return false;
            }
        }

        return true;
    }

    private async Task<InterviewQuestion?> GetContactInfoQuestion(Dictionary<string, string> answers)
    {
        if (!answers.ContainsKey("full_name"))
        {
            return new InterviewQuestion
            {
                Key = "full_name",
                Text = "What is your full legal name?",
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
                Text = "What is your phone number?",
                Category = "contact",
                InputType = "tel",
                Order = 102,
                IsRequired = true,
                Options = new List<QuestionOption>()
            };
        }

        if (!answers.ContainsKey("current_country"))
        {
            // Get countries from database for dropdown
            var countries = await _context.Countries
                .Where(c => c.IsActive)
                .OrderBy(c => c.Name)
                .Select(c => new QuestionOption
                {
                    Value = c.Iso2,
                    Label = c.Name
                })
                .ToListAsync();

            return new InterviewQuestion
            {
                Key = "current_country",
                Text = "What country do you currently reside in?",
                Category = "contact",
                InputType = "select",
                Order = 103,
                IsRequired = true,
                Options = countries
            };
        }

        // Location-specific address questions
        if (answers.ContainsKey("location") && answers["location"] == "outside")
        {
            if (!answers.ContainsKey("foreign_address"))
            {
                return new InterviewQuestion
                {
                    Key = "foreign_address",
                    Text = "What is your current address?",
                    Category = "contact",
                    InputType = "textarea",
                    Order = 104,
                    IsRequired = true,
                    Options = new List<QuestionOption>()
                };
            }
        }

        if (answers.ContainsKey("location") && answers["location"] == "inside")
        {
            if (!answers.ContainsKey("has_us_address"))
            {
                return new InterviewQuestion
                {
                    Key = "has_us_address",
                    Text = "Do you have a U.S. address?",
                    Category = "contact",
                    InputType = "radio",
                    Order = 104,
                    IsRequired = true,
                    Options = new List<QuestionOption>
                    {
                        new() { Value = "yes", Label = "Yes" },
                        new() { Value = "no", Label = "No" }
                    }
                };
            }

            if (answers["has_us_address"] == "yes" && !answers.ContainsKey("us_address"))
            {
                return new InterviewQuestion
                {
                    Key = "us_address",
                    Text = "What is your U.S. address?",
                    Category = "contact",
                    InputType = "textarea",
                    Order = 105,
                    IsRequired = true,
                    Options = new List<QuestionOption>()
                };
            }
        }

        return null;
    }

    #endregion
}

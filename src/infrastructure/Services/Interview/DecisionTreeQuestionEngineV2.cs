using L4H.Infrastructure.Data;
using L4H.Infrastructure.Entities;
using Microsoft.EntityFrameworkCore;

namespace L4H.Infrastructure.Services.Interview;

/// <summary>
/// Version 2 of the Decision Tree Question Engine - complete refactor matching React prototype
/// Flow: Intent Type (Denise Fork) → Location → Education → Category → Subcategory → Checklist → Evaluation
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
        var answers = answeredQuestions.ToDictionary(
            qa => qa.QuestionKey, 
            qa => qa.AnswerValue, 
            StringComparer.OrdinalIgnoreCase);

        // Step 1: Denise Fork - Intent Type classification (MANDATORY FIRST)
        if (!answers.ContainsKey("intent_type"))
        {
            return GetIntentTypeQuestion();
        }

        var intentType = answers["intent_type"];

        // Step 2: Location question (MANDATORY)
        if (!answers.ContainsKey("location"))
        {
            return GetLocationQuestion();
        }

        // Step 3: Mandatory Education check (MANDATORY)
        if (!answers.ContainsKey("education_level"))
        {
            return GetEducationQuestion();
        }

        // Step 3.1: Branching Guard for Non-Immigrants
        if (intentType.Equals("nonimmigrant", StringComparison.OrdinalIgnoreCase))
        {
            if (!answers.ContainsKey("employment_status"))
            {
                return GetEmploymentStatusQuestion();
            }
            if (!answers.ContainsKey("educational_goals"))
            {
                return GetEducationalGoalsQuestion();
            }
        }

        // Step 4: Category question (branched based on intent_type)
        if (!answers.ContainsKey("category"))
        {
            return GetCategoryQuestion(intentType);
        }

        var category = answers["category"];

        // Step 5: Subcategory question (if applicable for this category)
        if (RequiresSubcategory(intentType, category) && !answers.ContainsKey("subcategory"))
        {
            return GetSubcategoryQuestion(intentType, category);
        }

        // Step 6: Eligibility checklist questions (if subcategory has one)
        var subcategory = answers.ContainsKey("subcategory") ? answers["subcategory"] : null;
        if (!string.IsNullOrEmpty(subcategory) && HasChecklist(subcategory))
        {
            var checklistComplete = await IsChecklistComplete(subcategory, answers);
            if (!checklistComplete)
            {
                return GetNextChecklistQuestion(subcategory, answers);
            }
        }

        // Step 7: Evaluation happens here (handled by orchestrator)
        // Interview complete - all mandatory legal fields and branched logic satisfied
        return null;
    }

    public async Task<bool> IsCompleteAsync(
        List<VisaType> remainingVisas,
        int questionsAnswered,
        List<InterviewQA> answeredQuestions)
    {
        var answers = answeredQuestions.ToDictionary(qa => qa.QuestionKey, qa => qa.AnswerValue, StringComparer.OrdinalIgnoreCase);

        // PREREQUISITE GUARD: foundational fields must exist before trusting visa counts.
        // Without category, the evaluator has no purpose signal — remaining visa counts
        // are meaningless (all specific visas show NotEligible while generic ones show
        // Potential, creating a false singularity that triggers premature completion).
        if (!answers.ContainsKey("location") ||
            !answers.ContainsKey("education_level") ||
            !answers.ContainsKey("category"))
        {
            return false;
        }

        // DENISE FORK GUARD: Non-Immigrants must complete BOTH discerning questions
        // before the interview can conclude (employment AND educational_goals — not just one).
        if (answers.TryGetValue("intent_type", out var intent) &&
            intent.Equals("nonimmigrant", StringComparison.OrdinalIgnoreCase))
        {
            bool hasEmploymentInfo = answers.ContainsKey("employment_status");
            bool hasEducationGoals = answers.ContainsKey("educational_goals");

            if (!hasEmploymentInfo || !hasEducationGoals) // both required, not either-or
            {
                return false;
            }
        }

        // Logical completion triggers (only reachable once prerequisites are satisfied):
        // 1. Conclusive result — narrowed to a single visa
        if (remainingVisas.Count == 1)
        {
            return true;
        }

        // 2. Disqualified state — all visas eliminated after sufficient depth
        if (remainingVisas.Count == 0 && questionsAnswered >= 3)
        {
            return true;
        }

        return false;
    }

    #region Step 1: Denise Fork (Intent Type)

    private InterviewQuestion GetIntentTypeQuestion()
    {
        return new InterviewQuestion
        {
            Key = "intent_type",
            Text = "Are you seeking to move to the United States permanently, or are you planning a temporary stay?",
            Category = "foundation",
            InputType = "select",
            Order = 1,
            IsRequired = true,
            Options = new List<QuestionOption>
            {
                new() { Value = "immigrant", Label = "Immigrant - Permanent Residency / Green Card" },
                new() { Value = "nonimmigrant", Label = "Non-Immigrant - Temporary Stay (Work, Study, Visit)" }
            }
        };
    }

    #endregion

    #region Step 2: Location Question

    private InterviewQuestion GetLocationQuestion()
    {
        return new InterviewQuestion
        {
            Key = "location",
            Text = "Where are you currently located?",
            Category = "foundation",
            InputType = "select",
            Order = 2,
            IsRequired = true,
            Options = new List<QuestionOption>
            {
                new() { Value = "inside", Label = "Inside the United States" },
                new() { Value = "outside", Label = "Outside the United States" }
            }
        };
    }

    #endregion

    #region Step 3: Mandatory Education Question

    private InterviewQuestion GetEducationQuestion()
    {
        return new InterviewQuestion
        {
            Key = "education_level",
            Text = "What is your highest level of education?",
            Category = "foundation",
            InputType = "select",
            Order = 3,
            IsRequired = true,
            Options = new List<QuestionOption>
            {
                new() { Value = "high_school", Label = "High School or equivalent" },
                new() { Value = "associate", Label = "Associate's Degree" },
                new() { Value = "bachelor", Label = "Bachelor's Degree" },
                new() { Value = "master", Label = "Master's Degree" },
                new() { Value = "doctorate", Label = "Doctorate / PhD" },
                new() { Value = "professional", Label = "Professional Degree (JD, MD, etc.)" }
            }
        };
    }

    #endregion

    #region Step 3.1: Non-Immigrant Branching Guard Questions

    private InterviewQuestion GetEmploymentStatusQuestion()
    {
        return new InterviewQuestion
        {
            Key = "employment_status",
            Text = "What is your current employment status?",
            Category = "nonimmigrant_refinement",
            InputType = "select",
            Order = 15,
            IsRequired = true,
            Options = new List<QuestionOption>
            {
                new() { Value = "employed_full", Label = "Employed Full-Time" },
                new() { Value = "employed_part", Label = "Employed Part-Time" },
                new() { Value = "self_employed", Label = "Self-Employed / Business Owner" },
                new() { Value = "student", Label = "Student" },
                new() { Value = "unemployed", Label = "Not Currently Employed" }
            }
        };
    }

    private InterviewQuestion GetEducationalGoalsQuestion()
    {
        return new InterviewQuestion
        {
            Key = "educational_goals",
            Text = "Do you have any plans to enroll in a U.S. educational program or vocational training?",
            Category = "nonimmigrant_refinement",
            InputType = "radio",
            Order = 16,
            IsRequired = true,
            Options = new List<QuestionOption>
            {
                new() { Value = "yes", Label = "Yes, I plan to study" },
                new() { Value = "no", Label = "No, study is not my primary goal" }
            }
        };
    }

    #endregion

    #region Step 4: Category Question (Intent-Based)

    private InterviewQuestion GetCategoryQuestion(string intentType)
    {
        return intentType.ToLower() switch
        {
            "immigrant" => GetImmigrantCategoryQuestion(),
            "nonimmigrant" => GetNonimmigrantCategoryQuestion(),
            _ => throw new ArgumentException($"Unknown intent type: {intentType}")
        };
    }

    private InterviewQuestion GetImmigrantCategoryQuestion()
    {
        return new InterviewQuestion
        {
            Key = "category",
            Text = "What type of permanent help do you need?",
            Category = "immigrant",
            InputType = "select",
            Order = 4,
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
            Text = "What type of temporary help do you need?",
            Category = "nonimmigrant",
            InputType = "select",
            Order = 4,
            IsRequired = true,
            Options = new List<QuestionOption>
            {
                new() { Value = "work_visa", Label = "Work Visa - H-1B, L-1, O-1, and other employment visas" },
                new() { Value = "student_visa", Label = "Student Visa - F-1, M-1, J-1 student programs" },
                new() { Value = "adjust_status", Label = "Adjust to Permanent Status - Transition to green card" },
                new() { Value = "visitor_visa", Label = "Visitor/Tourist Visa - B-1 business, B-2 tourism (FALLBACK)" }
            }
        };
    }

    #endregion

    #region Step 5: Subcategory Question

    private bool RequiresSubcategory(string intentType, string category)
    {
        // Categories that go directly to results without subcategory selection
        var skipSubcategory = new[]
        {
            "green_card_family", "renew_replace", "citizenship", "removal",
            "adjust_status", "fiance_visa", "consular_processing",
            "asylum_app", "refugee", "tps",
            "daca", "adjustment_options", "deportation_defense", "waiver"
        };

        return !skipSubcategory.Contains(category.ToLower());
    }

    private InterviewQuestion GetSubcategoryQuestion(string intentType, string category)
    {
        return category.ToLower() switch
        {
            "work_visa" => GetWorkVisaSubcategoryQuestion(),
            "student_visa" => GetStudentVisaSubcategoryQuestion(),
            "visitor_visa" => GetVisitorVisaSubcategoryQuestion(),
            "green_card_employment" => GetEmploymentGreenCardSubcategoryQuestion(),
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
            Order = 5,
            IsRequired = true,
            Options = new List<QuestionOption>
            {
                new() { Value = "H-1B", Label = "H-1B Specialty Occupation - Requires bachelor's degree or higher in specific field" },
                new() { Value = "H-2A", Label = "H-2A Agricultural Worker - Seasonal agricultural employment" },
                new() { Value = "H-2B", Label = "H-2B Temporary Worker - Non-agricultural temporary work" },
                new() { Value = "L-1", Label = "L-1 Intracompany Transfer - Transfer within same company to U.S. office" },
                new() { Value = "O-1", Label = "O-1 Extraordinary Ability - Arts, sciences, business, athletics, or entertainment" },
                new() { Value = "P-1", Label = "P-1 Athlete/Entertainer - Individual or team athletes, entertainment groups" },
                new() { Value = "TN", Label = "TN NAFTA Professional - Canadian or Mexican professionals" },
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
            Order = 5,
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
            Order = 5,
            IsRequired = true,
            Options = new List<QuestionOption>
            {
                new() { Value = "B-1", Label = "B-1 Business Visitor - Temporary business activities, meetings, conferences" },
                new() { Value = "B-2", Label = "B-2 Tourist Visitor - Tourism, vacation, visit family/friends, medical treatment" },
                new() { Value = "B-1/B-2", Label = "B-1/B-2 Combined - Both business and tourism purposes" }
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
            Order = 5,
            IsRequired = true,
            Options = new List<QuestionOption>
            {
                new() { Value = "EB-1A", Label = "EB-1A Extraordinary Ability - Top of field: sciences, arts, education, business, athletics" },
                new() { Value = "EB-1B", Label = "EB-1B Outstanding Researcher/Professor - 3+ years research/teaching experience, international recognition" },
                new() { Value = "EB-1C", Label = "EB-1C Multinational Manager/Executive - 1+ year as manager/executive for foreign affiliate" },
                new() { Value = "EB-2 NIW", Label = "EB-2 NIW (National Interest Waiver) - Work benefits U.S. national interest, no job offer needed" },
                new() { Value = "EB-3 Skilled Worker", Label = "EB-3 Skilled Worker - 2+ years training/experience, not temporary or seasonal" },
                new() { Value = "EB-5", Label = "EB-5 Immigrant Investor - $800K-$1.05M investment creating 10+ jobs" }
            }
        };
    }

    #endregion

    #region Step 6: Checklist Questions

    private bool HasChecklist(string subcategory)
    {
        // These visa types have eligibility checklists
        var visasWithChecklists = new[]
        {
            "H-1B", "H-2A", "H-2B", "L-1", "O-1", "P-1", "TN", "R-1",
            "F-1", "M-1", "J-1 Student",
            "B-1", "B-2", "B-1/B-2",
            "EB-1A", "EB-1B", "EB-1C", "EB-2 NIW",
            "EB-3 Skilled Worker"
        };

        return visasWithChecklists.Contains(subcategory.ToUpper());
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
        return subcategory.ToUpper() switch
        {
            // Work Visas
            "H-1B" => GetH1BChecklist(),
            "H-2A" => GetH2AChecklist(),
            "H-2B" => GetH2BChecklist(),
            "L-1" => GetL1Checklist(),
            "O-1" => GetO1Checklist(),
            "P-1" => GetP1Checklist(),
            "TN" => GetTNChecklist(),
            "R-1" => GetR1Checklist(),

            // Student Visas
            "F-1" => GetF1Checklist(),
            "M-1" => GetM1Checklist(),
            "J-1 STUDENT" => GetJ1StudentChecklist(),

            // Visitor Visas
            "B-1" => GetB1Checklist(),
            "B-2" => GetB2Checklist(),
            "B-1/B-2" => GetB1B2Checklist(),

            // Employment-Based Green Cards
            "EB-1A" => GetEB1AChecklist(),
            "EB-1B" => GetEB1BChecklist(),
            "EB-1C" => GetEB1CChecklist(),
            "EB-2 NIW" => GetEB2NIWChecklist(),
            "EB-3 SKILLED WORKER" => GetEB3SkilledWorkerChecklist(),

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

    private List<(string id, string text)> GetEB2NIWChecklist() => new()
    {
        ("degree", "Do you have a master's degree or higher (or bachelor's plus 5 years experience)?"),
        ("merit", "Does your work have substantial merit and national importance?"),
        ("positioned", "Are you well positioned to advance your proposed endeavor?"),
        ("beneficial", "Would it benefit the U.S. to waive the job offer and labor certification requirements?")
    };

    private List<(string id, string text)> GetEB3SkilledWorkerChecklist() => new()
    {
        ("experience", "Do you have at least 2 years of job experience or training?"),
        ("jobOffer", "Do you have a full-time job offer from a U.S. employer?"),
        ("labor", "Has your employer obtained labor certification (PERM)?"),
        ("qualified", "Do you meet the job requirements as of the priority date?")
    };

    #endregion
}

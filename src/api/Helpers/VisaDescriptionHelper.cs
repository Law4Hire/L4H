namespace L4H.Api.Helpers;

public static class VisaDescriptionHelper
{
    public static string GetDescription(string code)
    {
        return code switch
        {
            "B-1" or "B1" => "Business visitor visa for temporary business activities in the United States.",
            "B-2" or "B2" => "Tourist visa for pleasure, vacation, or visiting family and friends.",
            "F-1" or "F1" => "Student visa for academic studies at accredited US institutions.",
            "F-2" or "F2" => "Dependent visa for spouses and children of F1 students.",
            "H-1B" or "H1B" => "Specialty occupation visa for professionals with bachelor's degree or higher.",
            "H-2A" or "H2A" => "Temporary agricultural worker visa for seasonal farm labor.",
            "H-2B" or "H2B" => "Temporary non-agricultural worker visa for seasonal or peak load work.",
            "H-4" or "H4" => "Dependent visa for spouses and children of H1B visa holders.",
            "J-1" or "J1" => "Exchange visitor visa for cultural exchange programs.",
            "L-1A" or "L1A" => "Intracompany transferee visa for managers and executives.",
            "L-1B" or "L1B" => "Intracompany transferee visa for employees with specialized knowledge.",
            "L-2" or "L2" => "Dependent visa for spouses and children of L1 visa holders.",
            "O-1" or "O1" => "Extraordinary ability visa for individuals with exceptional skills.",
            "TN" => "NAFTA professional visa for Canadian and Mexican citizens.",
            "E-2" or "E2" => "Treaty investor visa for substantial investment in US business.",
            "EB-1" or "EB1" or "EB-1A" => "First preference employment-based green card for priority workers.",
            "EB-2" or "EB2" or "EB-2A" or "EB-2B" or "EB2-NIW" => "Second preference employment-based green card for advanced degree holders.",
            "EB-3" or "EB3" => "Third preference employment-based green card for skilled workers.",
            "EB-5" or "EB5" => "Fifth preference employment-based green card for investors.",
            "K-1" or "K1" => "Fiancé(e) visa for foreign nationals marrying US citizens.",
            "CR-1" or "CR1" => "Conditional resident spouse visa for marriages less than 2 years old.",
            "IR-1" or "IR1" => "Immediate relative spouse visa for marriages more than 2 years old.",
            _ => "US immigration visa classification. Contact us for detailed information."
        };
    }
}

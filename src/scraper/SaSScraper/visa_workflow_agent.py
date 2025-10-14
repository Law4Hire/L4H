
import json

class VisaWorkflowAgent:
    """
    A Service-as-Software agent to gather and structure U.S. Visa application requirements.
    """

    def __init__(self):
        self.MOCK_DATA_SOURCE = {
            "Andorra": {
                "IR-1": {
                    "Steps": [
                        "1. File Petition (Form I-130): The U.S. citizen spouse files Form I-130 with USCIS.",
                        "2. NVC Case Creation: Once approved, the case is sent to the National Visa Center (NVC).",
                        "3. Pay Fees: Pay the Immigrant Visa Application Processing Fee and Affidavit of Support Fee.",
                        "4. Complete DS-260: Fill out the online Immigrant Visa Application (Form DS-260).",
                        "5. Assemble and Submit Documents: Gather and upload all required financial and civil documents.",
                        "6. Medical Examination: Schedule and complete a medical exam with an approved panel physician.",
                        "7. Attend Interview: Attend the visa interview at the U.S. Consulate General in Barcelona, Spain."
                    ],
                    "GovDocs": [
                        {
                            "Name": "Form I-130, Petition for Alien Relative",
                            "Link": "https://www.uscis.gov/i-130",
                            "Description": "The initial petition filed by the U.S. citizen spouse."
                        },
                        {
                            "Name": "Form DS-260, Immigrant Visa Application",
                            "Link": "https://ceac.state.gov/iv/",
                            "Description": "The main online application for the immigrant visa."
                        }
                    ],
                    "UserDocs": [
                        "Passport valid for at least 6 months beyond your intended date of entry into the U.S.",
                        "Birth Certificate",
                        "Marriage Certificate",
                        "Police Certificates from all countries of residence for more than 6 months since age 16.",
                        "Sponsor's Affidavit of Support (Form I-864) with supporting financial evidence.",
                        "Passport-style photographs."
                    ],
                    "GovLinks": [
                        {
                            "Name": "CEAC Login",
                            "Link": "https://ceac.state.gov/IV/Login.aspx",
                            "Purpose": "To complete the DS-260 form and check case status."
                        },
                        {
                            "Name": "U.S. Consulate General Barcelona",
                            "Link": "https://es.usembassy.gov/embassy-consulates/barcelona/",
                            "Purpose": "The processing post for residents of Andorra."
                        }
                    ],
                    "Doctors": [
                        {
                            "Name": "Centro Médico Teknon",
                            "Address": "Carrer de Vilana, 12, 08022 Barcelona, Spain",
                            "Phone": "+34 932 90 62 00",
                            "InstructionsLink": "https://www.teknon.es/en/international-patient-services"
                        },
                        {
                            "Name": "Hospital Universitari General de Catalunya",
                            "Address": "Carrer de Pedro i Pons, 1, 08034 Barcelona, Spain",
                            "Phone": "+34 932 54 24 00",
                            "InstructionsLink": "https://www.hgc.es/en"
                        }
                    ]
                }
            }
        }

    def _step_1_source_identification(self, country_of_residence):
        """Mocks identifying the correct U.S. Embassy or Consulate."""
        print(f"INFO: Identifying processing post for {country_of_residence}.")
        if country_of_residence == "Andorra":
            # Andorra processes through Barcelona, Spain. This is mocked implicitly.
            return "barcelona" 
        return "default_post"

    def _step_2_core_data_retrieval(self, post, visa_type):
        """Mocks retrieving core visa data."""
        print(f"INFO: Retrieving data for {visa_type} at post '{post}'.")
        # In a real scenario, this would involve web scraping.
        # Here, we just confirm we can access our mock data.
        if post == "barcelona" and visa_type == "IR-1":
            return self.MOCK_DATA_SOURCE.get("Andorra", {}).get("IR-1", {})
        return {}

    def _step_3_panel_physician_search(self, post):
        """Mocks finding panel physicians."""
        print(f"INFO: Searching for panel physicians for post '{post}'.")
        # This is also part of the mocked data retrieval.
        if post == "barcelona":
            return self.MOCK_DATA_SOURCE.get("Andorra", {}).get("IR-1", {}).get("Doctors", [])
        return []

    def _step_4_structuring_and_delivery(self, data, return_types):
        """Filters the data based on the requested return types."""
        print(f"INFO: Filtering data for return types: {return_types}")
        if not data:
            return {}
        
        structured_output = {}
        for key in return_types:
            if key in data:
                structured_output[key] = data[key]
        
        return structured_output

    def execute(self, country_of_residence, visa_type, return_types):
        """
        Main execution method for the VisaWorkflowAgent.
        """
        print("--- Starting VisaWorkflowAgent Execution ---")
        processing_post = self._step_1_source_identification(country_of_residence)
        
        # In this mocked version, steps 2 and 3 are combined in data retrieval.
        retrieved_data = self._step_2_core_data_retrieval(processing_post, visa_type)
        
        # The physician data is part of the core data retrieval in this mock.
        # self._step_3_panel_physician_search(processing_post) is implicitly called.

        final_output = self._step_4_structuring_and_delivery(retrieved_data, return_types)
        print("--- VisaWorkflowAgent Execution Finished ---")
        return final_output

def test_vwa_andorra_ir1():
    """
    Unit test for the VisaWorkflowAgent with specific parameters for Andorra and IR-1 visa.
    """
    print("\n--- Running Test: test_vwa_andorra_ir1 ---")
    agent = VisaWorkflowAgent()
    
    # Define test parameters
    country = "Andorra"
    visa = "IR-1"
    return_types = ["Steps", "Doctors", "GovLinks"]
    
    # Execute the agent
    result = agent.execute(country, visa, return_types)
    
    # Print the result for visual inspection
    print("\n--- Test Result ---")
    print(json.dumps(result, indent=2))
    print("--- End of Test Result ---")
    
    # 1. Assert the number of top-level keys
    assert len(result) == 3, f"Error: Expected 3 keys, but got {len(result)}."
    print("Assertion PASSED: Result contains exactly 3 keys.")
    
    # 2. Assert that "GovDocs" and "UserDocs" are not present
    assert "GovDocs" not in result, "Error: 'GovDocs' key should not be in the result."
    assert "UserDocs" not in result, "Error: 'UserDocs' key should not be in the result."
    print("Assertion PASSED: 'GovDocs' and 'UserDocs' keys are not present.")
    
    # 3. Assert the length of the "Steps" list
    assert len(result.get("Steps", [])) > 3, "Error: 'Steps' list should have more than 3 items."
    print("Assertion PASSED: 'Steps' list has more than 3 items.")
    
    # 4. Assert the length of the "Doctors" list
    assert len(result.get("Doctors", [])) > 1, "Error: 'Doctors' list should have more than 1 item."
    print("Assertion PASSED: 'Doctors' list has more than 1 item.")
    
    print("\n--- All Assertions Passed Successfully! ---")

if __name__ == "__main__":
    import argparse
    import sys

    # Setup command-line argument parser
    parser = argparse.ArgumentParser(description="Visa Workflow Agent CLI")
    parser.add_argument("-c", "--country", type=str, required=True, help="The country of residence for the visa application.")
    parser.add_argument("-v", "--visa_type", type=str, required=True, help="The specific U.S. Visa classification (e.g., IR-1).")
    parser.add_argument("-r", "--return_types", nargs='+', required=True, 
                        choices=['Steps', 'GovDocs', 'UserDocs', 'GovLinks', 'Doctors'],
                        help="A list of information categories to return. Choose from: Steps, GovDocs, UserDocs, GovLinks, Doctors.")

    # If no arguments are provided, show help
    if len(sys.argv) == 1:
        parser.print_help(sys.stderr)
        sys.exit(1)

    args = parser.parse_args()

    # Instantiate and execute the agent
    agent = VisaWorkflowAgent()
    result = agent.execute(args.country, args.visa_type, args.return_types)

    # Print the final result as JSON
    print(json.dumps(result, indent=2))

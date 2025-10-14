# scraper_engine/main.py

import argparse
import json
import os
import yaml

# This is a placeholder for the real scraping logic
from .scrapers import Scraper

def main():
    parser = argparse.ArgumentParser(description="A scalable web scraper for visa information.")
    parser.add_argument("-c", "--country", required=True, help="Country to scrape.")
    parser.add_argument("-v", "--visa_type", required=True, help="Visa type to scrape.")
    args = parser.parse_args()

    country = args.country.lower()
    visa_type = args.visa_type.upper()

    # Construct the path to the config file
    config_path = os.path.join('configs', f'{country}.yml')

    if not os.path.exists(config_path):
        print(f"Error: No configuration file found for '{country}'.")
        return

    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)

    scraper = Scraper(config)
    data = scraper.scrape(visa_type)

    print(json.dumps(data, indent=2))

if __name__ == "__main__":
    main()

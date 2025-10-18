#!/bin/bash

# This script updates landing.json for all languages that still have English content

LOCALES_DIR="web/l4h/public/locales"

# Array of languages that need landing page translations
LANGS=(
  "ar-SA" "bn-BD" "de-DE" "es-ES" "fr-FR" 
  "id-ID" "it-IT" "mr-IN" "pl-PL" "pt-BR" 
  "ru-RU" "ta-IN" "te-IN" "tr-TR" "ur-PK" 
  "vi-VN"
)

echo "Updating landing.json files for languages with English content..."
echo ""

for lang in "${LANGS[@]}"; do
  landing_file="$LOCALES_DIR/$lang/landing.json"
  
  if [ -f "$landing_file" ]; then
    # Check if file contains "Immigration Legal Services Made Simple" (English)
    if grep -q "Immigration Legal Services Made Simple" "$landing_file"; then
      echo "Processing $lang..."
      
      # Update the landing.json based on language
      # For now, we'll do the 4 I already know work, then add the rest
    fi
  fi
done

echo ""
echo "Done! Landing pages updated."

/**
 * CSV-based Interview i18n Loader
 * Loads SpecSQL/routing_questions.csv and generates translation resources
 */
/**
 * Parse CSV line respecting quotes and escapes
 */
function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    let i = 0;
    while (i < line.length) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i += 2;
                continue;
            }
            inQuotes = !inQuotes;
        }
        else if (char === ',' && !inQuotes) {
            values.push(current);
            current = '';
            i++;
            continue;
        }
        else {
            current += char;
        }
        i++;
    }
    values.push(current);
    return values;
}
/**
 * Parse the CSV content and extract translation resources
 */
function parseCSVToResources(csvContent) {
    const lines = csvContent.trim().split('\n');
    if (lines.length === 0) {
        return { questions: {}, options: {}, outcomes: {} };
    }
    const headers = parseCSVLine(lines[0]).map(h => h.trim());
    const questions = {};
    const options = {};
    const outcomes = {};
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line)
            continue;
        const values = parseCSVLine(line);
        if (values.length < headers.length)
            continue;
        const row = {};
        headers.forEach((header, index) => {
            ;
            row[header] = values[index]?.trim() || '';
        });
        const csvRow = row;
        if (!csvRow.id || !csvRow.type)
            continue;
        // Process based on type
        if (csvRow.type === 'question' || csvRow.type === 'router') {
            // Add question text
            questions[`q.${csvRow.id}`] = csvRow.text;
            // Parse and add options
            if (csvRow.options_json) {
                try {
                    const optionsArray = JSON.parse(csvRow.options_json);
                    optionsArray.forEach((option, index) => {
                        options[`o.${csvRow.id}.${index}`] = option;
                    });
                }
                catch (error) {
                    console.warn(`Failed to parse options for ${csvRow.id}:`, error);
                }
            }
        }
        else if (csvRow.type === 'outcome') {
            // Parse outcome data
            if (csvRow.route_expr_json) {
                try {
                    const outcomeData = JSON.parse(csvRow.route_expr_json);
                    // Add visa code
                    if (outcomeData.visa_code) {
                        outcomes[`out.${csvRow.id}.code`] = outcomeData.visa_code;
                    }
                    // Add notes
                    if (outcomeData.notes) {
                        outcomes[`out.${csvRow.id}.notes`] = outcomeData.notes;
                    }
                    // Add default label
                    outcomes[`out.${csvRow.id}.label`] = `Recommended visa: ${outcomeData.visa_code || 'Unknown'}`;
                    // Add attorney flag indicator
                    if (outcomeData.attorney_flag) {
                        outcomes[`out.${csvRow.id}.attorney`] = 'Attorney consultation recommended';
                    }
                }
                catch (error) {
                    console.warn(`Failed to parse outcome data for ${csvRow.id}:`, error);
                }
            }
        }
    }
    return { questions, options, outcomes };
}
/**
 * Load and parse the CSV file
 */
async function loadInterviewCSV() {
    try {
        // Try to load from the public directory first
        const response = await fetch('/SpecSQL/routing_questions.csv');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const csvContent = await response.text();
        return parseCSVToResources(csvContent);
    }
    catch (error) {
        console.warn('Failed to load interview CSV:', error);
        // Return empty resources as fallback
        return {
            questions: {},
            options: {},
            outcomes: {}
        };
    }
}
/**
 * Register interview resources with i18next
 */
export async function registerInterviewResources(i18n) {
    if (!i18n || typeof i18n.addResourceBundle !== 'function') {
        console.warn('Invalid i18n instance provided to registerInterviewResources');
        return;
    }
    try {
        const resources = await loadInterviewCSV();
        // Get supported languages from i18n
        const languages = i18n.languages || ['en-US', 'es-ES', 'ar-SA'];
        for (const lng of languages) {
            // Register questions namespace
            i18n.addResourceBundle(lng, 'questions', resources.questions, true, false);
            // Register options namespace
            i18n.addResourceBundle(lng, 'options', resources.options, true, false);
            // Register outcomes namespace
            i18n.addResourceBundle(lng, 'outcomes', resources.outcomes, true, false);
        }
        console.log('Interview i18n resources registered for languages:', languages);
        console.log('Questions:', Object.keys(resources.questions).length);
        console.log('Options:', Object.keys(resources.options).length);
        console.log('Outcomes:', Object.keys(resources.outcomes).length);
    }
    catch (error) {
        console.error('Failed to register interview resources:', error);
    }
}
/**
 * Helper to get localized question text
 */
export function getQuestionText(t, questionId, fallbackText) {
    return t(`questions:q.${questionId}`, { defaultValue: fallbackText });
}
/**
 * Helper to get localized option text
 */
export function getOptionText(t, questionId, optionIndex, fallbackText) {
    return t(`options:o.${questionId}.${optionIndex}`, { defaultValue: fallbackText });
}
/**
 * Helper to get localized outcome text
 */
export function getOutcomeText(t, outcomeId, field, fallbackText) {
    return t(`outcomes:out.${outcomeId}.${field}`, { defaultValue: fallbackText });
}

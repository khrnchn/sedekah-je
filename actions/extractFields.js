const fs = require('node:fs');
const path = require('node:path');

// Read the input file from the environment
const inputFilePath = path.resolve(process.env.INPUT_FILE || 'input.data');
const issueId = process.env.ISSUE_ID; // Get the GitHub issue ID

// Read and normalize input data
let inputText;
try {
    inputText = fs.readFileSync(inputFilePath, 'utf8').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
} catch (err) {
    console.error(`Error reading file "${inputFilePath}":`, err.message);
    process.exit(1);
}

// Function to extract fields from a single entry
function extractFields(text) {
    const fieldRegex = /\*\*(.*?):\*\*\s*(?:- )?(.*?)(?=\n\*\*|$)/gs;
    const fields = {};
    let match;

    while ((match = fieldRegex.exec(text)) !== null) {
        const key = match[1].trim();
        let value = match[2].trim();

        if (value.startsWith('- ')) {
            value = value.substring(2).trim();
        }

        if (key === 'QR Code Image') {
            const urlMatch = value.match(/\((https?:\/\/[^\s)]+)\)/);
            if (urlMatch) {
                value = urlMatch[1];
            } else {
                console.warn(`No URL found in QR Code Image field: "${value}"`);
            }
        }

        const camelCaseKey = key
            .toLowerCase()
            .replace(/[^a-zA-Z0-9 ]/g, '')
            .split(' ')
            .map((word, index) => index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
            .join('');

        fields[camelCaseKey] = value;
    }

    return fields;
}

// Extract fields and add the issue ID
const extracted = extractFields(inputText);
extracted.issueId = issueId;  // Add issue ID to extracted fields

fs.writeFileSync('extractedFields.json', JSON.stringify(extracted, null, 2));
console.log('Fields extracted:', extracted);

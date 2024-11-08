const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Load extracted fields from JSON
const extractedFields = JSON.parse(fs.readFileSync('extractedFields.json', 'utf8'));
const { typeOfInstitute, nameOfTheMasjid, nameOfTheCity, state, qrCodeImage,remarks } = extractedFields;

// Determine category based on institute type
const category = typeOfInstitute.toLowerCase() === "masjid" ? "mosque" : typeOfInstitute.toLowerCase();

// Path to institutions.ts file
const filePath = path.join(__dirname, '../app', 'data', 'institutions.ts');

// Function to decode QR code using the API
async function decodeQRCode(url) {
  try {
    const apiUrl = `https://api.qrserver.com/v1/read-qr-code/?fileurl=${encodeURIComponent(url)}`;
    const response = await axios.get(apiUrl);

    const qrData = response.data;
    if (qrData && qrData[0].symbol && qrData[0].symbol[0].data) {
      return qrData[0].symbol[0].data;
    } else {
      console.error("No QR code data found in the response.");
      return "";
    }
  } catch (error) {
    console.error(`Error decoding QR code from URL "${url}":`, error.message);
    return "";
  }
}

(async () => {
  try {
    // Decode QR code
    const qrContent = await decodeQRCode(qrCodeImage);

    // Read the existing institutions.ts file
    let fileContent = fs.readFileSync(filePath, 'utf8');

    // Find all existing IDs to determine the next ID
    const idMatches = fileContent.match(/id:\s*(\d+),/g);
    const nextId = idMatches
      ? Math.max(...idMatches.map(id => parseInt(id.match(/\d+/)[0]))) + 1
      : 1;

    // Escape double quotes in qrContent to prevent syntax errors
    const escapedQrContent = qrContent.replace(/"/g, '\\"');

    let supportedPayment = '["duitnow", "tng"]'
    if (qrCodeImage.includes("tngdigital")){
      supportedPayment = '["tng"]'
    }

    // Create a new institution entry with qrContent
    const newInstitution =
  `  // ${remarks}
  {
    id: ${nextId},
    name: "${nameOfTheMasjid}",
    category: "${category}",
    state: "${state}",
    city: "${nameOfTheCity}",
    qrImage: "${qrCodeImage}",
    qrContent: "${escapedQrContent}",
    supportedPayment: ${supportedPayment}
  },
`;

    // Insert the new institution before the closing bracket of the array
    const closingBracketIndex = fileContent.lastIndexOf('];');
    if (closingBracketIndex === -1) {
      throw new Error("Error: Couldn't find the closing bracket of the institutions array.");
    }

    // Insert the new institution
    fileContent =
      fileContent.slice(0, closingBracketIndex) +
      newInstitution +
      fileContent.slice(closingBracketIndex);

    // Write the updated content back to institutions.ts
    fs.writeFileSync(filePath, fileContent, 'utf8');

    console.log('New institution appended successfully with decoded QR content.');
  } catch (error) {
    console.error("An error occurred while appending the institution:", error);
    process.exit(1);
  }
})();

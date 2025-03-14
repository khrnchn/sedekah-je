const fs = require("node:fs");
const path = require("node:path");
const axios = require("axios");

// Load extracted fields from JSON
const extractedFields = JSON.parse(
	fs.readFileSync("extractedFields.json", "utf8"),
);
const {
	typeOfInstitute,
	nameOfTheMasjid,
	nameOfTheCity,
	state,
	qrCodeImage,
	remarks,
	issueId,
} = extractedFields;

// Determine category based on institute type
const category =
	typeOfInstitute.toLowerCase() === "masjid"
		? "mosque"
		: typeOfInstitute.toLowerCase();

// Path to institutions.ts file
const filePath = path.join(__dirname, "../app", "data", "institutions.ts");

// Function to decode QR code using the API
async function decodeQRCode(url, retries = 3) {
	try {
		console.log(`Attempting to decode QR code from URL: ${url}`);
		const apiUrl = `https://zxing.org/w/decode?u=${encodeURIComponent(url)}`;
		console.log(`Sending request to ZXing API: ${apiUrl}`);

		const response = await axios.get(apiUrl);
		console.log("Received response from ZXing API:", response.status);

		// Parse the HTML response to extract the decoded text
		const htmlResponse = response.data;

		// Look for the decoded text in the response
		const decodedMatch = htmlResponse.match(/<pre>(.*?)<\/pre>/s);
		if (decodedMatch?.[1]) {
			const decodedText = decodedMatch[1].trim();
			console.log("QR code data found:", decodedText);
			return decodedText;
		}

		// Check if there was an error message
		const errorMatch = htmlResponse.match(/<div class="error">(.*?)<\/div>/s);
		if (errorMatch?.[1]) {
			console.warn(`ZXing API error: ${errorMatch[1].trim()}`);
		} else {
			console.warn("No QR code data found in the response");
		}

		if (retries > 0) {
			console.log(`Retrying QR code decoding (${retries} retries left)...`);
			await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds
			return decodeQRCode(url, retries - 1);
		}

		return "";
	} catch (error) {
		console.error(`Error decoding QR code from URL "${url}":`, error.message);

		if (error.response) {
			console.error("Response status:", error.response.status);
			console.error(
				"Response data:",
				JSON.stringify(error.response.data, null, 2),
			);
		}

		if (retries > 0) {
			console.log(`Retrying QR code decoding (${retries} retries left)...`);
			await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds
			return decodeQRCode(url, retries - 1);
		}

		return "";
	}
}

// Main process to append the institution
(async () => {
	try {
		console.log("Starting institution append process...");
		console.log("Institution details:", {
			typeOfInstitute,
			nameOfTheMasjid,
			nameOfTheCity,
			state,
			qrCodeImage,
			remarks,
			issueId,
		});

		// Decode QR code
		const qrContent = await decodeQRCode(qrCodeImage);

		// Read the existing institutions.ts file
		let fileContent = fs.readFileSync(filePath, "utf8");

		// Find all existing IDs to determine the next ID
		const idMatches = fileContent.match(/id:\s*(\d+),/g);
		const nextId = idMatches
			? Math.max(
					...idMatches.map((id) => Number.parseInt(id.match(/\d+/)[0])),
				) + 1
			: 1;

		console.log(`Using next ID: ${nextId}`);

		// Escape double quotes in qrContent to prevent syntax errors
		const escapedQrContent = qrContent.replace(/"/g, '\\"');

		let supportedPayment = '["duitnow", "tng"]';
		if (qrCodeImage.includes("tngdigital")) {
			supportedPayment = '["tng"]';
		}

		// Determine whether to include qrImage or not based on qrContent
		let qrImageField = "";
		let qrContentField = "";

		if (qrContent) {
			// If QR content was successfully extracted, only include qrContent
			qrContentField = `\n    qrContent: "${escapedQrContent}",`;
		} else {
			// If QR content couldn't be extracted, only include qrImage
			qrImageField = `\n    qrImage: "${qrCodeImage}",`;
			console.log("QR code could not be decoded. Using qrImage instead.");
		}

		// Create a new institution entry with qrContent
		const newInstitution = `  // ${remarks}
  {
    id: ${nextId},
    name: "${nameOfTheMasjid}",
    category: "${category}",
    state: "${state}",
  	city: "${nameOfTheCity}",${qrImageField}${qrContentField}
    supportedPayment: ${supportedPayment}
  },
`;

		// Insert the new institution before the closing bracket of the array
		const closingBracketIndex = fileContent.lastIndexOf("];");
		if (closingBracketIndex === -1) {
			throw new Error(
				"Error: Couldn't find the closing bracket of the institutions array.",
			);
		}

		// Insert the new institution
		fileContent =
			fileContent.slice(0, closingBracketIndex) +
			newInstitution +
			fileContent.slice(closingBracketIndex);

		// Write the updated content back to institutions.ts
		fs.writeFileSync(filePath, fileContent, "utf8");

		console.log(
			"New institution appended successfully with decoded QR content.",
		);
	} catch (error) {
		console.error("An error occurred while appending the institution:", error);
		process.exit(1);
	}
})();

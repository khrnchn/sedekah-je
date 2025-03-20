const fs = require("node:fs");
const path = require("node:path");
const axios = require("axios");
const jsQR = require("jsqr");
const sharp = require("sharp");

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

// Sanitize inputs to prevent injection
function sanitizeForJavaScript(input) {
	if (typeof input !== 'string') return '';
	return input.replace(/["'\\]/g, (char) => '\\' + char);
}

// Sanitize all inputs
const sanitizedTypeOfInstitute = sanitizeForJavaScript(typeOfInstitute || '');
const sanitizedNameOfTheMasjid = sanitizeForJavaScript(nameOfTheMasjid || '');
const sanitizedNameOfTheCity = sanitizeForJavaScript(nameOfTheCity || '');
const sanitizedState = sanitizeForJavaScript(state || '');
const sanitizedRemarks = sanitizeForJavaScript(remarks || '');

// Validate QR code URL - only accept http/https URLs
const sanitizedQrCodeImage = (qrCodeImage && /^https?:\/\//i.test(qrCodeImage))
	? qrCodeImage
	: '';

if (!sanitizedQrCodeImage) {
	console.warn("Invalid or missing QR code URL - proceeding without QR code");
}

// Determine category based on institute type - use sanitized value
const category =
	sanitizedTypeOfInstitute.toLowerCase() === "masjid"
		? "mosque"
		: sanitizedTypeOfInstitute.toLowerCase();

// Path to institutions.ts file
const filePath = path.join(__dirname, "../app", "data", "institutions.ts");

// Function to decode QR code using jsQR locally
async function decodeQRCode(url, retries = 1) {
	if (!url) return "";

	try {
		console.log(`Attempting to decode QR code from URL: ${url}`);

		// Download the image
		const response = await axios.get(url, {
			responseType: 'arraybuffer',
			timeout: 5000
		});

		// Process the image with sharp
		const image = await sharp(response.data)
			.ensureAlpha()
			.raw()
			.toBuffer({ resolveWithObject: true });

		// Decode QR code
		const code = jsQR(
			new Uint8ClampedArray(image.data),
			image.info.width,
			image.info.height
		);

		if (code) {
			console.log("QR code successfully decoded");
			return code.data;
		}

		console.warn("No QR code found in the image");

		if (retries > 0) {
			console.log(`Retrying QR code decoding (${retries} retries left)...`);
			await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds
			return decodeQRCode(url, retries - 1);
		}

		return "";
	} catch (error) {
		console.error(`Error decoding QR code: ${error.message}`);

		if (retries > 0 && !error.message.includes('timeout')) {
			console.log(`Retrying QR code decoding (${retries} retries left)...`);
			await new Promise((resolve) => setTimeout(resolve, 2000));
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
			typeOfInstitute: sanitizedTypeOfInstitute,
			nameOfTheMasjid: sanitizedNameOfTheMasjid,
			nameOfTheCity: sanitizedNameOfTheCity,
			state: sanitizedState,
			qrCodeImage: sanitizedQrCodeImage,
			remarks: sanitizedRemarks,
			issueId,
		});

		// Decode QR code - proceed even if it fails
		let qrContent = "";
		try {
			qrContent = await decodeQRCode(sanitizedQrCodeImage);
		} catch (error) {
			console.warn("Failed to decode QR code, proceeding without QR content:", error.message);
		}

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
		const escapedQrContent = (qrContent || '').replace(/"/g, '\\"');

		let supportedPayment = '["duitnow", "tng"]';
		if (sanitizedQrCodeImage.includes("tngdigital")) {
			supportedPayment = '["tng"]';
		}

		// Always include qrImage if provided, and add qrContent if successfully decoded
		const qrFields = [];
		if (sanitizedQrCodeImage) {
			qrFields.push(`qrImage: "${sanitizedQrCodeImage}"`);
		}
		if (qrContent) {
			qrFields.push(`qrContent: "${escapedQrContent}"`);
		}
		const qrFieldsString = qrFields.length > 0 ? `\n    ${qrFields.join(",\n    ")},` : "";

		// Create a new institution entry
		const newInstitution = `  // ${sanitizedRemarks}
  {
    id: ${nextId},
    name: "${sanitizedNameOfTheMasjid}",
    category: "${category}",
    state: "${sanitizedState}",
    city: "${sanitizedNameOfTheCity}",${qrFieldsString}
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

		console.log("New institution appended successfully.");
	} catch (error) {
		console.error("An error occurred while appending the institution:", error);
		process.exit(1);
	}
})();

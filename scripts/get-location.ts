import fs from "node:fs";
import path from "node:path";

// Path to institutions.ts file
const filePath = path.join(__dirname, '../app/data/institutions.ts');

const apiKey = ""

// Function to get coordinates from OpenStreetMap
async function getCoordinates(name: string, city: string, state: string) {
  const query = `${name}, ${city}, ${state}`;
  const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=geometry&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.candidates && data.candidates.length > 0) {
      const { lat, lng } = data.candidates[0].geometry.location;
      return [Number.parseFloat(lat), Number.parseFloat(lng)];
    }
    console.error(`No coordinates found for ${query}`);
    return null;
  } catch (error) {
    console.error(`Error fetching coordinates for ${query}:`, error);
    return null;
  }
}

// Function to update institutions with missing coordinates
async function updateInstitutions() {
  if (apiKey === "") {
    console.error("please insert your google api key")
    return
  }
  let fileContent = fs.readFileSync(filePath, 'utf8');
  const institutionRegex = /(\{[^}]*\})/g;
  const institutions = fileContent.match(institutionRegex);

  if (!institutions) {
    console.error("No institutions found in the file.");
    return;
  }
  const promises = institutions.map(async (institution, index) => {
    if (!institution.includes('coords')) {
      const nameMatch = institution.match(/name:\s*"([^"]*)"/);
      const cityMatch = institution.match(/city:\s*"([^"]*)"/);
      const stateMatch = institution.match(/state:\s*"([^"]*)"/);

      if (nameMatch && cityMatch && stateMatch) {
        const name = nameMatch[1];
        const city = cityMatch[1];
        const state = stateMatch[1];

        const coords = await getCoordinates(name, city, state);
        console.log({ name, coords })
        if (coords) {
          const coordsString = `coords: [${coords[0]}, ${coords[1]}],`;
          const updatedInstitution = institution.replace(/(supportedPayment: \[[^\]]*\])(,?)/, `$1,\n    ${coordsString}`);
          institutions[index] = updatedInstitution;
        }
      }
    }
  });

  await Promise.all(promises);

  fileContent = fileContent.replace(institutionRegex, () => {
    const institution = institutions.shift();
    return institution ? institution : '';
  });
  fs.writeFileSync(filePath, fileContent, 'utf8');
  console.log('Institutions updated successfully.');
}

updateInstitutions();

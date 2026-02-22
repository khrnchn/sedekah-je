import * as cheerio from "cheerio";

const BASE_URL = "https://e-masjid.jais.gov.my";
const LIST_URL = `${BASE_URL}/dashboard/listmasjid`;
const PROFILE_URL = (id: number) => `${BASE_URL}/profail/masjid/${id}/showhome`;
const PROFILE_RETRIES = 3;
const PROFILE_RETRY_DELAY_MS = 300;

interface Mosque {
	jaisId: number;
	nama: string;
	alamat: string;
	daerah: string;
}

async function getPetalingMosqueIds(): Promise<{ id: number; nama: string }[]> {
	console.log("Fetching mosque list...");
	const res = await fetch(LIST_URL);
	if (!res.ok) {
		throw new Error(
			`Failed to fetch mosque list (${res.status} ${res.statusText})`,
		);
	}
	const html = await res.text();
	const $ = cheerio.load(html);

	const mosques: { id: number; nama: string }[] = [];

	$("table tbody tr").each((_, row) => {
		const cells = $(row).find("td");
		if (cells.length < 4) return;

		const daerah = $(cells[2]).text().trim();
		if (daerah !== "Petaling") return;

		const nama = $(cells[1]).text().trim();
		const profileLink = $(row).find('a[href*="/profail/masjid/"]').attr("href");
		if (!profileLink) return;

		const idMatch = profileLink.match(/\/profail\/masjid\/(\d+)\//);
		if (!idMatch) return;

		const id = Number.parseInt(idMatch[1], 10);

		// Skip test entries
		const lower = nama.toLowerCase();
		if (lower === "test" || lower === "ict masjid") return;

		mosques.push({ id, nama });
	});

	console.log(`Found ${mosques.length} Petaling mosques`);
	return mosques;
}

async function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getAddress(id: number): Promise<string> {
	for (let attempt = 1; attempt <= PROFILE_RETRIES; attempt++) {
		try {
			const res = await fetch(PROFILE_URL(id));
			if (!res.ok) {
				if (attempt === PROFILE_RETRIES) {
					console.warn(
						`Failed to fetch profile for ID ${id}: ${res.status} ${res.statusText}`,
					);
					return "";
				}
				await sleep(PROFILE_RETRY_DELAY_MS * attempt);
				continue;
			}
			const html = await res.text();
			const $ = cheerio.load(html);

			let address = "";

			// Find the element labelled "Alamat" and get the next sibling's text
			$("td, th, dt, label").each((_, el) => {
				const text = $(el).text().trim();
				if (text === "Alamat") {
					const next = $(el).next();
					if (next.length) {
						address = next.text().replace(/\s+/g, " ").trim();
					}
				}
			});

			return address;
		} catch (error) {
			if (attempt === PROFILE_RETRIES) {
				console.warn(`Failed to fetch profile for ID ${id}:`, error);
				return "";
			}
			await sleep(PROFILE_RETRY_DELAY_MS * attempt);
		}
	}

	return "";
}

async function main() {
	const list = await getPetalingMosqueIds();
	const results: Mosque[] = [];
	const BATCH_SIZE = 5;

	for (let i = 0; i < list.length; i += BATCH_SIZE) {
		const batch = list.slice(i, i + BATCH_SIZE);
		const batchResults = await Promise.all(
			batch.map(async (item, j) => {
				const alamat = await getAddress(item.id);
				const idx = i + j + 1;
				console.log(`[${idx}/${list.length}] ID:${item.id} ${item.nama}`);
				return {
					jaisId: item.id,
					nama: item.nama,
					alamat,
					daerah: "Petaling" as const,
				};
			}),
		);
		results.push(...batchResults);

		if (i + BATCH_SIZE < list.length) {
			await new Promise((r) => setTimeout(r, 500));
		}
	}

	const outputPath = `${import.meta.dir}/../data/jais-petaling.json`;
	await Bun.write(outputPath, JSON.stringify(results, null, 2));
	console.log(
		`\nDone! Wrote ${results.length} mosques to data/jais-petaling.json`,
	);
}

main().catch((err) => {
	console.error("Scrape failed:", err);
	process.exit(1);
});

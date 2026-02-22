import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { db } from "@/db";
import type { NewQuestMosque } from "@/db/schema";
import { questMosques } from "@/db/schema";

type JaisMosque = {
	jaisId: number;
	nama: string;
	alamat: string;
	daerah: string;
};

const raw: JaisMosque[] = JSON.parse(
	readFileSync(resolve(__dirname, "../data/jais-petaling.json"), "utf-8"),
);

const mosques: NewQuestMosque[] = raw.map((m) => ({
	name: m.nama,
	address: m.alamat,
	district: m.daerah,
	jaisId: String(m.jaisId),
}));

async function seed() {
	console.log(`Seeding ${mosques.length} quest mosques...`);

	await db
		.insert(questMosques)
		.values(mosques)
		.onConflictDoNothing({ target: questMosques.jaisId });

	console.log("Seeding complete.");
}

seed()
	.then(() => {
		console.log("Done!");
		process.exit(0);
	})
	.catch((err) => {
		console.error("Seed failed:", err);
		process.exit(1);
	});

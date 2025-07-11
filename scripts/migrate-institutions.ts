import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { institutions } from "../app/data/institutions";
import { institutions as institutionsTable } from "../db/institutions";
import type { categories, states } from "../lib/institution-constants";

// Database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
	throw new Error("DATABASE_URL environment variable is required");
}

const pool = new Pool({
	connectionString,
});
const db = drizzle(pool);

async function migrateInstitutions() {
	console.log(`Starting migration of ${institutions.length} institutions...`);

	try {
		// Clear existing data (optional - remove if you want to keep existing data)
		console.log("Clearing existing institutions...");
		await db.delete(institutionsTable);

		// Insert data in batches to avoid overwhelming the database
		const batchSize = 100;
		const batches = [];

		for (let i = 0; i < institutions.length; i += batchSize) {
			batches.push(institutions.slice(i, i + batchSize));
		}

		console.log(`Processing ${batches.length} batches...`);

		for (let i = 0; i < batches.length; i++) {
			const batch = batches[i];
			console.log(
				`Processing batch ${i + 1}/${batches.length} (${batch.length} institutions)...`,
			);

			// Map data to match database schema
			const mappedData = batch.map((institution) => ({
				name: institution.name,
				description: institution.description,
				category: (institution.category === "mosque"
					? "masjid"
					: institution.category === "others"
						? "lain-lain"
						: "surau") as (typeof categories)[number],
				state: institution.state as (typeof states)[number],
				city: institution.city,
				qrImage: institution.qrImage,
				qrContent: institution.qrContent,
				supportedPayment: institution.supportedPayment as
					| ("duitnow" | "tng" | "boost")[]
					| undefined,
				coords: institution.coords,
				// Set all migrated institutions as approved since they're existing data
				status: "approved" as const,
				isVerified: true,
				isActive: true,
			}));

			await db.insert(institutionsTable).values(mappedData);
		}

		console.log("✅ Migration completed successfully!");

		// Verify the count
		const count = await db.select().from(institutionsTable);
		console.log(`Total institutions in database: ${count.length}`);
	} catch (error) {
		console.error("❌ Migration failed:", error);
		process.exit(1);
	} finally {
		await pool.end();
	}
}

// Run the migration
migrateInstitutions().catch(console.error);

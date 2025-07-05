import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { institutions } from "../db/institutions";

// Database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
	throw new Error("DATABASE_URL environment variable is required");
}

const pool = new Pool({
	connectionString,
});
const db = drizzle(pool);

async function verifyMigration() {
	console.log("🔍 Verifying migration...");

	try {
		// Check total count
		const totalCount = await db
			.select({ count: sql<number>`count(*)` })
			.from(institutions);
		console.log(`Total institutions in database: ${totalCount[0].count}`);

		// Check by category
		const byCategory = await db
			.select({
				category: institutions.category,
				count: sql<number>`count(*)`,
			})
			.from(institutions)
			.groupBy(institutions.category);

		console.log("\nBreakdown by category:");
		for (const { category, count } of byCategory) {
			console.log(`  ${category}: ${count}`);
		}

		// Check by state (top 10)
		const byState = await db
			.select({
				state: institutions.state,
				count: sql<number>`count(*)`,
			})
			.from(institutions)
			.groupBy(institutions.state)
			.orderBy(sql`count(*) desc`)
			.limit(10);

		console.log("\nTop 10 states by count:");
		for (const { state, count } of byState) {
			console.log(`  ${state}: ${count}`);
		}

		// Check a few sample records
		const samples = await db.select().from(institutions).limit(3);
		console.log("\nSample records:");
		samples.forEach((institution, index) => {
			console.log(
				`  ${index + 1}. ${institution.name} (${institution.category}) - ${institution.city}, ${institution.state}`,
			);
		});

		// Check for required fields
		const missingRequired = await db
			.select({
				id: institutions.id,
				name: institutions.name,
				category: institutions.category,
				state: institutions.state,
				city: institutions.city,
			})
			.from(institutions)
			.where(
				sql`${institutions.name} IS NULL OR ${institutions.category} IS NULL OR ${institutions.state} IS NULL OR ${institutions.city} IS NULL`,
			);

		if (missingRequired.length > 0) {
			console.log(
				`\n⚠️  Warning: ${missingRequired.length} records have missing required fields`,
			);
		} else {
			console.log("\n✅ All records have required fields");
		}

		console.log("\n✅ Migration verification completed!");
	} catch (error) {
		console.error("❌ Verification failed:", error);
		process.exit(1);
	} finally {
		await pool.end();
	}
}

// Run the verification
verifyMigration().catch(console.error);

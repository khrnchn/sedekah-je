import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { seedBanks } from "./seeders/banks";
import { seedCategories } from "./seeders/categories";
import { seedCities } from "./seeders/cities";
import { seedInstitutions } from "./seeders/institutions";
import { seedPaymentMethods } from "./seeders/methods";
import { seedSocials } from "./seeders/socials";
import { seedStates } from "./seeders/states";
import { seedUsers } from "./seeders/users";

async function main() {
	const pool = new Pool({
		connectionString: process.env.DATABASE_URL,
	});

	const db = drizzle(pool);

	const client = await pool.connect();

	try {
		await client.query("BEGIN");
		console.log("🌱 Starting database seeding...");

		await seedCategories(client);
		await seedStates(client);
		await seedCities(client);
		await seedBanks(client);
		await seedUsers(client);
		await seedSocials(client);
		await seedPaymentMethods(client);
		await seedInstitutions(client);

		await client.query("COMMIT");
		console.log("✅ Database seeding completed successfully");
	} catch (error) {
		await client.query("ROLLBACK");
		console.error("❌ Database seeding failed:", error);
		throw error;
	} finally {
		client.release();
		await pool.end();
		process.exit(0);
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});

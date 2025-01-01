import { users } from "@/db/schema";
import type { PoolClient } from "pg";
import { db } from "..";

export async function seedUsers(client: PoolClient) {
	const data = [
		{
			clerkId: "test",
			name: "SedekahJe Admin",
			email: "admin@admin.com",
			password: await Bun.password.hash("password"),
			isAdmin: true,
		},
	];

	console.log("🌱 Seeding users...");

	try {
		await db.insert(users).values(data);
		console.log("✅ Users seeded successfully");
	} catch (error) {
		console.error("❌ Error seeding users:", error);
		throw error;
	}
}

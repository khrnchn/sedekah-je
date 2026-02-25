import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { db } from "./db";
import * as schema from "./db/schema";
import { logNewUser } from "./lib/telegram";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: {
			user: schema.users,
			session: schema.sessions,
			account: schema.accounts,
			verification: schema.verifications,
		},
	}),
	plugins: [admin(), nextCookies()],
	// emailAndPassword: {
	//	enabled: true,
	// },
	socialProviders: {
		google: {
			// always ask the user to select an account
			prompt: "select_account",
			clientId: process.env.GOOGLE_CLIENT_ID as string,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
		},
	},
	session: {
		expiresIn: 60 * 60 * 24 * 7, // 7 days
		updateAge: 60 * 60 * 24, // 1 day
	},
	secret: (() => {
		if (!process.env.BETTER_AUTH_SECRET) {
			throw new Error("BETTER_AUTH_SECRET environment variable is required");
		}
		return process.env.BETTER_AUTH_SECRET;
	})(),
	baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
	trustedOrigins: [
		"https://sedekah.je",
		"https://sedekah-je-production.up.railway.app",
		"http://localhost:3000",
	],
	databaseHooks: {
		user: {
			create: {
				after: async (user) => {
					try {
						await logNewUser({
							id: user.id,
							name: user.name || "Unknown",
							email: user.email,
							role: "user", // Default role for new users
						});
					} catch (error) {
						console.error("Failed to log new user to Telegram:", error);
					}
					// Mark new users for onboarding tour (first login only)
					try {
						await db
							.update(schema.users)
							.set({
								onboardingTourState: "not_started",
							})
							.where(eq(schema.users.id, user.id));
					} catch (error) {
						console.error(
							"Failed to set onboarding state for new user:",
							error,
						);
					}
				},
			},
		},
	},
});

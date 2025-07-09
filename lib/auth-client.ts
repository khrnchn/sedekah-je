import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	baseURL: process.env.NEXT_PUBLIC_VERCEL_URL
		? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
		: "http://localhost:3000",
});

export const signInWithGoogle = async () => {
	try {
		const data = await authClient.signIn.social({
			provider: "google",
			callbackURL: "/contribute",
		});

		return data;
	} catch (error) {
		console.error(error);
		throw new Error("Failed to sign in with Google");
	}
};

export const { useSession, signOut } = authClient;

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	baseURL:
		typeof window !== "undefined"
			? window.location.hostname === "sedekah.je"
				? "https://sedekah.je"
				: window.location.origin
			: process.env.NODE_ENV === "production"
				? "https://sedekah.je"
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

export const { useSession } = authClient;

export const signOut = async () => {
	await authClient.signOut({
		fetchOptions: {
			onSuccess: () => {
				// Force a full page reload to ensure clean state
				window.location.href = "/";
			},
		},
	});
};

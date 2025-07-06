import { signOut, useSession } from "@/lib/auth-client";

interface AuthUser {
	id: string;
	email: string;
	name?: string;
	role?: string;
}

export function useAuth() {
	const session = useSession();
	const user = session.data?.user as AuthUser;

	return {
		user,
		isAuthenticated: !!session.data?.user,
		isLoading: session.isPending,
		isAdmin: user?.role === "admin",
		signOut,
	};
}

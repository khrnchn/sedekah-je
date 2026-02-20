"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/use-auth";

interface ProtectedRouteProps {
	children: React.ReactNode;
	requireAuth?: boolean;
	requireAdmin?: boolean;
	fallback?: React.ReactNode;
}

export function ProtectedRoute({
	children,
	requireAuth = true,
	requireAdmin = false,
	fallback,
}: ProtectedRouteProps) {
	const { isAuthenticated, isLoading, isAdmin } = useAuth();
	const router = useRouter();
	const pathname = usePathname();

	useEffect(() => {
		if (!isLoading) {
			if (requireAuth && !isAuthenticated) {
				router.push(`/auth?redirect=${pathname}`);
			} else if (requireAdmin && !isAdmin) {
				router.push("/");
			}
		}
	}, [
		isLoading,
		isAuthenticated,
		isAdmin,
		requireAuth,
		requireAdmin,
		router,
		pathname,
	]);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<Spinner className="h-8 w-8" />
			</div>
		);
	}

	if (requireAuth && !isAuthenticated) {
		return fallback || null;
	}

	if (requireAdmin && !isAdmin) {
		return (
			fallback || (
				<div className="flex items-center justify-center min-h-screen">
					<div className="text-center">
						<h2 className="text-2xl font-bold mb-2">Access Denied</h2>
						<p className="text-gray-600">
							You don't have permission to access this page.
						</p>
					</div>
				</div>
			)
		);
	}

	return <>{children}</>;
}

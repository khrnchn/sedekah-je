import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "next/navigation";
// hooks/use-navigation-loading.ts
import { useCallback, useState } from "react";

interface NavigateOptions {
	showOverlay?: boolean;
	onSuccess?: () => void;
	onError?: (error: unknown) => void;
}

export function useNavigationLoading() {
	const router = useRouter();
	const [isNavigating, setIsNavigating] = useState(false);
	const [shouldShowOverlay, setShouldShowOverlay] = useState(true);
	const [isLoading, setIsLoading] = useState(false);

	const handleNavigation = useCallback(
		async (
			navigationFn: () => Promise<void> | void,
			options: NavigateOptions = {},
		) => {
			const { showOverlay = true, onSuccess, onError } = options;

			try {
				setIsNavigating(true);
				setShouldShowOverlay(showOverlay);

				await Promise.all([
					navigationFn(),
					new Promise((resolve) => setTimeout(resolve, 100)),
				]);

				onSuccess?.();
			} catch (error) {
				onError?.(error);
				console.error("Navigation error:", error);
			} finally {
				setTimeout(() => {
					setIsNavigating(false);
					setShouldShowOverlay(true);
				}, 200);
			}
		},
		[],
	);

	const navigate = useCallback(
		async (path: string, options: NavigateOptions = {}) => {
			await handleNavigation(() => router.push(path), options);
		},
		[router, handleNavigation],
	);

	const back = useCallback(
		async (options: NavigateOptions = {}) => {
			await handleNavigation(() => router.back(), options);
		},
		[router, handleNavigation],
	);

	const LoadingOverlay = useCallback(() => {
		if (!isNavigating || !shouldShowOverlay) return null;

		return (
			<div className="fixed inset-0 bg-gray-500/50 flex items-center justify-center z-50">
				<Spinner size="medium" />
			</div>
		);
	}, [isNavigating, shouldShowOverlay]);

	return {
		isNavigating,
		navigate,
		back,
		LoadingOverlay,
	};
}

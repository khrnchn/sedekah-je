import { useCallback, useState } from "react";

export function useLoading() {
	const [isLoading, setIsLoading] = useState(false);

	const startLoading = useCallback(() => setIsLoading(true), []);
	const stopLoading = useCallback(() => setIsLoading(false), []);

	const withLoading = useCallback(
		<T extends (...args: unknown[]) => Promise<unknown>>(asyncFunction: T) => {
			return async (...args: Parameters<T>) => {
				try {
					startLoading();
					return await asyncFunction(...args);
				} finally {
					stopLoading();
				}
			};
		},
		[startLoading, stopLoading],
	);

	return { isLoading, withLoading };
}

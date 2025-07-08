"use client";

import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function InstitutionsError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		// Log the error to an error reporting service
		console.error("Institutions module error:", error);
	}, [error]);

	return (
		<div className="flex h-[400px] flex-col items-center justify-center space-y-4">
			<div className="text-center">
				<h2 className="text-xl font-semibold text-destructive">
					Failed to load institutions
				</h2>
				<p className="text-sm text-muted-foreground mt-2">
					There was an error loading the institutions data. Please try again.
				</p>
				{process.env.NODE_ENV === "development" && (
					<details className="mt-4 text-left">
						<summary className="cursor-pointer text-sm text-muted-foreground">
							Error details (development only)
						</summary>
						<pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-w-md">
							{error.message}
						</pre>
					</details>
				)}
			</div>
			<Button onClick={reset} variant="outline">
				Try again
			</Button>
		</div>
	);
}

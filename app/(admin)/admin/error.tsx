"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AdminError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		// Log the error to an error reporting service
		console.error("Admin error:", error);
	}, [error]);

	return (
		<div className="flex min-h-[400px] flex-col items-center justify-center p-8">
			<div className="flex flex-col items-center space-y-4 text-center">
				<div className="rounded-full bg-red-100 p-3 dark:bg-red-900/20">
					<AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
				</div>

				<div className="space-y-2">
					<h2 className="text-2xl font-semibold">Something went wrong!</h2>
					<p className="text-muted-foreground max-w-md">
						We encountered an error while loading the admin dashboard. This
						could be a temporary issue.
					</p>
				</div>

				<div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
					<Button
						onClick={() => reset()}
						variant="default"
						className="min-w-[120px]"
					>
						<RefreshCw className="mr-2 h-4 w-4" />
						Try again
					</Button>
					<Button asChild variant="outline" className="min-w-[120px]">
						<Link href="/admin">Go to Dashboard</Link>
					</Button>
				</div>

				{process.env.NODE_ENV === "development" && (
					<details className="mt-4 w-full max-w-lg">
						<summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
							Error Details (Development)
						</summary>
						<pre className="mt-2 rounded-md bg-muted p-4 text-xs overflow-auto">
							{error.message}
							{error.stack && `\n\nStack trace:\n${error.stack}`}
						</pre>
					</details>
				)}
			</div>
		</div>
	);
}

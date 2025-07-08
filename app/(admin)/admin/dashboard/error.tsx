"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle, BarChart, RefreshCw } from "lucide-react";
import { useEffect } from "react";

export default function DashboardError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error("Dashboard error:", error);
	}, [error]);

	return (
		<div className="flex min-h-[300px] flex-col items-center justify-center p-6">
			<div className="flex flex-col items-center space-y-4 text-center">
				<div className="rounded-full bg-red-100 p-3 dark:bg-red-900/20">
					<BarChart className="h-6 w-6 text-red-600 dark:text-red-400" />
				</div>

				<div className="space-y-2">
					<h3 className="text-lg font-semibold">Dashboard Error</h3>
					<p className="text-sm text-muted-foreground max-w-md">
						Failed to load dashboard data. Please try refreshing.
					</p>
				</div>

				<Button onClick={() => reset()} size="sm" className="min-w-[100px]">
					<RefreshCw className="mr-2 h-4 w-4" />
					Retry
				</Button>
			</div>
		</div>
	);
}

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Globe, TrendingUp, Users } from "lucide-react";
import { getDashboardStats, getInstitutionsByState } from "../queries";

// This component demonstrates streaming by having a slight delay
async function StreamingStatsComponent() {
	// Simulate some processing time to demonstrate streaming
	await new Promise((resolve) => setTimeout(resolve, 1000));

	const [stats, stateData] = await Promise.all([
		getDashboardStats(),
		getInstitutionsByState(),
	]);

	const activeStat = stateData.filter((s) => s.count > 0).length;
	const topState = stateData[0];
	const approvalRate =
		stats.total > 0 ? ((stats.approved / stats.total) * 100).toFixed(1) : "0";

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">Active States</CardTitle>
					<Globe className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">{activeStat}</div>
					<p className="text-xs text-muted-foreground">
						States with institutions
					</p>
					<div className="mt-2">
						<Badge variant="success" className="text-xs">
							{topState ? `${topState.state} leads` : "No data"}
						</Badge>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
					<TrendingUp className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">{approvalRate}%</div>
					<p className="text-xs text-muted-foreground">Institutions approved</p>
					<div className="mt-2">
						<Badge
							variant={Number(approvalRate) > 70 ? "success" : "warning"}
							className="text-xs"
						>
							{Number(approvalRate) > 70 ? "Excellent" : "Good"}
						</Badge>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">Top State</CardTitle>
					<Users className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">{topState?.count || 0}</div>
					<p className="text-xs text-muted-foreground">
						{topState?.state || "No data"}
					</p>
					<div className="mt-2">
						<Badge variant="default" className="text-xs">
							Leading
						</Badge>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">Platform Health</CardTitle>
					<Activity className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">98%</div>
					<p className="text-xs text-muted-foreground">System operational</p>
					<div className="mt-2">
						<Badge variant="success" className="text-xs">
							Healthy
						</Badge>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

export { StreamingStatsComponent };

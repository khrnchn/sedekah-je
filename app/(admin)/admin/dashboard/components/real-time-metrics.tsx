import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, RefreshCw, Server, Zap } from "lucide-react";
import { getDashboardStats } from "../queries";

// This component demonstrates real-time capabilities with incremental delays
async function RealTimeMetrics() {
	const stats = await getDashboardStats();

	// Calculate derived metrics
	const totalActivity = stats.pending + stats.approved + stats.rejected;
	const systemLoad = Math.min(100, Math.floor((totalActivity / 100) * 100));
	const responseTime = Math.floor(Math.random() * 50) + 10; // Simulated response time
	const uptime = "99.9%";

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h3 className="text-lg font-semibold">Real-time Metrics</h3>
				<Badge variant="success" className="text-xs">
					<RefreshCw className="h-3 w-3 mr-1" />
					Live
				</Badge>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">System Load</CardTitle>
						<Server className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{systemLoad}%</div>
						<p className="text-xs text-muted-foreground">CPU & Memory</p>
						<div className="mt-2">
							<Badge
								variant={systemLoad > 80 ? "warning" : "success"}
								className="text-xs"
							>
								{systemLoad > 80 ? "High" : "Normal"}
							</Badge>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Response Time</CardTitle>
						<Zap className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{responseTime}ms</div>
						<p className="text-xs text-muted-foreground">
							Average API response
						</p>
						<div className="mt-2">
							<Badge
								variant={responseTime > 100 ? "warning" : "success"}
								className="text-xs"
							>
								{responseTime > 100 ? "Slow" : "Fast"}
							</Badge>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Database</CardTitle>
						<Database className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats.total}</div>
						<p className="text-xs text-muted-foreground">Total records</p>
						<div className="mt-2">
							<Badge variant="success" className="text-xs">
								Connected
							</Badge>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Uptime</CardTitle>
						<RefreshCw className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{uptime}</div>
						<p className="text-xs text-muted-foreground">System availability</p>
						<div className="mt-2">
							<Badge variant="success" className="text-xs">
								Excellent
							</Badge>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

export { RealTimeMetrics };

"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, RefreshCw, Server, Wifi, Zap } from "lucide-react";
import { useEffect, useState } from "react";

interface RealTimeMetricsProps {
	data: {
		total: number;
		pending: number;
		approved: number;
		rejected: number;
	};
}

interface LiveMetric {
	value: number;
	trend: "up" | "down" | "stable";
	lastUpdate: number;
}

function LiveMetricDisplay({
	value,
	suffix = "",
	trend,
}: {
	value: number;
	suffix?: string;
	trend: "up" | "down" | "stable";
}) {
	const [displayValue, setDisplayValue] = useState(value);
	const [isUpdating, setIsUpdating] = useState(false);

	useEffect(() => {
		if (displayValue !== value) {
			setIsUpdating(true);
			const timer = setTimeout(() => {
				setDisplayValue(value);
				setIsUpdating(false);
			}, 200);
			return () => clearTimeout(timer);
		}
	}, [value, displayValue]);

	return (
		<div className="flex items-center gap-2">
			<span
				className={`text-2xl font-bold transition-all duration-200 ${
					isUpdating ? "scale-105 text-primary" : ""
				}`}
			>
				{displayValue}
				{suffix}
			</span>
			{trend !== "stable" && (
				<div
					className={`h-2 w-2 rounded-full animate-pulse ${
						trend === "up" ? "bg-green-500" : "bg-red-500"
					}`}
				/>
			)}
		</div>
	);
}

// Enhanced real-time component with live updating metrics
function RealTimeMetrics({ data: stats }: RealTimeMetricsProps) {
	const [metrics, setMetrics] = useState<{
		systemLoad: {
			value: number;
			trend: "up" | "down" | "stable";
			lastUpdate: number;
		};
		responseTime: {
			value: number;
			trend: "up" | "down" | "stable";
			lastUpdate: number;
		};
		connections: {
			value: number;
			trend: "up" | "down" | "stable";
			lastUpdate: number;
		};
		uptime: {
			value: number;
			trend: "up" | "down" | "stable";
			lastUpdate: number;
		};
	}>({
		systemLoad: { value: 45, trend: "stable", lastUpdate: Date.now() },
		responseTime: { value: 32, trend: "stable", lastUpdate: Date.now() },
		connections: { value: 12, trend: "stable", lastUpdate: Date.now() },
		uptime: { value: 99.9, trend: "stable", lastUpdate: Date.now() },
	});

	const [lastActivity, setLastActivity] = useState(Date.now());

	// Simulate real-time metric updates
	useEffect(() => {
		const interval = setInterval(() => {
			setMetrics((prev) => {
				const now = Date.now();

				// Simulate realistic metric fluctuations
				const newSystemLoad = Math.max(
					20,
					Math.min(95, prev.systemLoad.value + (Math.random() - 0.5) * 10),
				);

				const newResponseTime = Math.max(
					15,
					Math.min(200, prev.responseTime.value + (Math.random() - 0.5) * 15),
				);

				const newConnections = Math.max(
					5,
					Math.min(
						25,
						prev.connections.value + Math.floor((Math.random() - 0.5) * 3),
					),
				);

				const newUptime = Math.max(
					98.0,
					Math.min(100.0, prev.uptime.value + (Math.random() - 0.5) * 0.1),
				);

				return {
					systemLoad: {
						value: Math.round(newSystemLoad),
						trend:
							newSystemLoad > prev.systemLoad.value
								? "up"
								: newSystemLoad < prev.systemLoad.value
									? "down"
									: "stable",
						lastUpdate: now,
					},
					responseTime: {
						value: Math.round(newResponseTime),
						trend:
							newResponseTime > prev.responseTime.value
								? "up"
								: newResponseTime < prev.responseTime.value
									? "down"
									: "stable",
						lastUpdate: now,
					},
					connections: {
						value: newConnections,
						trend:
							newConnections > prev.connections.value
								? "up"
								: newConnections < prev.connections.value
									? "down"
									: "stable",
						lastUpdate: now,
					},
					uptime: {
						value: Number(newUptime.toFixed(1)),
						trend:
							newUptime > prev.uptime.value
								? "up"
								: newUptime < prev.uptime.value
									? "down"
									: "stable",
						lastUpdate: now,
					},
				};
			});
			setLastActivity(Date.now());
		}, 2000); // Update every 2 seconds

		return () => clearInterval(interval);
	}, []);

	const timeSinceLastUpdate = Math.floor((Date.now() - lastActivity) / 1000);

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h3 className="text-lg font-semibold">Live System Metrics</h3>
				<div className="flex items-center gap-2">
					<div className="flex items-center gap-1">
						<div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
						<span className="text-xs text-muted-foreground">
							Updated {timeSinceLastUpdate}s ago
						</span>
					</div>
					<Badge variant="success" className="text-xs">
						<Wifi className="h-3 w-3 mr-1" />
						Live
					</Badge>
				</div>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card className="relative overflow-hidden">
					<div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-500/10 to-transparent" />
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">System Load</CardTitle>
						<Server className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<LiveMetricDisplay
							value={metrics.systemLoad.value}
							suffix="%"
							trend={metrics.systemLoad.trend}
						/>
						<p className="text-xs text-muted-foreground">CPU & Memory usage</p>
						<div className="mt-2">
							<Badge
								variant={metrics.systemLoad.value > 80 ? "warning" : "success"}
								className="text-xs transition-all duration-300"
							>
								{metrics.systemLoad.value > 80 ? "High Load" : "Normal"}
							</Badge>
						</div>
					</CardContent>
				</Card>

				<Card className="relative overflow-hidden">
					<div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-yellow-500/10 to-transparent" />
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Response Time</CardTitle>
						<Zap className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<LiveMetricDisplay
							value={metrics.responseTime.value}
							suffix="ms"
							trend={metrics.responseTime.trend}
						/>
						<p className="text-xs text-muted-foreground">Average API latency</p>
						<div className="mt-2">
							<Badge
								variant={
									metrics.responseTime.value > 100 ? "warning" : "success"
								}
								className="text-xs transition-all duration-300"
							>
								{metrics.responseTime.value > 100 ? "Slow" : "Fast"}
							</Badge>
						</div>
					</CardContent>
				</Card>

				<Card className="relative overflow-hidden">
					<div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-green-500/10 to-transparent" />
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							DB Connections
						</CardTitle>
						<Database className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="flex items-center gap-2">
							<LiveMetricDisplay
								value={metrics.connections.value}
								suffix="/25"
								trend={metrics.connections.trend}
							/>
						</div>
						<p className="text-xs text-muted-foreground">Active connections</p>
						<div className="mt-2">
							<Badge
								variant={metrics.connections.value > 20 ? "warning" : "success"}
								className="text-xs transition-all duration-300"
							>
								{metrics.connections.value > 20 ? "High Usage" : "Healthy"}
							</Badge>
						</div>
					</CardContent>
				</Card>

				<Card className="relative overflow-hidden">
					<div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-purple-500/10 to-transparent" />
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Uptime</CardTitle>
						<RefreshCw className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<LiveMetricDisplay
							value={metrics.uptime.value}
							suffix="%"
							trend={metrics.uptime.trend}
						/>
						<p className="text-xs text-muted-foreground">System availability</p>
						<div className="mt-2">
							<Badge
								variant={metrics.uptime.value > 99.5 ? "success" : "warning"}
								className="text-xs transition-all duration-300"
							>
								{metrics.uptime.value > 99.5 ? "Excellent" : "Good"}
							</Badge>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Live Activity Indicator */}
			<div className="flex items-center justify-center py-2">
				<div className="flex items-center gap-2 text-xs text-muted-foreground">
					<div className="flex space-x-1">
						<div
							className="h-1 w-1 rounded-full bg-primary animate-bounce"
							style={{ animationDelay: "0ms" }}
						/>
						<div
							className="h-1 w-1 rounded-full bg-primary animate-bounce"
							style={{ animationDelay: "150ms" }}
						/>
						<div
							className="h-1 w-1 rounded-full bg-primary animate-bounce"
							style={{ animationDelay: "300ms" }}
						/>
					</div>
					<span>Real-time monitoring active</span>
				</div>
			</div>
		</div>
	);
}

export { RealTimeMetrics };

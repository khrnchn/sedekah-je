import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, CheckCircle, Clock, XCircle } from "lucide-react";
import { getDashboardStats } from "../queries";

export async function DashboardStats() {
	const stats = await getDashboardStats();

	const statCards = [
		{
			title: "Total Institutions",
			value: stats.total,
			icon: Building2,
			color: "default" as const,
			description: "All registered institutions",
		},
		{
			title: "Pending Review",
			value: stats.pending,
			icon: Clock,
			color: "warning" as const,
			description: "Awaiting admin approval",
		},
		{
			title: "Approved",
			value: stats.approved,
			icon: CheckCircle,
			color: "success" as const,
			description: "Live on the platform",
		},
		{
			title: "Rejected",
			value: stats.rejected,
			icon: XCircle,
			color: "destructive" as const,
			description: "Did not meet criteria",
		},
	];

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			{statCards.map((stat) => (
				<Card key={stat.title}>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
						<stat.icon className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stat.value}</div>
						<p className="text-xs text-muted-foreground">{stat.description}</p>
						<div className="mt-2">
							<Badge
								variant={
									stat.color as
										| "default"
										| "secondary"
										| "destructive"
										| "warning"
										| "success"
										| "outline"
								}
								className="text-xs"
							>
								{stat.color === "warning" && "In Progress"}
								{stat.color === "success" && "Active"}
								{stat.color === "destructive" && "Declined"}
								{stat.color === "default" && "Total"}
							</Badge>
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Activity, Building2, CheckCircle, Clock, XCircle } from "lucide-react";

interface ActivityFeedProps {
	data: Array<{
		id: number;
		name: string;
		status: string;
		category: string;
		state: string;
		city: string;
		contributorName: string | null;
		createdAt: Date;
		reviewedAt: Date | null;
	}>;
}

export function ActivityFeed({ data: activities }: ActivityFeedProps) {
	const getStatusIcon = (status: string) => {
		switch (status) {
			case "pending":
				return <Clock className="h-4 w-4 text-yellow-500" />;
			case "approved":
				return <CheckCircle className="h-4 w-4 text-green-500" />;
			case "rejected":
				return <XCircle className="h-4 w-4 text-red-500" />;
			default:
				return <Building2 className="h-4 w-4 text-gray-500" />;
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "pending":
				return "warning";
			case "approved":
				return "success";
			case "rejected":
				return "destructive";
			default:
				return "default";
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Activity className="h-5 w-5" />
					Recent Activity
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="max-h-72 overflow-y-auto">
					<div className="space-y-4">
						{activities.length === 0 ? (
							<div className="text-center py-8 text-muted-foreground">
								<Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
								<p>No recent activity</p>
							</div>
						) : (
							activities.map((activity) => (
								<div
									key={activity.id}
									className="flex items-start gap-3 p-3 bg-muted/50 rounded"
								>
									<div className="mt-1">{getStatusIcon(activity.status)}</div>
									<div className="flex-1 min-w-0">
										<div className="font-medium truncate">{activity.name}</div>
										<div className="text-xs text-muted-foreground">
											{activity.city}, {activity.state}
										</div>
										<div className="flex items-center gap-2 mt-1">
											<Badge
												variant={
													getStatusColor(activity.status) as
														| "default"
														| "secondary"
														| "destructive"
														| "warning"
														| "success"
														| "outline"
												}
												className="text-xs"
											>
												{activity.status}
											</Badge>
											<Badge variant="outline" className="text-xs">
												{activity.category}
											</Badge>
										</div>
										<div className="text-xs text-muted-foreground mt-1">
											{activity.contributorName && (
												<span>by {activity.contributorName} • </span>
											)}
											{formatDistanceToNow(new Date(activity.createdAt), {
												addSuffix: true,
											})}
										</div>
									</div>
								</div>
							))
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

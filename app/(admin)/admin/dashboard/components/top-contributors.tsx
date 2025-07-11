import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, User } from "lucide-react";

interface TopContributorsProps {
	data: Array<{
		contributorName: string | null;
		contributorEmail: string | null;
		submissionCount: number;
	}>;
}

export function TopContributors({ data: contributors }: TopContributorsProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Trophy className="h-5 w-5" />
					Top Contributors
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{contributors.length === 0 ? (
						<div className="text-center py-8 text-muted-foreground">
							<User className="h-12 w-12 mx-auto mb-4 opacity-50" />
							<p>No contributors yet</p>
						</div>
					) : (
						contributors.map((contributor, index) => (
							<div
								key={contributor.contributorEmail}
								className="flex items-center gap-3"
							>
								<div className="flex items-center gap-2">
									<Badge
										variant={index === 0 ? "default" : "secondary"}
										className="text-xs"
									>
										#{index + 1}
									</Badge>
									<Avatar className="h-8 w-8">
										<AvatarFallback className="text-xs">
											{contributor.contributorName
												?.split(" ")
												.map((n) => n[0])
												.join("")
												.toUpperCase()
												.slice(0, 2) || "??"}
										</AvatarFallback>
									</Avatar>
								</div>
								<div className="flex-1 min-w-0">
									<div className="font-medium truncate">
										{contributor.contributorName || "Anonymous"}
									</div>
									<div className="text-xs text-muted-foreground truncate">
										{contributor.contributorEmail}
									</div>
								</div>
								<div className="flex items-center gap-1">
									<span className="font-bold">
										{contributor.submissionCount}
									</span>
									<span className="text-xs text-muted-foreground">
										{contributor.submissionCount === 1
											? "submission"
											: "submissions"}
									</span>
								</div>
							</div>
						))
					)}
				</div>
			</CardContent>
		</Card>
	);
}

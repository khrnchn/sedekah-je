import { ProtectedRoute } from "@/components/auth/protected-route";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import PageSection from "@/components/ui/pageSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

import { getMyContributions } from "@/app/(user)/my-contributions/_lib/queries";

export default async function MyContributionsPage() {
	const data = await getMyContributions();

	const userStats = data?.stats ?? {
		totalContributions: 0,
		approvedContributions: 0,
		pendingContributions: 0,
		rejectedContributions: 0,
	};

	const contributions = data?.contributions ?? [];

	const formatDate = (date: string) => {
		try {
			return new Intl.DateTimeFormat("ms-MY", {
				day: "numeric",
				month: "short",
				year: "numeric",
			}).format(new Date(date));
		} catch {
			return date;
		}
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "approved":
				return <CheckCircle2 className="h-4 w-4 text-green-500" />;
			case "pending":
				return <Clock className="h-4 w-4 text-yellow-500" />;
			case "rejected":
				return <XCircle className="h-4 w-4 text-red-500" />;
			default:
				return null;
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "approved":
				return "bg-green-500/10 text-green-500";
			case "pending":
				return "bg-yellow-500/10 text-yellow-500";
			case "rejected":
				return "bg-red-500/10 text-red-500";
			default:
				return "";
		}
	};

	return (
		<ProtectedRoute>
			<PageSection>
				<div className="space-y-8">
					<div className="text-center">
						<h1 className="text-3xl font-bold tracking-tight">
							My Contributions
						</h1>
						<p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
							Track and manage your contributions to the sedekah.je community
						</p>
					</div>

					<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
						<Card>
							<CardContent className="p-3 md:p-4 text-center">
								<div className="text-xl md:text-2xl font-bold">
									{userStats.totalContributions}
								</div>
								<p className="text-xs md:text-sm text-muted-foreground">
									Total Contributions
								</p>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="p-3 md:p-4 text-center">
								<div className="text-xl md:text-2xl font-bold">
									{userStats.approvedContributions}
								</div>
								<p className="text-xs md:text-sm text-muted-foreground">
									Approved
								</p>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="p-3 md:p-4 text-center">
								<div className="text-xl md:text-2xl font-bold">
									{userStats.pendingContributions}
								</div>
								<p className="text-xs md:text-sm text-muted-foreground">
									Pending Review
								</p>
							</CardContent>
						</Card>
					</div>

					<Card>
						<CardHeader>
							<CardTitle>Contribution History</CardTitle>
							<CardDescription>
								Your recent contributions and their status
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Tabs defaultValue="all" className="w-full">
								<TabsList>
									<TabsTrigger value="all">All</TabsTrigger>
									<TabsTrigger value="approved">Approved</TabsTrigger>
									<TabsTrigger value="pending">Pending</TabsTrigger>
									<TabsTrigger value="rejected">Rejected</TabsTrigger>
								</TabsList>
								<TabsContent value="all" className="mt-4">
									<div className="space-y-4">
										{contributions.map((contribution) => (
											<div
												key={contribution.id}
												className="flex items-center gap-2 md:gap-4 p-2 md:p-3 rounded-lg bg-background hover:bg-muted/50"
											>
												<div className="flex items-center justify-center w-8">
													{getStatusIcon(contribution.status)}
												</div>
												<div className="flex-1 min-w-0">
													<div className="font-semibold text-sm md:text-base truncate">
														{contribution.name}
													</div>
													<div className="text-xs md:text-sm text-muted-foreground">
														{formatDate(contribution.date)}
													</div>
												</div>
												<div className="flex items-center gap-2">
													<Badge variant="secondary" className="text-xs">
														{contribution.type}
													</Badge>
													<Badge
														variant="secondary"
														className={cn(
															"text-xs",
															getStatusColor(contribution.status),
														)}
													>
														{contribution.status}
													</Badge>
												</div>
											</div>
										))}
									</div>
								</TabsContent>
								<TabsContent value="approved">
									<div className="space-y-4">
										{contributions
											.filter((c) => c.status === "approved")
											.map((contribution) => (
												<div
													key={contribution.id}
													className="flex items-center gap-2 md:gap-4 p-2 md:p-3 rounded-lg bg-background hover:bg-muted/50"
												>
													<div className="flex items-center justify-center w-8">
														{getStatusIcon(contribution.status)}
													</div>
													<div className="flex-1 min-w-0">
														<div className="font-semibold text-sm md:text-base truncate">
															{contribution.name}
														</div>
														<div className="text-xs md:text-sm text-muted-foreground">
															{formatDate(contribution.date)}
														</div>
													</div>
													<div className="flex items-center gap-2">
														<Badge variant="secondary" className="text-xs">
															{contribution.type}
														</Badge>
														<Badge
															variant="secondary"
															className={cn(
																"text-xs",
																getStatusColor(contribution.status),
															)}
														>
															{contribution.status}
														</Badge>
													</div>
												</div>
											))}
									</div>
								</TabsContent>
								<TabsContent value="pending">
									<div className="space-y-4">
										{contributions
											.filter((c) => c.status === "pending")
											.map((contribution) => (
												<div
													key={contribution.id}
													className="flex items-center gap-2 md:gap-4 p-2 md:p-3 rounded-lg bg-background hover:bg-muted/50"
												>
													<div className="flex items-center justify-center w-8">
														{getStatusIcon(contribution.status)}
													</div>
													<div className="flex-1 min-w-0">
														<div className="font-semibold text-sm md:text-base truncate">
															{contribution.name}
														</div>
														<div className="text-xs md:text-sm text-muted-foreground">
															{formatDate(contribution.date)}
														</div>
													</div>
													<div className="flex items-center gap-2">
														<Badge variant="secondary" className="text-xs">
															{contribution.type}
														</Badge>
														<Badge
															variant="secondary"
															className={cn(
																"text-xs",
																getStatusColor(contribution.status),
															)}
														>
															{contribution.status}
														</Badge>
													</div>
												</div>
											))}
									</div>
								</TabsContent>
								<TabsContent value="rejected">
									<div className="space-y-4">
										{contributions
											.filter((c) => c.status === "rejected")
											.map((contribution) => (
												<div
													key={contribution.id}
													className="flex items-center gap-2 md:gap-4 p-2 md:p-3 rounded-lg bg-background hover:bg-muted/50"
												>
													<div className="flex items-center justify-center w-8">
														{getStatusIcon(contribution.status)}
													</div>
													<div className="flex-1 min-w-0">
														<div className="font-semibold text-sm md:text-base truncate">
															{contribution.name}
														</div>
														<div className="text-xs md:text-sm text-muted-foreground">
															{formatDate(contribution.date)}
														</div>
													</div>
													<div className="flex items-center gap-2">
														<Badge variant="secondary" className="text-xs">
															{contribution.type}
														</Badge>
														<Badge
															variant="secondary"
															className={cn(
																"text-xs",
																getStatusColor(contribution.status),
															)}
														>
															{contribution.status}
														</Badge>
													</div>
												</div>
											))}
									</div>
								</TabsContent>
							</Tabs>
						</CardContent>
					</Card>
				</div>
			</PageSection>
		</ProtectedRoute>
	);
}

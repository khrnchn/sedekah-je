"use client";

import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { useMemo } from "react";

interface Contribution {
	id: string;
	name: string;
	date: string;
	status: string;
	type: string;
}

interface ContributionListProps {
	contributions: Contribution[];
}

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

function ContributionItem({ contribution }: { contribution: Contribution }) {
	return (
		<div className="flex items-center gap-2 md:gap-4 p-2 md:p-3 rounded-lg bg-background hover:bg-muted/50">
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
					className={cn("text-xs", getStatusColor(contribution.status))}
				>
					{contribution.status}
				</Badge>
			</div>
		</div>
	);
}

export function ContributionList({ contributions }: ContributionListProps) {
	// Memoize filtered contributions for performance
	const filteredContributions = useMemo(
		() => ({
			approved: contributions.filter((c) => c.status === "approved"),
			pending: contributions.filter((c) => c.status === "pending"),
			rejected: contributions.filter((c) => c.status === "rejected"),
		}),
		[contributions],
	);

	return (
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
								<ContributionItem
									key={contribution.id}
									contribution={contribution}
								/>
							))}
						</div>
					</TabsContent>
					<TabsContent value="approved">
						<div className="space-y-4">
							{filteredContributions.approved.map((contribution) => (
								<ContributionItem
									key={contribution.id}
									contribution={contribution}
								/>
							))}
						</div>
					</TabsContent>
					<TabsContent value="pending">
						<div className="space-y-4">
							{filteredContributions.pending.map((contribution) => (
								<ContributionItem
									key={contribution.id}
									contribution={contribution}
								/>
							))}
						</div>
					</TabsContent>
					<TabsContent value="rejected">
						<div className="space-y-4">
							{filteredContributions.rejected.map((contribution) => (
								<ContributionItem
									key={contribution.id}
									contribution={contribution}
								/>
							))}
						</div>
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
}

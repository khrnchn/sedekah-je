"use client";

import { CheckCircle2, Clock, Inbox, Pencil, XCircle } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/user-page-components";
import { cn } from "@/lib/utils";

interface Contribution {
	id: string;
	name: string;
	date: string;
	status: string;
	type: string;
	slug: string;
	adminNotes?: string | null;
}

interface ContributionListProps {
	contributions: Contribution[];
	onEditRejected?: (institutionId: string) => void;
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

const STATUS_LABELS: Record<string, string> = {
	approved: "Diluluskan",
	pending: "Menunggu",
	rejected: "Ditolak",
};

const TYPE_LABELS: Record<string, string> = {
	mosque: "Masjid",
	surau: "Surau",
	others: "Lain-lain",
};

function ContributionItem({
	contribution,
	onEditRejected,
}: {
	contribution: Contribution;
	onEditRejected?: (institutionId: string) => void;
}) {
	const isApproved = contribution.status === "approved";
	const content = (
		<>
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
				{contribution.status === "rejected" &&
					contribution.adminNotes?.trim() && (
						<p className="text-xs text-muted-foreground italic mt-0.5">
							Catatan: {contribution.adminNotes}
						</p>
					)}
			</div>
			<div className="flex items-center gap-2">
				{contribution.status === "rejected" && onEditRejected && (
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="h-8 w-8 shrink-0"
						onClick={() => onEditRejected(contribution.id)}
						aria-label="Edit sumbangan ditolak"
						data-tour="mycontrib-edit-rejected"
					>
						<Pencil className="h-4 w-4" />
					</Button>
				)}
				<Badge variant="secondary" className="text-xs">
					{TYPE_LABELS[contribution.type] ?? contribution.type}
				</Badge>
				<Badge
					variant="secondary"
					className={cn("text-xs", getStatusColor(contribution.status))}
				>
					{STATUS_LABELS[contribution.status] ?? contribution.status}
				</Badge>
			</div>
		</>
	);

	const wrapperClass =
		"flex items-center gap-2 md:gap-4 p-2 md:p-3 rounded-lg bg-background hover:bg-muted/50";

	if (isApproved && contribution.slug) {
		return (
			<Link
				href={`/${contribution.type}/${contribution.slug}`}
				className={wrapperClass}
			>
				{content}
			</Link>
		);
	}

	return <div className={wrapperClass}>{content}</div>;
}

export function ContributionList({
	contributions,
	onEditRejected,
}: ContributionListProps) {
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
				<CardTitle>Sejarah Sumbangan</CardTitle>
				<CardDescription>Sumbangan terkini anda dan statusnya</CardDescription>
			</CardHeader>
			<CardContent>
				<Tabs defaultValue="all" className="w-full">
					<TabsList data-tour="mycontrib-status-tabs">
						<TabsTrigger value="all">Semua</TabsTrigger>
						<TabsTrigger value="approved">Diluluskan</TabsTrigger>
						<TabsTrigger value="pending">Menunggu</TabsTrigger>
						<TabsTrigger value="rejected" data-tour="mycontrib-tab-rejected">
							Ditolak
						</TabsTrigger>
					</TabsList>
					<TabsContent value="all" className="mt-4">
						<div className="space-y-4">
							{contributions.length === 0 ? (
								<EmptyState
									icon={Inbox}
									title="Tiada sumbangan"
									description="Anda belum menyumbang sebarang institusi. Mulakan dengan menyumbang masjid atau surau terdekat."
								/>
							) : (
								contributions.map((contribution) => (
									<ContributionItem
										key={contribution.id}
										contribution={contribution}
										onEditRejected={onEditRejected}
									/>
								))
							)}
						</div>
					</TabsContent>
					<TabsContent value="approved" className="mt-4">
						<div className="space-y-4">
							{filteredContributions.approved.length === 0 ? (
								<EmptyState
									icon={CheckCircle2}
									title="Tiada sumbangan diluluskan"
									description="Sumbangan yang diluluskan akan muncul di sini. Teruskan menyumbang!"
								/>
							) : (
								filteredContributions.approved.map((contribution) => (
									<ContributionItem
										key={contribution.id}
										contribution={contribution}
										onEditRejected={onEditRejected}
									/>
								))
							)}
						</div>
					</TabsContent>
					<TabsContent value="pending" className="mt-4">
						<div className="space-y-4">
							{filteredContributions.pending.length === 0 ? (
								<EmptyState
									icon={Clock}
									title="Tiada sumbangan menunggu"
									description="Sumbangan yang sedang menunggu semakan admin akan muncul di sini."
								/>
							) : (
								filteredContributions.pending.map((contribution) => (
									<ContributionItem
										key={contribution.id}
										contribution={contribution}
										onEditRejected={onEditRejected}
									/>
								))
							)}
						</div>
					</TabsContent>
					<TabsContent value="rejected" className="mt-4">
						<div className="space-y-4">
							{filteredContributions.rejected.length === 0 ? (
								<EmptyState
									icon={XCircle}
									title="Tiada sumbangan ditolak"
									description="Sumbangan yang ditolak akan muncul di sini. Anda boleh edit dan hantar semula."
								/>
							) : (
								filteredContributions.rejected.map((contribution) => (
									<ContributionItem
										key={contribution.id}
										contribution={contribution}
										onEditRejected={onEditRejected}
									/>
								))
							)}
						</div>
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
}

"use client";

import {
	CheckCircle2,
	ChevronRight,
	Clock,
	Inbox,
	Pencil,
	XCircle,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { EmptyState } from "@/components/layout/user-page-components";
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
import { formatDateOnly } from "@/lib/date-utils";
import { getInstitutionCategoryLabel } from "@/lib/institution-categories";
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

const getStatusIcon = (status: string) => {
	switch (status) {
		case "approved":
			return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
		case "pending":
			return <Clock className="h-4 w-4 text-amber-600" />;
		case "rejected":
			return <XCircle className="h-4 w-4 text-red-600" />;
		default:
			return null;
	}
};

const getStatusColor = (status: string) => {
	switch (status) {
		case "approved":
			return "bg-emerald-600/10 text-emerald-700 dark:text-emerald-300";
		case "pending":
			return "bg-amber-500/15 text-amber-800 dark:text-amber-300";
		case "rejected":
			return "bg-red-600/10 text-red-700 dark:text-red-300";
		default:
			return "";
	}
};

const STATUS_LABELS: Record<string, string> = {
	approved: "Diluluskan",
	pending: "Pending",
	rejected: "Ditolak",
};

const STATUS_TABS = [
	{ value: "approved", label: "Diluluskan" },
	{ value: "pending", label: "Pending" },
	{ value: "rejected", label: "Ditolak" },
] as const;

function ContributionItem({
	contribution,
	onEditRejected,
}: {
	contribution: Contribution;
	onEditRejected?: (institutionId: string) => void;
}) {
	const isApproved = contribution.status === "approved";
	const isRejected = contribution.status === "rejected";
	const categoryLabel = getInstitutionCategoryLabel(contribution.type);
	const statusLabel = STATUS_LABELS[contribution.status] ?? contribution.status;
	const content = (
		<>
			<div className="flex items-start gap-3 md:flex-1">
				<div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
					{getStatusIcon(contribution.status)}
				</div>
				<div className="min-w-0 flex-1">
					<div className="flex items-start justify-between gap-2">
						<div className="min-w-0">
							<div className="break-words text-sm font-semibold leading-snug md:text-base">
								{contribution.name}
							</div>
							<div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground md:text-sm">
								<span>{formatDateOnly(contribution.date)}</span>
								<span className="md:hidden" aria-hidden="true">
									·
								</span>
								<span className="md:hidden">{categoryLabel}</span>
							</div>
						</div>
						<Badge
							variant="secondary"
							className={cn(
								"shrink-0 text-xs",
								getStatusColor(contribution.status),
							)}
						>
							{statusLabel}
						</Badge>
					</div>
					{isRejected && contribution.adminNotes?.trim() && (
						<p className="mt-2 break-words rounded-md bg-muted/60 px-2 py-1.5 text-xs text-muted-foreground">
							Catatan: {contribution.adminNotes}
						</p>
					)}
				</div>
			</div>
			<div className="mt-3 flex min-h-9 items-center justify-between gap-2 md:mt-0 md:min-h-0 md:shrink-0">
				<div className="hidden items-center gap-2 md:flex">
					<Badge variant="secondary" className="text-xs">
						{categoryLabel}
					</Badge>
				</div>
				{isApproved && (
					<span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-primary md:text-sm">
						Lihat QR
						<ChevronRight className="size-4" aria-hidden="true" />
					</span>
				)}
				{isRejected && onEditRejected && (
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="ml-auto h-9 shrink-0 gap-1.5 px-3"
						onClick={() => onEditRejected(contribution.id)}
						data-tour="mycontrib-edit-rejected"
					>
						<Pencil className="h-4 w-4" />
						Edit semula
					</Button>
				)}
			</div>
		</>
	);

	const clickableWrapper =
		"group block rounded-lg border border-border/70 bg-background p-3 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:flex md:items-start md:gap-4 md:border-0 md:px-3";
	const nonClickableWrapper =
		"block rounded-lg border border-border/70 bg-background p-3 md:flex md:items-start md:gap-4 md:border-0 md:px-3";

	if (isApproved && contribution.slug) {
		return (
			<Link
				href={`/${contribution.type}/${contribution.slug}`}
				className={clickableWrapper}
			>
				{content}
			</Link>
		);
	}

	return (
		<div className={cn(nonClickableWrapper, !isRejected && "opacity-90")}>
			{content}
		</div>
	);
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
	const statusCounts = {
		approved: filteredContributions.approved.length,
		pending: filteredContributions.pending.length,
		rejected: filteredContributions.rejected.length,
	};
	const defaultTab =
		filteredContributions.pending.length > 0
			? "pending"
			: filteredContributions.rejected.length > 0
				? "rejected"
				: "approved";

	return (
		<Card className="overflow-hidden">
			<CardHeader className="px-4 py-4 md:px-6">
				<CardTitle>Sejarah Submission</CardTitle>
				<CardDescription>Submission terkini anda dan statusnya</CardDescription>
			</CardHeader>
			<CardContent className="px-3 pb-4 md:px-6">
				{contributions.length === 0 ? (
					<div className="px-1">
						<EmptyState
							icon={Inbox}
							title="Belum ada submission"
							description="Submission QR yang anda hantar akan dipaparkan di sini selepas ia masuk ke semakan komuniti."
						/>
						<div className="-mt-6 flex justify-center pb-4">
							<Button asChild size="sm">
								<Link href="/contribute">Hantar submission</Link>
							</Button>
						</div>
					</div>
				) : (
					<Tabs defaultValue={defaultTab} className="w-full">
						<div className="w-full overflow-x-auto -mx-1 px-1">
							<TabsList
								data-tour="mycontrib-status-tabs"
								className="h-10 w-max min-w-full"
							>
								{STATUS_TABS.map((tab) => (
									<TabsTrigger
										key={tab.value}
										value={tab.value}
										data-tour={
											tab.value === "rejected"
												? "mycontrib-tab-rejected"
												: undefined
										}
										className="group gap-1.5"
									>
										{tab.label}
										<span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] leading-none text-muted-foreground group-data-[state=active]:bg-background">
											{statusCounts[tab.value]}
										</span>
									</TabsTrigger>
								))}
							</TabsList>
						</div>
						<TabsContent value="approved" className="mt-4">
							<div className="space-y-4">
								{filteredContributions.approved.length === 0 ? (
									<EmptyState
										icon={CheckCircle2}
										title="Tiada submission diluluskan lagi"
										description="Submission yang lulus semakan akan muncul di sini."
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
										title="Tiada submission pending"
										description="Submission yang sedang menunggu semakan akan muncul di sini."
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
										title="Tiada submission ditolak"
										description="Submission yang ditolak akan muncul di sini. Anda boleh edit dan hantar semula."
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
				)}
			</CardContent>
		</Card>
	);
}

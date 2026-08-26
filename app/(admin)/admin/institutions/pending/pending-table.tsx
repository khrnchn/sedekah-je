"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ReusableDataTable } from "@/components/reusable-data-table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { categories, states } from "@/lib/institution-constants";
import {
	batchApproveInstitutions,
	batchRejectInstitutions,
} from "../_lib/batch-actions";
import {
	INCLUDE_AUTOMATED_QUERY,
	shouldIncludeAutomated,
} from "../_lib/pending-review-scope";
import { columns } from "./columns";
import type { PendingInstitutionRow } from "./pending-row";

const ALL = "all" as const;

const CATEGORY_QUERY = "category";
const STATE_QUERY = "state";
const READINESS_QUERY = "readiness";

const READINESS_VALUES = ["ready", "blocked"] as const;
type ReadinessFilter = (typeof READINESS_VALUES)[number] | typeof ALL;

function readParam<T extends string>(
	value: string | null,
	allowed: readonly T[],
): T | typeof ALL {
	return value && (allowed as readonly string[]).includes(value)
		? (value as T)
		: ALL;
}

type ActionDialogProps = {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: (notes: string) => void;
	title: string;
	description: string;
	actionLabel: string;
	actionStyle?: "success" | "destructive";
};

function ActionDialog({
	isOpen,
	onClose,
	onConfirm,
	title,
	description,
	actionLabel,
	actionStyle = "success",
}: ActionDialogProps) {
	const [notes, setNotes] = useState("");

	// Both dialogs stay mounted, so clear stale text instead of carrying it
	// into the next decision.
	useEffect(() => {
		if (isOpen) setNotes("");
	}, [isOpen]);

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				<div className="py-4">
					<Textarea
						placeholder="Enter any notes or comments about this decision..."
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
						className="min-h-[100px]"
					/>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={onClose}>
						Cancel
					</Button>
					<Button
						variant={actionStyle === "destructive" ? "destructive" : "default"}
						onClick={() => onConfirm(notes)}
					>
						{actionLabel}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export default function PendingInstitutionsTable({
	initialData,
}: {
	initialData: PendingInstitutionRow[];
}) {
	const [institutions, setInstitutions] = useState(initialData);
	const [selectedIds, setSelectedIds] = useState<number[]>([]);
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const hideAutomated = !shouldIncludeAutomated(
		searchParams.get(INCLUDE_AUTOMATED_QUERY) ?? undefined,
	);
	// Filters live in the URL so they survive the router.refresh() that every
	// bulk decision triggers, and so a filtered queue can be shared as a link.
	const category = readParam(searchParams.get(CATEGORY_QUERY), categories);
	const state = readParam(searchParams.get(STATE_QUERY), states);
	const readiness = readParam(
		searchParams.get(READINESS_QUERY),
		READINESS_VALUES,
	);
	const [actionDialog, setActionDialog] = useState<{
		isOpen: boolean;
		type: "approve" | "reject" | null;
	}>({
		isOpen: false,
		type: null,
	});

	const { toast } = useToast();
	const router = useRouter();

	// Refresh data on client navigation if needed
	useEffect(() => {
		setInstitutions(initialData);
	}, [initialData]);

	const automatedCount = institutions.filter(
		(inst) => inst.sourceUrl && !inst.sourceUrl.startsWith("http"),
	).length;

	const filteredData = institutions.filter((inst) => {
		if (category !== ALL && inst.category !== category) return false;
		if (state !== ALL && inst.state !== state) return false;
		if (readiness === "ready" && inst.blockers.length > 0) return false;
		if (readiness === "blocked" && inst.blockers.length === 0) return false;
		if (hideAutomated && inst.sourceUrl && !inst.sourceUrl.startsWith("http")) {
			return false;
		}
		return true;
	});

	const setParam = (key: string, value: string | null) => {
		const params = new URLSearchParams(searchParams.toString());
		if (value === null) {
			params.delete(key);
		} else {
			params.set(key, value);
		}
		const query = params.toString();
		router.replace(query ? `${pathname}?${query}` : pathname, {
			scroll: false,
		});
		setSelectedIds([]);
	};

	const setAutomatedVisibility = (hide: boolean) => {
		setParam(INCLUDE_AUTOMATED_QUERY, hide ? null : "true");
	};

	const doBulk = async (action: "approve" | "reject", notes: string) => {
		try {
			if (selectedIds.length > 100) {
				toast({
					title: "Selection too large",
					description:
						"Please select fewer than 100 institutions for batch operations",
					variant: "destructive",
				});
				return;
			}

			if (action === "approve") {
				await batchApproveInstitutions(selectedIds, notes);
			} else {
				await batchRejectInstitutions(selectedIds, notes);
			}
			toast({
				title: `Institutions ${action === "approve" ? "approved" : "rejected"}`,
				description: `Successfully processed ${selectedIds.length} institutions`,
			});
			router.refresh();
		} catch (error) {
			console.error("Batch operation error:", error);
			const errorMessage =
				error instanceof Error
					? error.message
					: `Failed to ${action} institutions`;
			toast({
				title: "Batch operation failed",
				description: errorMessage,
				variant: "destructive",
			});
		}
		setActionDialog({ isOpen: false, type: null });
		setSelectedIds([]);
	};

	const filterControls = (
		<>
			<Select
				value={readiness}
				onValueChange={(value: ReadinessFilter) =>
					setParam(READINESS_QUERY, value === ALL ? null : value)
				}
			>
				<SelectTrigger className="w-[180px]">
					<SelectValue placeholder="Filter by readiness" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value={ALL}>Any readiness</SelectItem>
					<SelectItem value="ready">Ready to approve</SelectItem>
					<SelectItem value="blocked">Needs attention</SelectItem>
				</SelectContent>
			</Select>

			<Select
				value={category}
				onValueChange={(value) =>
					setParam(CATEGORY_QUERY, value === ALL ? null : value)
				}
			>
				<SelectTrigger className="w-[180px]">
					<SelectValue placeholder="Filter by category" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value={ALL}>All categories</SelectItem>
					{categories.map((cat) => (
						<SelectItem key={cat} value={cat} className="capitalize">
							{cat}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<Select
				value={state}
				onValueChange={(value) =>
					setParam(STATE_QUERY, value === ALL ? null : value)
				}
			>
				<SelectTrigger className="w-[180px]">
					<SelectValue placeholder="Filter by state" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value={ALL}>All states</SelectItem>
					{states.map((st) => (
						<SelectItem key={st} value={st}>
							{st}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			{automatedCount > 0 && (
				<div className="flex items-center gap-2">
					<Checkbox
						id="hide-automated"
						checked={hideAutomated}
						onCheckedChange={(value) => setAutomatedVisibility(!!value)}
					/>
					<Label htmlFor="hide-automated" className="whitespace-nowrap">
						Hide automated imports ({automatedCount})
					</Label>
				</div>
			)}
		</>
	);

	const bulkButtons = (
		<>
			<Button
				variant="outline"
				size="sm"
				disabled={selectedIds.length === 0}
				onClick={() => setActionDialog({ isOpen: true, type: "approve" })}
			>
				Approve Selected ({selectedIds.length})
			</Button>
			<Button
				variant="outline"
				size="sm"
				disabled={selectedIds.length === 0}
				onClick={() => setActionDialog({ isOpen: true, type: "reject" })}
			>
				Reject Selected ({selectedIds.length})
			</Button>
		</>
	);

	return (
		<>
			{/* Sorted newest first to match the canonical prev/next order in _lib/navigation.ts */}
			<ReusableDataTable
				columns={columns}
				data={filteredData}
				searchKey="name"
				searchPlaceholder="Search institutions..."
				emptyStateMessage="All caught up! No pending institutions."
				enableRowSelection
				onSelectionChange={(rows: PendingInstitutionRow[]) =>
					setSelectedIds(rows.map((r) => r.id))
				}
				leftToolbarContent={filterControls}
				rightToolbarContent={bulkButtons}
				initialSorting={[{ id: "createdAt", desc: true }]}
			/>

			{/* Dialogs */}
			<ActionDialog
				isOpen={actionDialog.isOpen && actionDialog.type === "approve"}
				onClose={() => setActionDialog({ isOpen: false, type: null })}
				onConfirm={(notes) => doBulk("approve", notes)}
				title="Approve Institutions"
				description={`Are you sure you want to approve ${selectedIds.length} institutions? Add any notes about your decision below.`}
				actionLabel="Approve All"
				actionStyle="success"
			/>
			<ActionDialog
				isOpen={actionDialog.isOpen && actionDialog.type === "reject"}
				onClose={() => setActionDialog({ isOpen: false, type: null })}
				onConfirm={(notes) => doBulk("reject", notes)}
				title="Reject Institutions"
				description={`Are you sure you want to reject ${selectedIds.length} institutions? Add any notes about your decision below.`}
				actionLabel="Reject All"
				actionStyle="destructive"
			/>
		</>
	);
}

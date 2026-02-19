"use client";

import { ReusableDataTable } from "@/components/reusable-data-table";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { categories, states } from "@/lib/institution-constants";
import { Undo2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { batchUndoApproval } from "../_lib/queries";
import { createColumns } from "./columns";

export type ApprovedInstitution = {
	id: number;
	name: string;
	category: (typeof categories)[number];
	state: (typeof states)[number];
	city: string;
	contributorName: string | null;
	contributorId: string | null;
	createdAt: Date;
	reviewedAt: Date | null;
	reviewedBy: string | null;
};

const ALL = "all" as const;

type CategoryFilter = (typeof categories)[number] | typeof ALL;
type StateFilter = (typeof states)[number] | typeof ALL;
type ContributorFilter = string | typeof ALL;

type User = {
	id: string;
	name: string | null;
	email: string;
	username: string | null;
};

export default function ApprovedInstitutionsTable({
	initialData,
	users,
}: {
	initialData: ApprovedInstitution[];
	users: User[];
}) {
	const [institutions, setInstitutions] = useState(initialData);
	const [selectedIds, setSelectedIds] = useState<number[]>([]);
	const [category, setCategory] = useState<CategoryFilter>(ALL);
	const [state, setState] = useState<StateFilter>(ALL);
	const [contributor, setContributor] = useState<ContributorFilter>(ALL);
	const [undoDialogOpen, setUndoDialogOpen] = useState(false);
	const [undoNotes, setUndoNotes] = useState("Duplicate entry");
	const router = useRouter();

	useEffect(() => {
		setInstitutions(initialData);
	}, [initialData]);

	const columns = createColumns(users);

	const filteredData = institutions.filter((inst) => {
		if (category !== ALL && inst.category !== category) return false;
		if (state !== ALL && inst.state !== state) return false;
		if (contributor !== ALL && inst.contributorId !== contributor) return false;
		return true;
	});

	// Get unique contributors for the filter
	const contributorMap = new Map<string, string>();
	for (const inst of institutions) {
		if (inst.contributorId && inst.contributorName) {
			contributorMap.set(inst.contributorId, inst.contributorName);
		}
	}

	const uniqueContributors = Array.from(contributorMap.entries())
		.map(([id, name]) => ({ id, name }))
		.sort((a, b) => a.name.localeCompare(b.name));

	async function handleBatchUndo(notes: string) {
		try {
			if (selectedIds.length > 100) {
				toast.error(
					"Please select fewer than 100 institutions for batch operations",
				);
				return;
			}

			await batchUndoApproval(selectedIds, notes);
			toast.success(
				`Successfully undone approval for ${selectedIds.length} institutions`,
			);
			router.refresh();
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Failed to undo approval";
			toast.error(errorMessage);
		}
		setUndoDialogOpen(false);
		setSelectedIds([]);
	}

	const filterControls = (
		<>
			<Select
				value={category}
				onValueChange={(value: CategoryFilter) => setCategory(value)}
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
				onValueChange={(value: StateFilter) => setState(value)}
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

			<Select
				value={contributor}
				onValueChange={(value: ContributorFilter) => setContributor(value)}
			>
				<SelectTrigger className="w-[180px]">
					<SelectValue placeholder="Filter by contributor" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value={ALL}>All contributors</SelectItem>
					{uniqueContributors.map((cont) => (
						<SelectItem key={cont.id} value={cont.id}>
							{cont.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</>
	);

	const bulkButtons = (
		<Button
			variant="outline"
			size="sm"
			disabled={selectedIds.length === 0}
			onClick={() => setUndoDialogOpen(true)}
			className="gap-2 text-destructive hover:text-destructive"
		>
			<Undo2Icon className="h-4 w-4" />
			Undo Selected ({selectedIds.length})
		</Button>
	);

	return (
		<>
			<ReusableDataTable
				columns={columns}
				data={filteredData}
				searchKey="name"
				searchPlaceholder="Search institutions..."
				emptyStateMessage="No approved institutions found."
				enableRowSelection
				onSelectionChange={(rows: ApprovedInstitution[]) =>
					setSelectedIds(rows.map((r) => r.id))
				}
				leftToolbarContent={filterControls}
				rightToolbarContent={bulkButtons}
			/>

			{/* Batch Undo Dialog */}
			<Dialog open={undoDialogOpen} onOpenChange={setUndoDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Undo Approval</DialogTitle>
						<DialogDescription>
							Are you sure you want to undo approval for {selectedIds.length}{" "}
							institutions? They will be rejected and removed from the public
							directory. This is typically used for duplicate entries.
						</DialogDescription>
					</DialogHeader>
					<div className="py-4">
						<Textarea
							value={undoNotes}
							onChange={(e) => setUndoNotes(e.target.value)}
							placeholder="Reason for undoing approval (e.g. duplicate entries)"
							className="min-h-[100px]"
						/>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setUndoDialogOpen(false)}>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={() => handleBatchUndo(undoNotes)}
						>
							Undo Approval ({selectedIds.length})
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

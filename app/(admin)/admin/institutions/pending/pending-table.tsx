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
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { categories, states } from "@/lib/institution-constants";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
	batchApproveInstitutions,
	batchRejectInstitutions,
} from "../_lib/queries";
import { columns } from "./columns";

export type PendingInstitution = {
	id: number;
	name: string;
	category: (typeof categories)[number];
	state: (typeof states)[number];
	city: string;
	contributorName: string | null;
	contributorId: string | null;
	createdAt: Date;
};

const ALL = "all" as const;

type CategoryFilter = (typeof categories)[number] | typeof ALL;
type StateFilter = (typeof states)[number] | typeof ALL;

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
	initialData: PendingInstitution[];
}) {
	const [institutions, setInstitutions] = useState(initialData);
	const [selectedIds, setSelectedIds] = useState<number[]>([]);
	const [category, setCategory] = useState<CategoryFilter>(ALL);
	const [state, setState] = useState<StateFilter>(ALL);
	const [actionDialog, setActionDialog] = useState<{
		isOpen: boolean;
		type: "approve" | "reject" | null;
	}>({
		isOpen: false,
		type: null,
	});

	const { toast } = useToast();
	const { user } = useAuth();
	const router = useRouter();

	// Refresh data on client navigation if needed
	useEffect(() => {
		setInstitutions(initialData);
	}, [initialData]);

	const filteredData = institutions.filter((inst) => {
		if (category !== ALL && inst.category !== category) return false;
		if (state !== ALL && inst.state !== state) return false;
		return true;
	});

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
			<ReusableDataTable
				columns={columns}
				data={filteredData}
				searchKey="name"
				searchPlaceholder="Search institutions..."
				emptyStateMessage="All caught up! No pending institutions."
				enableRowSelection
				onSelectionChange={(rows: PendingInstitution[]) =>
					setSelectedIds(rows.map((r) => r.id))
				}
				leftToolbarContent={filterControls}
				rightToolbarContent={bulkButtons}
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

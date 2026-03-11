"use client";

import type { Updater } from "@tanstack/react-table";
import { Undo2Icon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	useTransition,
} from "react";
import { toast } from "sonner";
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
import { REJECTION_TEMPLATES } from "@/lib/admin-templates";
import { categories, states } from "@/lib/institution-constants";
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
	reviewerName: string | null;
};

const ALL = "all" as const;

type CategoryFilter = (typeof categories)[number] | typeof ALL;
type StateFilter = (typeof states)[number] | typeof ALL;
type User = {
	id: string;
	name: string | null;
	email: string;
	username: string | null;
};

type PaginatedData = {
	institutions: ApprovedInstitution[];
	total: number;
	limit: number;
	offset: number;
};

export default function ApprovedInstitutionsTable({
	data,
	users,
}: {
	data: PaginatedData;
	users: User[];
}) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [isPending, startTransition] = useTransition();

	const rawPage = Number.parseInt(searchParams.get("page") ?? "", 10);
	const rawLimit = Number.parseInt(searchParams.get("limit") ?? "", 10);
	const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
	const limit = Number.isFinite(rawLimit)
		? Math.min(100, Math.max(1, rawLimit))
		: 10;
	const q = searchParams.get("q") ?? "";
	const categoryParam = searchParams.get("category") ?? ALL;
	const stateParam = searchParams.get("state") ?? ALL;

	const [selectedIds, setSelectedIds] = useState<number[]>([]);
	const [draft, setDraft] = useState(q);
	const [undoDialogOpen, setUndoDialogOpen] = useState(false);
	const [undoNotes, setUndoNotes] = useState("Duplicate entry");
	const debounceRef = useRef<NodeJS.Timeout | null>(null);
	const searchParamsRef = useRef(searchParams);
	searchParamsRef.current = searchParams;

	useEffect(() => {
		setDraft(q);
	}, [q]);

	useEffect(() => {
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, []);

	const pagination = useMemo(
		() => ({
			pageIndex: page - 1,
			pageSize: limit,
		}),
		[page, limit],
	);

	const pageCount = Math.ceil(data.total / pagination.pageSize);

	const clearPendingSearch = useCallback(() => {
		if (debounceRef.current) {
			clearTimeout(debounceRef.current);
			debounceRef.current = null;
		}
	}, []);

	const handlePaginationChange = useCallback(
		(updater: Updater<{ pageIndex: number; pageSize: number }>) => {
			clearPendingSearch();
			const newPagination =
				typeof updater === "function" ? updater(pagination) : updater;
			const params = new URLSearchParams(searchParams.toString());
			params.set("page", String(newPagination.pageIndex + 1));
			params.set("limit", String(newPagination.pageSize));
			startTransition(() => {
				router.push(`${pathname}?${params.toString()}`);
			});
			setSelectedIds([]);
		},
		[clearPendingSearch, pagination, router, pathname, searchParams],
	);

	const handleSearchChange = useCallback(
		(value: string) => {
			setDraft(value);
			if (debounceRef.current) clearTimeout(debounceRef.current);
			debounceRef.current = setTimeout(() => {
				debounceRef.current = null;
				const params = new URLSearchParams(searchParamsRef.current.toString());
				if (value.trim()) {
					params.set("q", value.trim());
				} else {
					params.delete("q");
				}
				params.set("page", "1");
				startTransition(() => {
					router.push(`${pathname}?${params.toString()}`);
				});
				setSelectedIds([]);
			}, 300);
		},
		[router, pathname],
	);

	const handleCategoryChange = useCallback(
		(value: CategoryFilter) => {
			clearPendingSearch();
			const params = new URLSearchParams(searchParams.toString());
			if (value === ALL) {
				params.delete("category");
			} else {
				params.set("category", value);
			}
			params.set("page", "1");
			startTransition(() => {
				router.push(`${pathname}?${params.toString()}`);
			});
			setSelectedIds([]);
		},
		[clearPendingSearch, router, pathname, searchParams],
	);

	const handleStateChange = useCallback(
		(value: StateFilter) => {
			clearPendingSearch();
			const params = new URLSearchParams(searchParams.toString());
			if (value === ALL) {
				params.delete("state");
			} else {
				params.set("state", value);
			}
			params.set("page", "1");
			startTransition(() => {
				router.push(`${pathname}?${params.toString()}`);
			});
			setSelectedIds([]);
		},
		[clearPendingSearch, router, pathname, searchParams],
	);

	const columns = createColumns(users);

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
				value={categoryParam}
				onValueChange={(value: CategoryFilter) => handleCategoryChange(value)}
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
				value={stateParam}
				onValueChange={(value: StateFilter) => handleStateChange(value)}
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
			<div
				className={
					isPending ? "opacity-50 pointer-events-none transition-opacity" : ""
				}
			>
				<ReusableDataTable
					columns={columns}
					data={data.institutions}
					searchKey="name"
					searchPlaceholder="Search institutions..."
					searchValue={draft}
					onSearchChange={handleSearchChange}
					emptyStateMessage="No approved institutions found."
					enableRowSelection
					onSelectionChange={(rows: ApprovedInstitution[]) =>
						setSelectedIds(rows.map((r) => r.id))
					}
					pageCount={pageCount}
					pagination={pagination}
					onPaginationChange={handlePaginationChange}
					leftToolbarContent={filterControls}
					rightToolbarContent={bulkButtons}
				/>
			</div>

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
					<div className="py-4 space-y-3">
						<div className="flex flex-wrap gap-2">
							{REJECTION_TEMPLATES.map((template) => (
								<Button
									key={template.label}
									type="button"
									variant="outline"
									size="sm"
									onClick={() => setUndoNotes(template.value)}
								>
									{template.label}
								</Button>
							))}
						</div>
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

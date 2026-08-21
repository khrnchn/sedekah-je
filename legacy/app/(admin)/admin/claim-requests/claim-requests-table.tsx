"use client";

import type { Updater } from "@tanstack/react-table";
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
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CLAIM_REJECTION_TEMPLATES } from "@/lib/admin-templates";
import {
	approveClaimRequest,
	rejectClaimRequest,
} from "@/lib/features/claim-institution/admin-actions";
import { type ClaimRequestRow, createColumns } from "./columns";

const ALL = "all" as const;
const STATUS_OPTIONS = [
	{ value: ALL, label: "Semua" },
	{ value: "pending", label: "Pending" },
	{ value: "approved", label: "Diluluskan" },
	{ value: "rejected", label: "Ditolak" },
] as const;

type StatusFilter = (typeof STATUS_OPTIONS)[number]["value"];

type PaginatedData = {
	claimRequests: ClaimRequestRow[];
	total: number;
	limit: number;
	offset: number;
};

export function ClaimRequestsTable({ data }: { data: PaginatedData }) {
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
	const statusParam = (searchParams.get("status") ?? ALL) as StatusFilter;

	const [selectedClaim, setSelectedClaim] = useState<ClaimRequestRow | null>(
		null,
	);
	const [actionType, setActionType] = useState<"approve" | "reject" | null>(
		null,
	);
	const [adminNotes, setAdminNotes] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [draft, setDraft] = useState(q);
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
			}, 300);
		},
		[router, pathname],
	);

	const handleStatusChange = useCallback(
		(value: StatusFilter) => {
			clearPendingSearch();
			const params = new URLSearchParams(searchParams.toString());
			if (value === ALL) {
				params.delete("status");
			} else {
				params.set("status", value);
			}
			params.set("page", "1");
			startTransition(() => {
				router.push(`${pathname}?${params.toString()}`);
			});
		},
		[clearPendingSearch, router, pathname, searchParams],
	);

	const openDialog = useCallback(
		(claim: ClaimRequestRow, type: "approve" | "reject") => {
			setSelectedClaim(claim);
			setActionType(type);
			setAdminNotes("");
		},
		[],
	);

	const closeDialog = useCallback(() => {
		setSelectedClaim(null);
		setActionType(null);
		setAdminNotes("");
	}, []);

	const handleAction = useCallback(async () => {
		if (!selectedClaim || !actionType) return;

		setIsSubmitting(true);
		try {
			const formData = new FormData();
			formData.append("claimId", selectedClaim.id.toString());
			formData.append("adminNotes", adminNotes);

			const result =
				actionType === "approve"
					? await approveClaimRequest(formData)
					: await rejectClaimRequest(formData);

			if (result.success) {
				toast.success(result.message);
				closeDialog();
				router.refresh();
			} else {
				toast.error(result.error);
			}
		} catch (error) {
			console.error("Error processing claim:", error);
			toast.error("Gagal memproses tuntutan");
		} finally {
			setIsSubmitting(false);
		}
	}, [selectedClaim, actionType, adminNotes, closeDialog, router]);

	const columns = useMemo(() => createColumns(openDialog), [openDialog]);

	const statusFilter = (
		<Select
			value={statusParam}
			onValueChange={(value: StatusFilter) => handleStatusChange(value)}
		>
			<SelectTrigger className="w-[180px]">
				<SelectValue placeholder="Filter by status" />
			</SelectTrigger>
			<SelectContent>
				{STATUS_OPTIONS.map((opt) => (
					<SelectItem key={opt.value} value={opt.value}>
						{opt.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
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
					data={data.claimRequests}
					searchKey="institutionName"
					searchPlaceholder="Cari institusi atau pemohon..."
					searchValue={draft}
					onSearchChange={handleSearchChange}
					emptyStateMessage="Tiada tuntutan dijumpai."
					pageCount={pageCount}
					pagination={pagination}
					onPaginationChange={handlePaginationChange}
					leftToolbarContent={statusFilter}
				/>
			</div>

			{/* Action Dialog */}
			<Dialog open={!!selectedClaim} onOpenChange={() => closeDialog()}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{actionType === "approve" ? "Luluskan" : "Tolak"} Tuntutan
						</DialogTitle>
						<DialogDescription>
							{actionType === "approve"
								? `Anda akan meluluskan tuntutan untuk "${selectedClaim?.institutionName}". Institusi ini akan diberikan kepada ${selectedClaim?.userName || selectedClaim?.userEmail}.`
								: `Anda akan menolak tuntutan untuk "${selectedClaim?.institutionName}". Sila berikan sebab penolakan.`}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						<div>
							<Label htmlFor="adminNotes">
								{actionType === "approve"
									? "Nota Admin (Optional)"
									: "Sebab Penolakan"}
							</Label>
							{actionType === "reject" && (
								<div className="flex flex-wrap gap-2 mb-2">
									{CLAIM_REJECTION_TEMPLATES.map((template) => (
										<Button
											key={template.label}
											type="button"
											variant="outline"
											size="sm"
											onClick={() => setAdminNotes(template.value)}
										>
											{template.label}
										</Button>
									))}
								</div>
							)}
							<Textarea
								id="adminNotes"
								placeholder={
									actionType === "approve"
										? "Tambah nota jika perlu..."
										: "Sila nyatakan sebab penolakan..."
								}
								value={adminNotes}
								onChange={(e) => setAdminNotes(e.target.value)}
								rows={3}
							/>
						</div>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={closeDialog}
							disabled={isSubmitting}
						>
							Batal
						</Button>
						<Button
							onClick={handleAction}
							disabled={
								isSubmitting || (actionType === "reject" && !adminNotes.trim())
							}
							variant={actionType === "approve" ? "default" : "destructive"}
						>
							{isSubmitting
								? "Memproses..."
								: actionType === "approve"
									? "Luluskan"
									: "Tolak"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

"use client";

import { Badge } from "@/components/ui/badge";
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
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import type { categories, states } from "@/lib/institution-constants";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ArrowUpDownIcon, MoreHorizontalIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { approveInstitution, rejectInstitution } from "../_lib/queries";

type PendingInstitution = {
	id: number;
	name: string;
	category: (typeof categories)[number];
	state: (typeof states)[number];
	city: string;
	contributorName: string | null;
	contributorId: string | null;
	createdAt: Date;
};

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

async function handleApprove(
	id: string,
	reviewerId: string,
	adminNotes?: string,
) {
	try {
		await approveInstitution(Number(id), reviewerId, adminNotes);
		return { success: true };
	} catch (error) {
		console.error("Failed to approve institution:", error);
		return { success: false, error };
	}
}

async function handleReject(
	id: string,
	reviewerId: string,
	adminNotes?: string,
) {
	try {
		await rejectInstitution(Number(id), reviewerId, adminNotes);
		return { success: true };
	} catch (error) {
		console.error("Failed to reject institution:", error);
		return { success: false, error };
	}
}

export const columns: ColumnDef<PendingInstitution>[] = [
	{
		id: "select",
		header: ({ table }) => (
			<Checkbox
				checked={table.getIsAllPageRowsSelected()}
				onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
				aria-label="Select all"
				className="translate-y-[2px]"
			/>
		),
		cell: ({ row }) => (
			<Checkbox
				checked={row.getIsSelected()}
				onCheckedChange={(value) => row.toggleSelected(!!value)}
				aria-label="Select row"
				className="translate-y-[2px]"
			/>
		),
		enableSorting: false,
		enableHiding: false,
	},
	{
		accessorKey: "id",
		header: "ID",
		cell: ({ row }) => (
			<div className="font-mono text-sm">{row.getValue("id")}</div>
		),
	},
	{
		accessorKey: "name",
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					Name
					<ArrowUpDownIcon className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		cell: ({ row }) => (
			<Link
				href={`/admin/institutions/pending/${row.getValue("id")}`}
				className="font-medium hover:underline"
			>
				{row.getValue("name")}
			</Link>
		),
	},
	{
		accessorKey: "category",
		header: "Category",
		cell: ({ row }) => {
			const category = row.getValue("category") as string;
			return (
				<Badge variant="secondary" className="capitalize">
					{category}
				</Badge>
			);
		},
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id));
		},
	},
	{
		accessorKey: "state",
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					State
					<ArrowUpDownIcon className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		cell: ({ row }) => <div>{row.getValue("state")}</div>,
	},
	{
		accessorKey: "city",
		header: "City",
		cell: ({ row }) => <div>{row.getValue("city")}</div>,
	},
	{
		accessorKey: "contributorName",
		header: "Contributor",
		cell: ({ row }) => {
			const name = row.getValue("contributorName") as string | null;
			const id = row.original.contributorId;
			return <div>{name ?? id ?? "-"}</div>;
		},
	},
	{
		accessorKey: "createdAt",
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					Date
					<ArrowUpDownIcon className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		cell: ({ row }) => {
			const date = row.getValue("createdAt") as Date | null;
			return <div>{date ? format(new Date(date), "d MMM yyyy") : "-"}</div>;
		},
	},
	{
		id: "actions",
		enableHiding: false,
		cell: ({ row }) => {
			const institution = row.original;
			const { user } = useAuth();
			const router = useRouter();
			const [actionDialog, setActionDialog] = useState<{
				isOpen: boolean;
				type: "approve" | "reject" | null;
			}>({
				isOpen: false,
				type: null,
			});

			const onApprove = async (notes: string) => {
				const result = await handleApprove(
					institution.id.toString(),
					user?.id || "",
					notes,
				);
				if (result.success) {
					toast.success(`Successfully approved ${institution.name}`);
					router.refresh();
				} else {
					toast.error("Failed to approve institution");
				}
				setActionDialog({ isOpen: false, type: null });
			};

			const onReject = async (notes: string) => {
				const result = await handleReject(
					institution.id.toString(),
					user?.id || "",
					notes,
				);
				if (result.success) {
					toast.success(`Successfully rejected ${institution.name}`);
					router.refresh();
				} else {
					toast.error("Failed to reject institution");
				}
				setActionDialog({ isOpen: false, type: null });
			};

			return (
				<>
					<ActionDialog
						isOpen={actionDialog.isOpen && actionDialog.type === "approve"}
						onClose={() => setActionDialog({ isOpen: false, type: null })}
						onConfirm={onApprove}
						title="Approve Institution"
						description={`Are you sure you want to approve ${institution.name}? Add any notes about your decision below.`}
						actionLabel="Approve"
						actionStyle="success"
					/>
					<ActionDialog
						isOpen={actionDialog.isOpen && actionDialog.type === "reject"}
						onClose={() => setActionDialog({ isOpen: false, type: null })}
						onConfirm={onReject}
						title="Reject Institution"
						description={`Are you sure you want to reject ${institution.name}? Add any notes about your decision below.`}
						actionLabel="Reject"
						actionStyle="destructive"
					/>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" className="h-8 w-8 p-0">
								<span className="sr-only">Open menu</span>
								<MoreHorizontalIcon className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuLabel>Actions</DropdownMenuLabel>
							<DropdownMenuItem
								onClick={() => {
									navigator.clipboard.writeText(institution.id.toString());
									toast.success("Institution ID copied to clipboard", {
										description: "You can now paste it to the admin",
									});
								}}
							>
								Copy institution ID
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem asChild>
								<Link href={`/admin/institutions/pending/${institution.id}`}>
									View details
								</Link>
							</DropdownMenuItem>
							{/* <DropdownMenuItem
								onClick={() =>
									setActionDialog({ isOpen: true, type: "approve" })
								}
								className="text-green-600"
							>
								Approve
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() =>
									setActionDialog({ isOpen: true, type: "reject" })
								}
								className="text-red-600"
							>
								Reject
							</DropdownMenuItem> */}
						</DropdownMenuContent>
					</DropdownMenu>
				</>
			);
		},
	},
];

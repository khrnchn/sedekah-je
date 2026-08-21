"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { CheckCircle, InfoIcon, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { formatDateTime } from "@/lib/date-utils";

export type ClaimRequestRow = {
	id: number;
	institutionId: number;
	institutionName: string;
	institutionCategory: string;
	userId: string;
	userName: string | null;
	userEmail: string;
	sourceUrl: string | null;
	description: string | null;
	status: "pending" | "approved" | "rejected";
	adminNotes: string | null;
	reviewedBy: string | null;
	reviewedAt: Date | null;
	reviewerName: string | null;
	createdAt: Date;
};

type OpenDialogFn = (
	claim: ClaimRequestRow,
	type: "approve" | "reject",
) => void;

function StatusBadge({ status }: { status: ClaimRequestRow["status"] }) {
	if (status === "pending") {
		return (
			<Badge variant="outline" className="border-yellow-500 text-yellow-600">
				Pending
			</Badge>
		);
	}
	if (status === "approved") {
		return (
			<Badge className="bg-green-600 hover:bg-green-700">Diluluskan</Badge>
		);
	}
	return <Badge variant="destructive">Ditolak</Badge>;
}

export function createColumns(
	openDialog: OpenDialogFn,
): ColumnDef<ClaimRequestRow>[] {
	return [
		{
			accessorKey: "id",
			header: "ID",
			cell: ({ row }) => (
				<div className="font-mono text-sm">{row.getValue("id")}</div>
			),
			enableSorting: false,
		},
		{
			accessorKey: "institutionName",
			header: "Institusi",
			cell: ({ row }) => (
				<div className="font-medium">{row.getValue("institutionName")}</div>
			),
			enableSorting: false,
		},
		{
			accessorKey: "institutionCategory",
			header: "Kategori",
			cell: ({ row }) => {
				const category = row.getValue("institutionCategory") as string;
				return (
					<Badge variant="secondary" className="capitalize">
						{category}
					</Badge>
				);
			},
			enableSorting: false,
		},
		{
			id: "userName",
			header: "Pemohon",
			cell: ({ row }) => {
				const name = row.original.userName;
				const email = row.original.userEmail;
				return <div>{name || email || "-"}</div>;
			},
			enableSorting: false,
		},
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
			enableSorting: false,
		},
		{
			accessorKey: "createdAt",
			header: "Tarikh Mohon",
			cell: ({ row }) => {
				const date = row.getValue("createdAt") as Date;
				return <div>{formatDateTime(date)}</div>;
			},
			enableSorting: false,
		},
		{
			id: "reviewerName",
			header: "Disemak Oleh",
			cell: ({ row }) => {
				const reviewerName = row.original.reviewerName;
				return <div>{reviewerName ?? "-"}</div>;
			},
			enableSorting: false,
		},
		{
			accessorKey: "reviewedAt",
			header: "Tarikh Semakan",
			cell: ({ row }) => {
				const date = row.getValue("reviewedAt") as Date | null;
				return <div>{formatDateTime(date)}</div>;
			},
			enableSorting: false,
		},
		{
			id: "actions",
			header: "",
			cell: ({ row }) => {
				const claim = row.original;
				const isPending = claim.status === "pending";
				const hasAdminNotes = !!claim.adminNotes?.trim();

				if (isPending) {
					return (
						<div className="flex items-center gap-2">
							<Button
								size="sm"
								variant="outline"
								className="text-green-600 hover:text-green-700"
								onClick={() => openDialog(claim, "approve")}
							>
								<CheckCircle className="h-4 w-4 mr-1" />
								Luluskan
							</Button>
							<Button
								size="sm"
								variant="outline"
								className="text-red-600 hover:text-red-700"
								onClick={() => openDialog(claim, "reject")}
							>
								<XCircle className="h-4 w-4 mr-1" />
								Tolak
							</Button>
						</div>
					);
				}

				if (hasAdminNotes) {
					return (
						<Popover>
							<PopoverTrigger asChild>
								<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
									<InfoIcon className="h-4 w-4" />
									<span className="sr-only">Lihat nota admin</span>
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-80" align="end">
								<p className="text-sm font-medium mb-1">Nota Admin</p>
								<p className="text-sm text-muted-foreground whitespace-pre-wrap">
									{claim.adminNotes}
								</p>
							</PopoverContent>
						</Popover>
					);
				}

				return null;
			},
			enableSorting: false,
		},
	];
}

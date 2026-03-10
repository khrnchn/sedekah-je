"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { EyeIcon } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDateTime } from "@/lib/date-utils";
import type { categories, states } from "@/lib/institution-constants";
import { AssignContributorDialog } from "./assign-contributor-dialog";
import { UndoApprovalDialog } from "./undo-approval-dialog";

type ApprovedInstitution = {
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

type User = {
	id: string;
	name: string | null;
	email: string;
	username: string | null;
};

export const createColumns = (
	users: User[],
): ColumnDef<ApprovedInstitution>[] => {
	return [
		{
			id: "select",
			header: ({ table }) => (
				<Checkbox
					checked={
						table.getIsAllPageRowsSelected() ||
						(table.getIsSomePageRowsSelected() && "indeterminate")
					}
					onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
					aria-label="Select all"
				/>
			),
			cell: ({ row }) => (
				<Checkbox
					checked={row.getIsSelected()}
					onCheckedChange={(value) => row.toggleSelected(!!value)}
					aria-label="Select row"
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
			enableSorting: false,
		},
		{
			accessorKey: "name",
			header: "Name",
			cell: ({ row }) => (
				<div className="font-medium">{row.getValue("name")}</div>
			),
			enableSorting: false,
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
			enableSorting: false,
		},
		{
			accessorKey: "state",
			header: "State",
			cell: ({ row }) => <div>{row.getValue("state")}</div>,
			enableSorting: false,
		},
		{
			accessorKey: "city",
			header: "City",
			cell: ({ row }) => <div>{row.getValue("city")}</div>,
			enableSorting: false,
		},
		{
			accessorKey: "contributorName",
			header: "Contributor",
			cell: ({ row }) => {
				const name = row.getValue("contributorName") as string | null;
				const id = row.original.contributorId;
				return <div>{name ?? id ?? "-"}</div>;
			},
			enableSorting: false,
		},
		{
			accessorKey: "reviewedBy",
			header: "Approved By",
			cell: ({ row }) => {
				const reviewerName = row.original.reviewerName;
				const reviewerId = row.getValue("reviewedBy") as string | null;
				return <div>{reviewerName ?? reviewerId ?? "-"}</div>;
			},
			enableSorting: false,
		},
		{
			accessorKey: "reviewedAt",
			header: "Date Approved",
			cell: ({ row }) => {
				const date = row.getValue("reviewedAt") as Date | null;
				return <div>{formatDateTime(date)}</div>;
			},
			enableSorting: false,
		},
		{
			id: "actions",
			cell: ({ row }) => {
				return (
					<div className="flex items-center gap-2">
						<AssignContributorDialog
							institutionId={row.original.id}
							institutionName={row.original.name}
							currentContributorId={row.original.contributorId}
							currentContributorName={row.original.contributorName}
							users={users}
						/>
						<UndoApprovalDialog
							institutionId={row.original.id}
							institutionName={row.original.name}
						/>
						<Button variant="ghost" size="sm" asChild>
							<Link href={`/admin/institutions/approved/${row.original.id}`}>
								<EyeIcon className="h-4 w-4" />
							</Link>
						</Button>
					</div>
				);
			},
			enableSorting: false,
		},
	];
};

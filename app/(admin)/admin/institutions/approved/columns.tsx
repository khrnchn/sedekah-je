"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { categories, states } from "@/lib/institution-constants";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ArrowUpDownIcon, EyeIcon } from "lucide-react";
import Link from "next/link";
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
	const reviewerNameById = new Map(
		users
			.filter((user) => user.id)
			.map((user) => [
				user.id,
				user.name ?? user.email ?? user.username ?? user.id,
			]),
	);
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
				<div className="font-medium">{row.getValue("name")}</div>
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
			accessorKey: "reviewedBy",
			header: "Approved By",
			cell: ({ row }) => {
				const reviewerId = row.getValue("reviewedBy") as string | null;
				return (
					<div>
						{(reviewerId && reviewerNameById.get(reviewerId)) ??
							reviewerId ??
							"-"}
					</div>
				);
			},
		},
		{
			accessorKey: "reviewedAt",
			header: ({ column }) => {
				return (
					<Button
						variant="ghost"
						onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					>
						Date Approved
						<ArrowUpDownIcon className="ml-2 h-4 w-4" />
					</Button>
				);
			},
			cell: ({ row }) => {
				const date = row.getValue("reviewedAt") as Date | null;
				return <div>{date ? format(new Date(date), "d MMM yyyy") : "-"}</div>;
			},
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
		},
	];
};

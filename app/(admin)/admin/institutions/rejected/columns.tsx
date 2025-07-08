"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { categories, states } from "@/lib/institution-constants";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ArrowUpDownIcon } from "lucide-react";

type RejectedInstitution = {
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

export const columns: ColumnDef<RejectedInstitution>[] = [
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
		accessorKey: "reviewedAt",
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					Date Rejected
					<ArrowUpDownIcon className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		cell: ({ row }) => {
			const date = row.getValue("reviewedAt") as Date | null;
			return <div>{date ? format(new Date(date), "d MMM yyyy") : "-"}</div>;
		},
	},
];

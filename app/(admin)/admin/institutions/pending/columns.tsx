"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDownIcon, MoreHorizontalIcon, QrCodeIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDateTime } from "@/lib/date-utils";
import type { ReviewBlockerCode } from "@/lib/features/institution-review/review-blockers";
import {
	getPendingReviewHref,
	INCLUDE_AUTOMATED_QUERY,
	shouldIncludeAutomated,
} from "../_lib/pending-review-scope";
import type { PendingInstitutionRow } from "./pending-row";

const BLOCKER_LABELS: Record<
	Exclude<ReviewBlockerCode, "duplicate">,
	string
> = {
	"qr-image": "No QR",
	"qr-content": "No content",
	address: "No address",
	coords: "No coords",
};

function PendingInstitutionLink({
	id,
	children,
	className,
}: {
	id: number;
	children: ReactNode;
	className?: string;
}) {
	const searchParams = useSearchParams();
	const includeAutomated = shouldIncludeAutomated(
		searchParams.get(INCLUDE_AUTOMATED_QUERY) ?? undefined,
	);

	return (
		<Link
			href={getPendingReviewHref(id, includeAutomated)}
			className={className}
		>
			{children}
		</Link>
	);
}

export const columns: ColumnDef<PendingInstitutionRow>[] = [
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
		id: "qr",
		header: "QR",
		enableSorting: false,
		cell: ({ row }) => {
			const { id, qrImage, name } = row.original;
			if (!qrImage) {
				return (
					<div className="flex h-10 w-10 items-center justify-center rounded border bg-muted text-muted-foreground">
						<QrCodeIcon className="h-4 w-4" />
						<span className="sr-only">No QR image</span>
					</div>
				);
			}
			return (
				<PendingInstitutionLink id={id} className="block h-10 w-10">
					{/* The R2 host is in next.config remotePatterns, so the optimizer
					    shrinks these full-size QR photos down to the thumbnail. */}
					<Image
						src={qrImage}
						alt={`QR for ${name}`}
						width={40}
						height={40}
						className="h-10 w-10 rounded border object-cover"
					/>
				</PendingInstitutionLink>
			);
		},
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
			<PendingInstitutionLink
				id={row.getValue("id")}
				className="font-medium hover:underline"
			>
				{row.getValue("name")}
			</PendingInstitutionLink>
		),
	},
	{
		id: "readiness",
		header: "Readiness",
		enableSorting: false,
		cell: ({ row }) => {
			const { blockers, duplicateOf } = row.original;
			if (blockers.length === 0) {
				return <Badge className="bg-green-600 hover:bg-green-700">Ready</Badge>;
			}
			return (
				<div className="flex flex-wrap gap-1">
					{blockers.map((blocker) =>
						blocker.code === "duplicate" ? (
							<Link
								key={blocker.code}
								href={
									duplicateOf?.status === "pending"
										? getPendingReviewHref(duplicateOf.id, false)
										: `/admin/institutions/approved/${blocker.duplicateInstitutionId}`
								}
								className="hover:underline"
							>
								<Badge variant="destructive">
									Dup #{blocker.duplicateInstitutionId}
								</Badge>
							</Link>
						) : (
							<Badge
								key={blocker.code}
								variant="outline"
								className="border-yellow-500 text-yellow-600"
							>
								{BLOCKER_LABELS[blocker.code]}
							</Badge>
						),
					)}
				</div>
			);
		},
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
			return <div>{formatDateTime(date)}</div>;
		},
	},
	{
		id: "actions",
		enableHiding: false,
		cell: ({ row }) => {
			const institution = row.original;

			return (
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
							<PendingInstitutionLink id={institution.id}>
								View details
							</PendingInstitutionLink>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			);
		},
	},
];

"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { MoreHorizontal } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { removeAdminRole, setUserRole } from "./_lib/actions";

// Assuming a User type based on better-auth documentation
export type User = {
	id: string;
	name: string | null;
	email: string;
	role?: string;
	createdAt: string;
};

export const columns: ColumnDef<User>[] = [
	{
		accessorKey: "name",
		header: "Name",
	},
	{
		accessorKey: "email",
		header: "Email",
	},
	{
		accessorKey: "role",
		header: "Role",
		cell: ({ row }) => {
			const role = row.getValue("role") as string;
			return (
				<Badge
					variant={role === "admin" ? "default" : "secondary"}
					className="capitalize"
				>
					{role || "user"}
				</Badge>
			);
		},
	},
	{
		accessorKey: "createdAt",
		header: "Created At",
		cell: ({ row }) => {
			const date = row.getValue("createdAt") as string | null;
			return date ? format(new Date(date), "d MMM yyyy") : "-";
		},
	},
	{
		id: "actions",
		cell: function Cell({ row }) {
			const user = row.original;
			const [isPending, startTransition] = useTransition();

			const handleSetAdmin = () => {
				startTransition(async () => {
					const result = await setUserRole(user.id, "admin");
					if (result.success) {
						toast.success(`${user.name} is now an admin.`);
					} else {
						toast.error(result.error);
					}
				});
			};

			const handleRemoveAdmin = () => {
				startTransition(async () => {
					const result = await removeAdminRole(user.id);
					if (result.success) {
						toast.success(`Admin role removed from ${user.name}.`);
					} else {
						toast.error(result.error);
					}
				});
			};

			return (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" className="h-8 w-8 p-0">
							<span className="sr-only">Open menu</span>
							<MoreHorizontal className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuLabel>Actions</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={handleSetAdmin}
							disabled={isPending || user.role?.includes("admin")}
						>
							Make admin
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={handleRemoveAdmin}
							disabled={isPending || !user.role?.includes("admin")}
						>
							Remove admin
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			);
		},
	},
];

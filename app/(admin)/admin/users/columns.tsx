"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Eye, MoreHorizontal } from "lucide-react";
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
	contributionStats?: {
		total: number;
		approved: number;
		pending: number;
		rejected: number;
	};
	institutions?: Array<{
		id: number;
		name: string;
		status: "pending" | "approved" | "rejected";
		category: string;
		createdAt: string;
	}>;
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
		accessorKey: "contributionStats",
		header: "Contributions",
		cell: ({ row }) => {
			const user = row.original;
			const stats = user.contributionStats;

			if (!stats || stats.total === 0) {
				return <span className="text-muted-foreground">0</span>;
			}

			return (
				<div className="flex items-center gap-2">
					<div className="text-sm">
						<span className="text-green-600 font-medium">{stats.approved}</span>
						<span className="text-muted-foreground mx-1">/</span>
						<span className="text-yellow-600 font-medium">{stats.pending}</span>
						<span className="text-muted-foreground mx-1">/</span>
						<span className="text-red-600 font-medium">{stats.rejected}</span>
					</div>
					{user.institutions && user.institutions.length > 0 && (
						<Dialog>
							<DialogTrigger asChild>
								<Button variant="ghost" size="sm" className="h-6 w-6 p-0">
									<Eye className="h-3 w-3" />
								</Button>
							</DialogTrigger>
							<DialogContent className="max-w-2xl">
								<DialogHeader>
									<DialogTitle>
										{user.name || "User"}'s Contributions
									</DialogTitle>
									<DialogDescription>
										{stats.total} total institutions contributed
									</DialogDescription>
								</DialogHeader>
								<ScrollArea className="max-h-96">
									<div className="space-y-2">
										{user.institutions.map((institution) => (
											<div
												key={institution.id}
												className="flex items-center justify-between p-3 border rounded-lg"
											>
												<div className="flex-1">
													<h4 className="font-medium">{institution.name}</h4>
													<p className="text-sm text-muted-foreground capitalize">
														{institution.category} •{" "}
														{format(
															new Date(institution.createdAt),
															"d MMM yyyy",
														)}
													</p>
												</div>
												<Badge
													variant={
														institution.status === "approved"
															? "default"
															: institution.status === "pending"
																? "secondary"
																: "destructive"
													}
													className={
														institution.status === "approved"
															? "bg-green-600"
															: ""
													}
												>
													{institution.status === "approved" && "✓ "}
													{institution.status === "pending" && "⏳ "}
													{institution.status === "rejected" && "✗ "}
													{institution.status}
												</Badge>
											</div>
										))}
									</div>
								</ScrollArea>
							</DialogContent>
						</Dialog>
					)}
				</div>
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

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { MoreHorizontal } from "lucide-react";
import Image from "next/image";
import { formatDate } from "@/lib/utils";

const InstitutionsTable = ({ initialData }: { initialData: { institutions: Institution[], pagination: Pagination } }) => {
	const router = useRouter();
	const searchParams = useSearchParams();

	const page = Number(searchParams.get("page")) || 1;
	const { institutions, pagination } = initialData;

	const createQueryString = useCallback(
		(name: string, value: string) => {
			const params = new URLSearchParams(searchParams);
			params.set(name, value);
			return params.toString();
		},
		[searchParams]
	);

	const handlePreviousPage = () => {
		if (page > 1) {
			router.push(`?${createQueryString("page", (page - 1).toString())}`);
		}
	};

	const handleNextPage = () => {
		if (page < pagination.totalPages) {
			router.push(`?${createQueryString("page", (page + 1).toString())}`);
		}
	};

	return (
		<>
			<Card className="rounded-lg border-none mt-6">
				<CardContent className="p-6">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="hidden w-[100px] sm:table-cell">
									<span className="sr-only">QR Content</span>
								</TableHead>
								<TableHead>Name</TableHead>
								<TableHead>Type</TableHead>
								<TableHead>City</TableHead>
								<TableHead>State</TableHead>
								<TableHead>Status</TableHead>
								<TableHead className="hidden md:table-cell">
									Created at
								</TableHead>
								<TableHead>
									<span className="sr-only">Actions</span>
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{institutions.map((institution) => (
								<TableRow key={institution.id}>
									<TableCell className="hidden sm:table-cell">
										<Image
											alt={`${institution.name} image`}
											className="aspect-square rounded-md object-cover"
											height="64"
											src={"/placeholder.svg"}
											width="64"
										/>
									</TableCell>
									<TableCell className="font-medium">
										{institution.name}
									</TableCell>
									<TableCell>
										<Badge variant="outline">{institution.type}</Badge>
									</TableCell>
									<TableCell className="hidden md:table-cell">
										{institution.city}
									</TableCell>
									<TableCell className="hidden md:table-cell">
										{institution.state}
									</TableCell>
									<TableCell>
										<Badge variant={institution.status === 'rejected' ? 'destructive' : 'default'}>
											{institution.status}
										</Badge>
									</TableCell>
									<TableCell className="hidden md:table-cell">
										{formatDate(institution.createdAt.toString())}
									</TableCell>
									<TableCell>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button aria-haspopup="true" size="icon" variant="ghost">
													<MoreHorizontal className="h-4 w-4" />
													<span className="sr-only">Toggle menu</span>
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuLabel>Actions</DropdownMenuLabel>
												<DropdownMenuItem>Edit</DropdownMenuItem>
												<DropdownMenuItem>Delete</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
				<CardFooter className="flex justify-between items-center">
					<div className="text-xs text-muted-foreground">
						Showing <strong>{(page - 1) * pagination.pageSize + 1}-{Math.min(page * pagination.pageSize, pagination.totalCount)}</strong> of <strong>{pagination.totalCount}</strong> institutions
					</div>
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							disabled={page === 1}
							onClick={handlePreviousPage}
						>
							Previous
						</Button>
						<Button
							variant="outline"
							size="sm"
							disabled={page === pagination.totalPages}
							onClick={handleNextPage}
						>
							Next
						</Button>
					</div>
				</CardFooter>
			</Card>
		</>
	);
};

export default InstitutionsTable;

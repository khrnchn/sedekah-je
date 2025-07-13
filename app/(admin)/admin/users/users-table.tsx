"use client";

import type { User } from "@/app/(admin)/admin/users/columns";
import { ReusableDataTable } from "@/components/reusable-data-table";
import type { Updater } from "@tanstack/react-table";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { columns } from "./columns";

type UsersData = {
	users: User[];
	total: number;
	limit: number;
	offset: number;
};

export function UsersTable({ data }: { data: UsersData }) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const page = Number(searchParams.get("page") ?? 1);
	const limit = Number(searchParams.get("limit") ?? 10);

	const pagination = useMemo(
		() => ({
			pageIndex: page - 1,
			pageSize: limit,
		}),
		[page, limit],
	);

	const handlePaginationChange = useCallback(
		(updater: Updater<{ pageIndex: number; pageSize: number }>) => {
			const newPagination =
				typeof updater === "function" ? updater(pagination) : updater;
			const params = new URLSearchParams(searchParams.toString());
			params.set("page", String(newPagination.pageIndex + 1));
			params.set("limit", String(newPagination.pageSize));
			router.push(`${pathname}?${params.toString()}`);
		},
		[pagination, router, pathname, searchParams],
	);

	const pageCount = Math.ceil(data.total / pagination.pageSize);

	return (
		<ReusableDataTable
			columns={columns}
			data={data.users}
			searchKey="email"
			searchPlaceholder="Search by email..."
			pageCount={pageCount}
			pagination={pagination}
			onPaginationChange={handlePaginationChange}
		/>
	);
}

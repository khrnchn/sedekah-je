"use client";

import type { User } from "@/app/(admin)/admin/users/columns";
import { ReusableDataTable } from "@/components/reusable-data-table";
import type { Updater } from "@tanstack/react-table";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
	const q = searchParams.get("q") ?? "";

	const [draft, setDraft] = useState(q);
	const debounceRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		setDraft(q);
	}, [q]);

	useEffect(() => {
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, []);

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

	const handleSearchChange = useCallback(
		(value: string) => {
			setDraft(value);
			if (debounceRef.current) clearTimeout(debounceRef.current);
			debounceRef.current = setTimeout(() => {
				debounceRef.current = null;
				const params = new URLSearchParams(searchParams.toString());
				if (value.trim()) {
					params.set("q", value.trim());
				} else {
					params.delete("q");
				}
				params.set("page", "1");
				router.push(`${pathname}?${params.toString()}`);
			}, 300);
		},
		[router, pathname, searchParams],
	);

	const pageCount = Math.ceil(data.total / pagination.pageSize);

	return (
		<ReusableDataTable
			columns={columns}
			data={data.users}
			searchKey="email"
			searchPlaceholder="Search by email..."
			searchValue={draft}
			onSearchChange={handleSearchChange}
			pageCount={pageCount}
			pagination={pagination}
			onPaginationChange={handlePaginationChange}
		/>
	);
}

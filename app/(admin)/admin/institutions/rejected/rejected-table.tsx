"use client";

import { useEffect, useState } from "react";
import { ReusableDataTable } from "@/components/reusable-data-table";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	getRejectionReasonBucket,
	OTHER_REJECTION_REASON,
	REJECTION_REASON_BUCKETS,
} from "@/lib/admin-templates";
import { categories, states } from "@/lib/institution-constants";
import { columns } from "./columns";

export type RejectedInstitution = {
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
	adminNotes: string | null;
};

const ALL = "all" as const;

type CategoryFilter = (typeof categories)[number] | typeof ALL;
type StateFilter = (typeof states)[number] | typeof ALL;
type ReasonFilter =
	| (typeof REJECTION_REASON_BUCKETS)[number]["value"]
	| typeof OTHER_REJECTION_REASON
	| typeof ALL;

export default function RejectedInstitutionsTable({
	initialData,
}: {
	initialData: RejectedInstitution[];
}) {
	const [institutions, setInstitutions] = useState(initialData);
	const [category, setCategory] = useState<CategoryFilter>(ALL);
	const [state, setState] = useState<StateFilter>(ALL);
	const [reason, setReason] = useState<ReasonFilter>(ALL);

	useEffect(() => {
		setInstitutions(initialData);
	}, [initialData]);

	const filteredData = institutions.filter((inst) => {
		if (category !== ALL && inst.category !== category) return false;
		if (state !== ALL && inst.state !== state) return false;
		if (reason !== ALL && getRejectionReasonBucket(inst.adminNotes) !== reason)
			return false;
		return true;
	});

	const filterControls = (
		<>
			<Select
				value={category}
				onValueChange={(value: CategoryFilter) => setCategory(value)}
			>
				<SelectTrigger className="w-[180px]">
					<SelectValue placeholder="Filter by category" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value={ALL}>All categories</SelectItem>
					{categories.map((cat) => (
						<SelectItem key={cat} value={cat} className="capitalize">
							{cat}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<Select
				value={state}
				onValueChange={(value: StateFilter) => setState(value)}
			>
				<SelectTrigger className="w-[180px]">
					<SelectValue placeholder="Filter by state" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value={ALL}>All states</SelectItem>
					{states.map((st) => (
						<SelectItem key={st} value={st}>
							{st}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<Select
				value={reason}
				onValueChange={(value: ReasonFilter) => setReason(value)}
			>
				<SelectTrigger className="w-[180px]">
					<SelectValue placeholder="Filter by reason" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value={ALL}>All reasons</SelectItem>
					{REJECTION_REASON_BUCKETS.map((bucket) => (
						<SelectItem key={bucket.value} value={bucket.value}>
							{bucket.label}
						</SelectItem>
					))}
					<SelectItem value={OTHER_REJECTION_REASON}>Other</SelectItem>
				</SelectContent>
			</Select>
		</>
	);

	return (
		<>
			<ReusableDataTable
				columns={columns}
				data={filteredData}
				searchKey="name"
				searchPlaceholder="Search institutions..."
				emptyStateMessage="No rejected institutions found."
				leftToolbarContent={filterControls}
			/>
		</>
	);
}

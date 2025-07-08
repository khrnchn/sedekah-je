"use client";

import { ReusableDataTable } from "@/components/reusable-data-table";
import type { categories, states } from "@/lib/institution-constants";
import { useEffect, useState } from "react";
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
};

export default function RejectedInstitutionsTable({
	initialData,
}: {
	initialData: RejectedInstitution[];
}) {
	const [institutions, setInstitutions] = useState(initialData);

	useEffect(() => {
		setInstitutions(initialData);
	}, [initialData]);

	return (
		<ReusableDataTable
			columns={columns}
			data={institutions}
			searchKey="name"
			searchPlaceholder="Search institutions..."
			emptyStateMessage="No rejected institutions found."
		/>
	);
}

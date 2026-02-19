"use client";

import { MobileProgressiveLoader } from "@/components/progressive-loader";
import { ListItemSkeleton } from "@/components/user-page-components";
import { Suspense, lazy, useState } from "react";
import { EditRejectedSheetWrapper } from "./edit-rejected-sheet-wrapper";

const ContributionList = lazy(() =>
	import("./contribution-list").then((module) => ({
		default: module.ContributionList,
	})),
);

interface Contribution {
	id: string;
	name: string;
	date: string;
	status: string;
	type: string;
}

interface LazyContributionListProps {
	contributions: Contribution[];
}

export function LazyContributionList({
	contributions,
}: LazyContributionListProps) {
	const [editInstitutionId, setEditInstitutionId] = useState<string | null>(
		null,
	);

	return (
		<>
			<MobileProgressiveLoader
				fallback={<ListItemSkeleton count={5} />}
				threshold={0.1}
			>
				<Suspense fallback={<ListItemSkeleton count={5} />}>
					<ContributionList
						contributions={contributions}
						onEditRejected={setEditInstitutionId}
					/>
				</Suspense>
			</MobileProgressiveLoader>
			<EditRejectedSheetWrapper
				editInstitutionId={editInstitutionId}
				onClose={() => setEditInstitutionId(null)}
			/>
		</>
	);
}

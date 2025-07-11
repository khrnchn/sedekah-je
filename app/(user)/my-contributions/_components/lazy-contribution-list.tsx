"use client";

import { MobileProgressiveLoader } from "@/components/progressive-loader";
import { ListItemSkeleton } from "@/components/user-page-components";
import { Suspense, lazy } from "react";

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
	return (
		<MobileProgressiveLoader
			fallback={<ListItemSkeleton count={5} />}
			threshold={0.1}
		>
			<Suspense fallback={<ListItemSkeleton count={5} />}>
				<ContributionList contributions={contributions} />
			</Suspense>
		</MobileProgressiveLoader>
	);
}

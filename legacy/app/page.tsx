import { Suspense } from "react";
import { RamadhanBanner } from "@/components/ramadhan-banner";
import { Header } from "@/components/shared/header";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getPublicInstitutionsPage } from "@/lib/queries/institutions";
import { PageClient } from "./page-client";

type SearchParams = {
	search?: string;
	category?: string;
	state?: string;
	page?: string;
};

type Props = {
	searchParams: Promise<SearchParams>;
};

export default async function Home(props: Props) {
	const searchParams = await props.searchParams;
	const initialResult = await getPublicInstitutionsPage({
		search: searchParams.search,
		category: searchParams.category,
		state: searchParams.state,
		page: 1,
		limit: 50,
	});

	return (
		<>
			<Header />
			<Suspense fallback={null}>
				<div className="max-w-5xl mx-auto px-4 lg:px-6 pt-2 sm:pt-4 lg:pt-6">
					<RamadhanBanner />
				</div>
			</Suspense>
			<Suspense fallback={<HomeLoading />}>
				<PageClient
					initialResult={initialResult}
					initialSearchParams={searchParams}
				/>
			</Suspense>
		</>
	);
}

function HomeLoading() {
	return (
		<div className="container mx-auto px-4 py-8">
			<div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
				{Array.from({ length: 24 }).map((_, idx) => (
					<Card key={idx} className="aspect-square w-full">
						<Skeleton className="min-h-full min-w-full" />
					</Card>
				))}
			</div>
		</div>
	);
}

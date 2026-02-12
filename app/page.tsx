import { RamadhanBanner } from "@/components/ramadhan-banner";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/ui/header";
import { Skeleton } from "@/components/ui/skeleton";
import { getInstitutions } from "@/lib/queries/institutions";
import { Suspense } from "react";
import { PageClient } from "./page-client";

type SearchParams = {
	search?: string;
	category?: string;
	state?: string;
	page?: string;
};

type Props = {
	searchParams: SearchParams;
};

export default async function Home({ searchParams }: Props) {
	// For initial server-side render, we'll fetch all approved institutions
	// Client will handle filtering and pagination
	const institutions = await getInstitutions();

	return (
		<>
			<Header />
			<Suspense fallback={null}>
				<div className="max-w-5xl mx-auto px-4 lg:px-6 pt-4">
					<RamadhanBanner />
				</div>
			</Suspense>
			<Suspense fallback={<HomeLoading />}>
				<PageClient
					initialInstitutions={institutions}
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
				{Array.from({ length: 15 }).map((_, idx) => (
					<Card key={idx} className="aspect-square w-full">
						<Skeleton className="min-h-full min-w-full" />
					</Card>
				))}
			</div>
		</div>
	);
}

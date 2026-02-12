import { Header } from "@/components/ui/header";
import { Skeleton } from "@/components/ui/skeleton";

export default function RamadhanLoading() {
	return (
		<>
			<Header />
			<main className="container mx-auto px-4 py-8 max-w-4xl">
				<div className="mb-8">
					<Skeleton className="h-9 w-80 mb-2" />
					<Skeleton className="h-5 w-96" />
				</div>
				<Skeleton className="h-48 w-full rounded-lg mb-10" />
				<div className="mb-4">
					<Skeleton className="h-7 w-48" />
				</div>
				<div className="grid grid-cols-3 sm:grid-cols-5 gap-3 sm:gap-4">
					{Array.from({ length: 30 }).map((_, i) => (
						<Skeleton key={i} className="h-28 rounded-lg" />
					))}
				</div>
			</main>
		</>
	);
}

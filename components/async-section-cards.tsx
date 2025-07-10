import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";
import { SectionCards } from "./section-cards";

// Loading skeleton that matches the SectionCards layout
function SectionCardsLoading() {
	return (
		<div className="*:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 grid grid-cols-1 gap-4 px-4 lg:px-6">
			{Array.from({ length: 4 }).map((_, i) => (
				<div key={i} className="rounded-lg border p-6 space-y-4">
					<div className="flex items-center justify-between">
						<div className="space-y-2">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-8 w-20" />
						</div>
						<Skeleton className="h-6 w-16" />
					</div>
					<div className="space-y-2">
						<Skeleton className="h-4 w-32" />
						<Skeleton className="h-3 w-40" />
					</div>
				</div>
			))}
		</div>
	);
}

// Individual card component with artificial delay for demo
async function AsyncSectionCard({
	title,
	value,
	description,
	trend,
	footer,
	delay = 0,
}: {
	title: string;
	value: string;
	description: string;
	trend: string;
	footer: string;
	delay?: number;
}) {
	// Simulate network delay
	if (delay > 0) {
		await new Promise((resolve) => setTimeout(resolve, delay));
	}

	return (
		<div className="rounded-lg border p-6 space-y-4">
			<div className="flex items-center justify-between">
				<div className="space-y-2">
					<div className="text-sm font-medium text-muted-foreground">
						{title}
					</div>
					<div className="text-2xl font-bold">{value}</div>
				</div>
				<div className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
					{trend}
				</div>
			</div>
			<div className="space-y-1">
				<div className="text-sm font-medium">{description}</div>
				<div className="text-xs text-muted-foreground">{footer}</div>
			</div>
		</div>
	);
}

// Component that demonstrates progressive loading
export function AsyncSectionCards() {
	return (
		<div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
			<Suspense
				fallback={
					<div className="rounded-lg border p-6">
						<Skeleton className="h-32 w-full" />
					</div>
				}
			>
				<AsyncSectionCard
					title="Total Institutions"
					value="1,234"
					description="Growing steadily"
					trend="+12%"
					footer="Across all states"
					delay={300}
				/>
			</Suspense>

			<Suspense
				fallback={
					<div className="rounded-lg border p-6">
						<Skeleton className="h-32 w-full" />
					</div>
				}
			>
				<AsyncSectionCard
					title="Sedang Disemak"
					value="23"
					description="Needs attention"
					trend="+2"
					footer="Requires admin action"
					delay={600}
				/>
			</Suspense>

			<Suspense
				fallback={
					<div className="rounded-lg border p-6">
						<Skeleton className="h-32 w-full" />
					</div>
				}
			>
				<AsyncSectionCard
					title="Active Users"
					value="456"
					description="Engaged community"
					trend="+5%"
					footer="Monthly active users"
					delay={900}
				/>
			</Suspense>

			<Suspense
				fallback={
					<div className="rounded-lg border p-6">
						<Skeleton className="h-32 w-full" />
					</div>
				}
			>
				<AsyncSectionCard
					title="QR Scans"
					value="8,901"
					description="High engagement"
					trend="+18%"
					footer="This month"
					delay={1200}
				/>
			</Suspense>
		</div>
	);
}

// Simpler version with single Suspense boundary
export function AsyncSectionCardsSimple() {
	return (
		<Suspense fallback={<SectionCardsLoading />}>
			<SectionCards />
		</Suspense>
	);
}

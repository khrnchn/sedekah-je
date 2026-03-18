import { ArrowLeft, Flame, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { UserLayout } from "@/components/layout/user-layout";
import { EmptyState } from "@/components/layout/user-page-components";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDurationForCard } from "@/lib/terawih";
import { StoryCardExporter } from "../_components/story-card-exporter";
import { TerawihWrappedStoryCard } from "../_components/terawih-story-card";
import { getTerawihWrappedData } from "../_lib/queries";

export const metadata: Metadata = {
	title: "Ramadan Wrapped",
	description:
		"Lihat ringkasan Ramadan Wrapped untuk sesi tarawih anda di SedekahJe.",
	robots: {
		index: false,
		follow: false,
	},
};

export default async function TerawihWrappedPage() {
	const wrapped = await getTerawihWrappedData();

	return (
		<UserLayout
			title="Ramadan Wrapped"
			description="Ringkasan satu kad untuk semua sesi tarawih anda sepanjang Ramadan."
		>
			<div className="space-y-6">
				<Button asChild variant="ghost" className="px-0">
					<Link href="/terawih">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Kembali ke tracker
					</Link>
				</Button>

				{!wrapped || wrapped.summary.totalNights === 0 ? (
					<EmptyState
						icon={Sparkles}
						title="Wrapped belum tersedia"
						description="Log sekurang-kurangnya satu sesi tarawih dalam tempoh Ramadan untuk melihat ringkasan anda."
						action={
							<Button asChild>
								<Link href="/terawih">Log sesi tarawih</Link>
							</Button>
						}
					/>
				) : (
					<div className="grid gap-8 lg:grid-cols-[minmax(0,380px)_1fr]">
						<Card>
							<CardContent className="space-y-4 p-6">
								<div className="flex flex-wrap gap-2">
									<Badge
										variant="secondary"
										className="bg-orange-500/10 text-orange-700 dark:text-orange-300"
									>
										{wrapped.year}
									</Badge>
									<Badge variant="outline">
										{wrapped.startDate} hingga {wrapped.endDate}
									</Badge>
								</div>
								<div>
									<h2 className="text-2xl font-semibold">Prestasi Ramadan</h2>
									<p className="mt-1 text-sm text-muted-foreground">
										Diringkaskan daripada sesi tarawih dalam window Ramadan
										semasa.
									</p>
								</div>
								<div className="grid gap-3 sm:grid-cols-2">
									<div className="rounded-xl border p-4">
										<p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
											Malam
										</p>
										<p className="mt-2 text-2xl font-bold">
											{wrapped.summary.totalNights}
										</p>
									</div>
									<div className="rounded-xl border p-4">
										<p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
											Total Minit
										</p>
										<p className="mt-2 text-2xl font-bold">
											{formatDurationForCard(wrapped.summary.totalMinutes)}
										</p>
									</div>
									<div className="rounded-xl border p-4">
										<p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
											Total Rakaat
										</p>
										<p className="mt-2 text-2xl font-bold">
											{wrapped.summary.totalRakaat}
										</p>
									</div>
									<div className="rounded-xl border p-4">
										<p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
											Best Streak
										</p>
										<p className="mt-2 flex items-center gap-2 text-2xl font-bold">
											<Flame className="h-5 w-5 text-orange-500" />
											{wrapped.summary.bestStreak}
										</p>
									</div>
								</div>
							</CardContent>
						</Card>

						<StoryCardExporter fileName={`terawih-wrapped-${wrapped.year}`}>
							<TerawihWrappedStoryCard
								year={wrapped.year}
								totalNights={wrapped.summary.totalNights}
								totalMinutes={wrapped.summary.totalMinutes}
								totalRakaat={wrapped.summary.totalRakaat}
								averageMpr={wrapped.summary.averageMpr}
								bestStreak={wrapped.summary.bestStreak}
								topMosque={wrapped.summary.topMosque}
							/>
						</StoryCardExporter>
					</div>
				)}
			</div>
		</UserLayout>
	);
}

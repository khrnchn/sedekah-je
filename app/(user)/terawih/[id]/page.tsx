import { ArrowLeft, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { UserLayout } from "@/components/layout/user-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	formatDurationForCard,
	formatSessionDateLabel,
	formatTimeForCard,
} from "@/lib/terawih";
import { StoryCardExporter } from "../_components/story-card-exporter";
import { TerawihSessionStoryCard } from "../_components/terawih-story-card";
import { getTerawihSessionById } from "../_lib/queries";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ id: string }>;
}): Promise<Metadata> {
	const { id } = await params;
	return {
		title: `Kad Terawih #${id}`,
		robots: {
			index: false,
			follow: false,
		},
	};
}

export default async function TerawihSessionDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const session = await getTerawihSessionById(Number(id));

	if (!session) {
		notFound();
	}

	return (
		<UserLayout
			title="Kad Sesi Tarawih"
			description="Preview dan export imej story bagi sesi yang baru anda log."
		>
			<div className="space-y-6">
				<Button asChild variant="ghost" className="px-0">
					<Link href="/terawih">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Kembali ke semua sesi
					</Link>
				</Button>

				<div className="grid gap-8 lg:grid-cols-[minmax(0,380px)_1fr]">
					<Card>
						<CardContent className="space-y-4 p-6">
							<div className="flex flex-wrap gap-2">
								<Badge
									variant="secondary"
									className="bg-orange-500/10 text-orange-700 dark:text-orange-300"
								>
									{formatSessionDateLabel(session.sessionDate)}
								</Badge>
								<Badge variant="outline">{session.rakaat} rakaat</Badge>
							</div>
							<div>
								<h2 className="text-2xl font-semibold">{session.mosqueName}</h2>
								<p className="mt-1 text-sm text-muted-foreground">
									ID share: {session.shareSlug}
								</p>
							</div>
							<div className="grid gap-3 sm:grid-cols-2">
								<div className="rounded-xl border p-4">
									<p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
										Start
									</p>
									<p className="mt-2 text-2xl font-bold">
										{formatTimeForCard(session.startTime)}
									</p>
								</div>
								<div className="rounded-xl border p-4">
									<p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
										End
									</p>
									<p className="mt-2 text-2xl font-bold">
										{formatTimeForCard(session.endTime)}
									</p>
								</div>
								<div className="rounded-xl border p-4">
									<p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
										Duration
									</p>
									<p className="mt-2 text-2xl font-bold">
										{formatDurationForCard(session.durationMinutes)}
									</p>
								</div>
								<div className="rounded-xl border p-4">
									<p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
										Avg MPR
									</p>
									<p className="mt-2 text-2xl font-bold">
										{session.averageMpr}
									</p>
								</div>
							</div>
							{session.notes && (
								<div className="rounded-xl border p-4">
									<p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
										Catatan
									</p>
									<p className="mt-2 text-sm leading-6">{session.notes}</p>
								</div>
							)}
							<div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
								<MapPin className="h-4 w-4" />
								Promosi kecil akan tertera pada imej: `masjid.svg` dan
								`sedekah.je/terawih`.
							</div>
						</CardContent>
					</Card>

					<StoryCardExporter fileName={`terawih-session-${session.id}`}>
						<TerawihSessionStoryCard
							mosqueName={session.mosqueName}
							sessionDate={session.sessionDate}
							ramadanStartDate={session.ramadanStartDate}
							startTime={session.startTime}
							endTime={session.endTime}
							durationMinutes={session.durationMinutes}
							averageMpr={session.averageMpr}
							rakaat={session.rakaat}
						/>
					</StoryCardExporter>
				</div>
			</div>
		</UserLayout>
	);
}

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
			<div className="space-y-4">
				<Button asChild variant="ghost" className="px-0">
					<Link href="/terawih">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Kembali ke semua sesi
					</Link>
				</Button>

				{/* Mobile: story card first, details below. Desktop: side by side */}
				<div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
					<div className="lg:order-last">
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

					<Card className="h-fit">
						<CardContent className="space-y-4 p-5">
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
								<h2 className="text-xl font-semibold">{session.mosqueName}</h2>
								<p className="mt-0.5 text-xs text-muted-foreground">
									ID share: {session.shareSlug}
								</p>
							</div>

							<div className="grid grid-cols-2 gap-2.5">
								<div className="rounded-xl border p-3">
									<p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
										Mula
									</p>
									<p className="mt-1.5 text-xl font-bold tabular-nums">
										{formatTimeForCard(session.startTime)}
									</p>
								</div>
								<div className="rounded-xl border p-3">
									<p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
										Tamat
									</p>
									<p className="mt-1.5 text-xl font-bold tabular-nums">
										{formatTimeForCard(session.endTime)}
									</p>
								</div>
								<div className="rounded-xl border p-3">
									<p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
										Tempoh
									</p>
									<p className="mt-1.5 text-xl font-bold tabular-nums">
										{formatDurationForCard(session.durationMinutes)}
									</p>
								</div>
								<div className="rounded-xl border p-3">
									<p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
										Purata MPR
									</p>
									<p className="mt-1.5 text-xl font-bold tabular-nums">
										{session.averageMpr}
									</p>
								</div>
							</div>

							{session.notes && (
								<div className="rounded-xl border p-3">
									<p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
										Catatan
									</p>
									<p className="mt-1.5 text-sm leading-relaxed">
										{session.notes}
									</p>
								</div>
							)}

							<p className="flex items-center gap-1.5 text-xs text-muted-foreground">
								<MapPin className="h-3.5 w-3.5" />
								Promosi kecil tertera pada imej: masjid.svg dan
								sedekah.je/terawih.
							</p>
						</CardContent>
					</Card>
				</div>
			</div>
		</UserLayout>
	);
}

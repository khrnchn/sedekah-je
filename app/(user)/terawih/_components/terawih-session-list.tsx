import { Clock3, ExternalLink, Flame, MapPinned } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/layout/user-page-components";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	formatAverageMprForCard,
	formatDurationForCard,
	formatSessionDateLabel,
	formatTimeForCard,
} from "@/lib/terawih";
import type { TerawihSessionListItem } from "../_lib/queries";

export function TerawihSessionList({
	sessions,
}: {
	sessions: TerawihSessionListItem[];
}) {
	if (sessions.length === 0) {
		return (
			<EmptyState
				icon={Flame}
				title="Belum ada sesi tarawih"
				description="Log sesi pertama anda untuk mula jana kad share dan wrapped Ramadan."
			/>
		);
	}

	return (
		<div className="space-y-4">
			{sessions.map((session) => (
				<Card key={session.id} className="overflow-hidden">
					<CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
						<div className="space-y-3">
							<div className="flex flex-wrap items-center gap-2">
								<Badge
									variant="secondary"
									className="bg-orange-500/10 text-orange-700 dark:text-orange-300"
								>
									{formatSessionDateLabel(session.sessionDate)}
								</Badge>
								<Badge variant="outline">{session.rakaat} rakaat</Badge>
							</div>
							<div>
								<p className="font-semibold text-lg">{session.mosqueName}</p>
								<div className="mt-1 flex flex-wrap gap-4 text-sm text-muted-foreground">
									<span className="inline-flex items-center gap-1">
										<Clock3 className="h-4 w-4" />
										{formatTimeForCard(session.startTime)} -{" "}
										{formatTimeForCard(session.endTime)}
									</span>
									<span className="inline-flex items-center gap-1">
										<MapPinned className="h-4 w-4" />
										{formatDurationForCard(session.durationMinutes)}
									</span>
									<span>
										AVG MPR {formatAverageMprForCard(session.averageMpr)}
									</span>
								</div>
							</div>
						</div>
						<Button asChild variant="outline" className="shrink-0">
							<Link href={`/terawih/${session.id}`}>
								Lihat Kad
								<ExternalLink className="ml-2 h-4 w-4" />
							</Link>
						</Button>
					</CardContent>
				</Card>
			))}
		</div>
	);
}

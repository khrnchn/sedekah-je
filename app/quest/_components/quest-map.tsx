"use client";

import dynamic from "next/dynamic";
import type { QuestMosqueWithStatus } from "@/app/quest/_lib/types";
import { Skeleton } from "@/components/ui/skeleton";

const QuestMapLeaflet = dynamic(
	() => import("@/app/quest/_components/quest-map-leaflet"),
	{
		loading: () => (
			<div className="flex h-full w-full items-center justify-center bg-zinc-900">
				<Skeleton className="h-full w-full bg-zinc-800" />
			</div>
		),
		ssr: false,
	},
);

type QuestMapProps = {
	mosques: QuestMosqueWithStatus[];
	selectedId: number | null;
	onMarkerClick: (id: number) => void;
	bottomSheetOpen?: boolean;
	isDesktop?: boolean;
};

export default function QuestMap({
	mosques,
	selectedId,
	onMarkerClick,
	bottomSheetOpen,
	isDesktop,
}: QuestMapProps) {
	return (
		<QuestMapLeaflet
			mosques={mosques}
			selectedId={selectedId}
			onMarkerClick={onMarkerClick}
			bottomSheetOpen={bottomSheetOpen}
			isDesktop={isDesktop}
		/>
	);
}

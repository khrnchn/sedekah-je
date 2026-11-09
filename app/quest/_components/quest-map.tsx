"use client";

import dynamic from "next/dynamic";
import type {
	QuestMosqueView,
	QuestStatusFilter,
} from "@/app/quest/_lib/types";
import { Skeleton } from "@/components/ui/skeleton";

const QuestMapLeaflet = dynamic(
	() => import("@/app/quest/_components/quest-map-leaflet"),
	{
		loading: () => (
			<div className="flex h-full w-full items-center justify-center bg-muted">
				<Skeleton className="h-full w-full bg-accent" />
			</div>
		),
		ssr: false,
	},
);

type QuestMapProps = {
	mosques: QuestMosqueView[];
	selectedId: number | null;
	onSelect: (id: number | null) => void;
	statusFilter: QuestStatusFilter;
	onStatusFilterChange: (filter: QuestStatusFilter) => void;
	onShowUnmapped: () => void;
	onFindMissing: () => void;
	onShowGroup: (ids: number[]) => void;
};

export default function QuestMap(props: QuestMapProps) {
	return <QuestMapLeaflet {...props} />;
}

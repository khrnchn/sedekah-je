"use client";

import type { MapMarker } from "@/components/map";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MapIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";

const CollapsibleCustomMap = ({
	marker,
}: {
	marker?: MapMarker;
}) => {
	const [isMapVisible, setIsMapVisible] = useState(false);

	const LeafletMap = useMemo(
		() =>
			dynamic(() => import("@/components/map"), {
				loading: () => (
					<Card className="min-h-[240px] h-[240px] md:min-h-[240px] md:w-full">
						<Skeleton className="min-h-full min-w-full flex items-center justify-center">
							<CardContent className="italic text-black/50 dark:text-white/50">
								Peta sedang dimuatkan...
							</CardContent>
						</Skeleton>
					</Card>
				),
				ssr: false,
			}),
		[],
	);

	const toggleMap = () => {
		setIsMapVisible(!isMapVisible);
	};

	return (
		<div className="w-full">
			<div className="flex justify-end">
				<Button
					onClick={toggleMap}
					variant="outline"
					className="bg-gradient-to-br from-orange-500 to-orange-300 border border-orange-400 rounded-full hover:from-orange-600 hover:to-orange-400 transition-colors"
				>
					<MapIcon className="mr-2 h-5 w-5" />
					<span className="hidden sm:inline">
						{isMapVisible ? "Sembunyikan Peta" : "Tunjukkan Peta"}
					</span>
					<span className="sm:hidden">Peta</span>
				</Button>
			</div>
			{isMapVisible && (
				<div className="mt-2">
					<LeafletMap marker={marker} />
				</div>
			)}
		</div>
	);
};

export default CollapsibleCustomMap;

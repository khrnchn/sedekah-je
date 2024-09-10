"use client";

import React, { useState, useMemo } from 'react';
import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MapIcon } from 'lucide-react';
import type { MapMarker } from "@/components/map";

const CollapsibleCustomMap = ({
	showAll,
	marker,
}: {
	showAll?: boolean;
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
								Peta sedang dinampan...
							</CardContent>
						</Skeleton>
					</Card>
				),
				ssr: false,
			}),
		[]
	);

	const toggleMap = () => {
		setIsMapVisible(!isMapVisible);
	};

	return (
		<div className="w-full mb-4">
			<div className="flex justify-end mb-2">
				<button
					onClick={toggleMap}
					className="h-10 flex items-center px-4 py-2 bg-gradient-to-br from-orange-500 to-orange-300 border border-orange-400 text-background  rounded-full"
				>
					<MapIcon className="mr-2 h-5 w-5" />
					<span className="hidden sm:inline">{isMapVisible ? 'Sembunyikan Peta' : 'Tunjukkan Peta'}</span>
					<span className="sm:hidden">Peta</span>
				</button>
			</div>
			{isMapVisible && (
				<div className="mt-2">
					{showAll ? (
						<LeafletMap />
					) : marker ? (
						<LeafletMap center={marker.coords} zoom={16} marker={marker} />
					) : null}
				</div>
			)}
		</div>
	);
};

export default CollapsibleCustomMap;
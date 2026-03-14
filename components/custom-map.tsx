"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import type { Institution } from "@/app/types/institutions";
import type { MapMarker } from "@/components/map";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface CollapsibleCustomMapProps {
	marker?: MapMarker;
	showAll?: boolean;
	isVisible: boolean;
	filteredInstitutions?: Institution[];
}

const CollapsibleCustomMap = ({
	marker,
	showAll,
	isVisible,
	filteredInstitutions,
}: CollapsibleCustomMapProps) => {
	const [hasMounted, setHasMounted] = useState(false);

	const LeafletMap = useMemo(
		() =>
			dynamic(() => import("@/components/map"), {
				loading: () => (
					<Card className="min-h-[240px] h-[240px] md:min-h-[240px] w-full">
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

	useEffect(() => {
		if (isVisible) {
			setHasMounted(true);
		}
	}, [isVisible]);

	return (
		<motion.div
			className="w-full overflow-hidden"
			initial={false}
			animate={
				isVisible ? { opacity: 1, height: "auto" } : { opacity: 0, height: 0 }
			}
			transition={{ duration: 0.3, ease: "easeInOut" }}
		>
			{hasMounted ? (
				showAll ? (
					<LeafletMap filteredInstitutions={filteredInstitutions} />
				) : marker ? (
					<LeafletMap marker={marker} />
				) : null
			) : null}
		</motion.div>
	);
};

export default CollapsibleCustomMap;

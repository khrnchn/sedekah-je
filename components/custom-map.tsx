"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { HelpCircle, MapIcon } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "./ui/button";

const CollapsibleCustomMap = () => {
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
			<div className="flex justify-end gap-2">
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
				<Link href="/faq" passHref>
					<Button
						variant="outline"
						className="bg-gradient-to-br from-blue-500 to-blue-300 border border-blue-400 rounded-full hover:from-blue-700 hover:to-blue-500 transition-colors"
					>
						<HelpCircle className="mr-2 h-5 w-5" />
						<span className="hidden sm:inline ml-2">Soalan Lazim</span>
						<span className="sm:hidden">FAQ</span>
					</Button>
				</Link>
			</div>
			{isMapVisible && (
				<div className="mt-2">
					<LeafletMap />
				</div>
			)}
		</div>
	);
};

export default CollapsibleCustomMap;

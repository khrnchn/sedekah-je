"use client";

import { CategoryColor } from "@/app/types/institutions";
import CollapsibleCustomMap from "@/components/custom-map";
import { Button } from "@/components/ui/button";
import InstitutionCard from "@/components/ui/institution-card";
import { MapIcon } from "lucide-react";
import { useCallback, useState, useMemo } from "react";
import type { Institution } from "@/db/schema";
import type { Institution as OldInstitution } from "@/app/types/institutions";

type Props = {
	institution: Institution;
};

export function InstitutionPageClient({ institution }: Props) {
	const [isMapVisible, setIsMapVisible] = useState(false);

	const toggleMap = useCallback(() => {
		setIsMapVisible(!isMapVisible);
	}, [isMapVisible]);

	// Convert database Institution to component-compatible format
	const adaptedInstitution = useMemo(() => {
		return {
			...institution,
			description: institution.description || undefined,
			supportedPayment: institution.supportedPayment || undefined,
			coords: institution.coords || undefined,
		} as OldInstitution;
	}, [institution]);

	return (
		<div className="space-y-4">
			{!!adaptedInstitution.coords && Array.isArray(adaptedInstitution.coords) && adaptedInstitution.coords.length === 2 && (
				<>
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
					<CollapsibleCustomMap
						isVisible={isMapVisible}
						marker={{
							coords: adaptedInstitution.coords as [number, number],
							name: adaptedInstitution.name,
							color: CategoryColor[adaptedInstitution.category as keyof typeof CategoryColor],
						}}
					/>
				</>
			)}
			<InstitutionCard key={adaptedInstitution.id} {...adaptedInstitution} />
		</div>
	);
}
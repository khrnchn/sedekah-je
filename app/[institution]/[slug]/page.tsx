"use client";

import { institutions } from "@/app/data/institutions";
import { CategoryColor } from "@/app/types/institutions";
import CollapsibleCustomMap from "@/components/custom-map";
import GetdoaFooter from "@/components/getdoa-footer";
import PageFooter from "@/components/page-footer";
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/ui/header";
import InstitutionCard from "@/components/ui/institution-card";
import PageSection from "@/components/ui/pageSection";
import { slugify } from "@/lib/utils";
import { MapIcon } from "lucide-react";
import { notFound } from "next/navigation";
import { Suspense, useCallback, useState } from "react";
import type React from "react";

type Props = {
	params: {
		slug: string;
	};
};

const InstitutionPage = ({ params }: Props) => {
	const [isMapVisible, setIsMapVisible] = useState(false);

	const institution =
		institutions.find(
			(institution) => slugify(institution.name) === params.slug,
		) ?? notFound();

	const toggleMap = useCallback(() => {
		setIsMapVisible(!isMapVisible);
	}, [isMapVisible]);

	return (
		<>
			<Header />
			<PageSection>
				<PageHeader pageTitle={institution.name} showHeader={false} />
				<div className="space-y-4">
					{!!institution.coords?.length && (
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
									coords: institution.coords,
									name: institution.name,
									color: CategoryColor[institution.category],
								}}
							/>
						</>
					)}
					<InstitutionCard key={institution.id} {...institution} />
				</div>
				{/* <PageFooter /> */}
				<Suspense fallback={<div>Loading...</div>}>
					<GetdoaFooter />
				</Suspense>
			</PageSection>
		</>
	);
};

export default InstitutionPage;

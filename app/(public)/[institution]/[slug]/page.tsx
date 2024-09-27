"use client";

import { institutions } from "@/app/data/institutions";
import { CategoryColor } from "@/app/types/institutions";
import CustomMap from "@/components/custom-map";
import PageHeader from "@/components/page-header";
import InstitutionCard from "@/components/ui/institution-card";
import PageSection from "@/components/ui/pageSection";
import { slugify } from "@/lib/utils";
import { notFound } from "next/navigation";
import type React from "react";

type Params = {
	params: {
		slug: string;
	};
};

const InstitutionPage: React.FC<Params> = ({ params }) => {
	const institution = institutions.find(
		(institution) => slugify(institution.name) === params.slug,
	);

	if (!institution) {
		notFound();
	}

	return (
		<PageSection>
			<PageHeader pageTitle={institution.name} showHeader={false} />
			<div className="space-y-4">
				{institution.coords?.length && (
					<CustomMap
						marker={{
							coords: institution.coords,
							name: institution.name,
							color: CategoryColor[institution.category],
						}}
					/>
				)}
				<InstitutionCard key={institution.id} {...institution} />
			</div>
		</PageSection>
	);
};

export default InstitutionPage;

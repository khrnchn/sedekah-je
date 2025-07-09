import { getInstitutionBySlug } from "@/lib/queries/institutions";
import { CategoryColor } from "@/app/types/institutions";
import CollapsibleCustomMap from "@/components/custom-map";
import GetdoaFooter from "@/components/getdoa-footer";
import PageFooter from "@/components/page-footer";
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/ui/header";
import InstitutionCard from "@/components/ui/institution-card";
import PageSection from "@/components/ui/pageSection";
import { MapIcon } from "lucide-react";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type React from "react";
import { InstitutionPageClient } from "./page-client";

type Props = {
	params: {
		slug: string;
	};
};

export default async function InstitutionPage({ params }: Props) {
	const institution = await getInstitutionBySlug(params.slug);

	if (!institution) {
		notFound();
	}

	return (
		<>
			<Header />
			<PageSection>
				<PageHeader pageTitle={institution.name} showHeader={false} />
				<InstitutionPageClient institution={institution} />
				{/* <PageFooter /> */}
				<Suspense fallback={<div>Loading...</div>}>
					<GetdoaFooter />
				</Suspense>
				<PageFooter />
			</PageSection>
		</>
	);
}

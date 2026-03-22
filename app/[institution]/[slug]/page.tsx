import { MapIcon } from "lucide-react";
import { notFound } from "next/navigation";
import type React from "react";
import { Suspense } from "react";
import GetdoaFooter from "@/components/getdoa-footer";
import InstitutionCard from "@/components/institution/institution-card";
import PageFooter from "@/components/layout/page-footer";
import PageHeader from "@/components/layout/page-header";
import CollapsibleCustomMap from "@/components/map/custom-map";
import { Header } from "@/components/shared/header";
import PageSection from "@/components/shared/page-section";
import { Button } from "@/components/ui/button";
import { getInstitutionBySlug } from "@/lib/queries/institutions";
import { InstitutionPageClient } from "./page-client";

type Props = {
	params: Promise<{
		slug: string;
	}>;
};

export default async function InstitutionPage(props: Props) {
	const params = await props.params;
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

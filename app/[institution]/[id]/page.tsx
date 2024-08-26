"use client";

import PageSection from "@/components/ui/pageSection";
import type React from "react";
import { institutions } from "@/app/data/institutions";
import InstitutionCard from "@/components/ui/institution-card";
import CustomMap from "../../../components/custom-map";
import { CategoryColor } from "../../types/institutions";
import { notFound } from "next/navigation";

type Params = {
    params: {
        id: number;
    };
};

const InstitutionPage: React.FC<Params> = ({ params }) => {
    const institution = institutions.find(
        (institution) => institution.id === +params.id
    );

    if (!institution) {
        notFound();
    }

    return (
        <PageSection>
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

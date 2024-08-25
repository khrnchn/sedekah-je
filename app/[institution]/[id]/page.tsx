import PageSection from "@/components/ui/pageSection";
import type React from "react";
import { institutions } from "@/app/data/institutions";
import InstitutionCard from "@/components/ui/institution-card";
import CustomMap from "../../../components/custom-map";

type Params = {
    params: {
        institution: string,
        id: number
    }
}

function getInstitution(id: number, category: string) {
    const filterInstitution = (category: string) => {
        switch (category) {
            case "masjid":
                return "mosque";
            case "lain-lain":
                return "others";
            default:
                return category;
        }
    };

    try {
        return institutions.filter((institution) => +institution.id === +id && institution.category === filterInstitution(category));
    } catch (error) {
        return null
    }

}


const Institution: React.FC<Params> = ({ params }: { params: { institution: string, id: number } }) => {
    const institution = getInstitution(params.id, params.institution);

    return (
        <PageSection>
            {
                institution?.map((institution) => {
                    return (
                        <div className="space-y-4">
                            <CustomMap location={institution.coords} name={institution.name} />
                            <InstitutionCard
                                key={institution.id}
                                {...institution}
                                ref={null}
                            />
                        </div>
                    )
                })
            }
        </PageSection>
    );
};

export default Institution;

import { SJBreadcrumbs } from "@/components/dashboard/sj-breadcrumbs";
import { SJHeader } from "@/components/dashboard/sj-header";
import { LayoutBody, SJLayout } from "@/components/dashboard/sj-layout";
import {
  getCategories,
  getCities,
  getPaymentMethods,
  getSocialPlatforms,
  getStates,
} from "../_lib/queries";
import { CreateInstitutionForm } from "./_components/create-form";

const CreateInstitutionPage = async () => {
  const categories = await getCategories();
  const states = await getStates();
  const cities = await getCities();
  const socialPlatforms = await getSocialPlatforms();
  const paymentMethods = await getPaymentMethods();

  return (
    <SJLayout>
      <SJBreadcrumbs
        currentPage="Create Institution"
        parentPage={{
          title: "Institutions",
          href: "#",
        }}
      />
      <LayoutBody>
        <div className="mx-auto">
          <SJHeader
            title="Create Institution"
            description="Enter the following details to start creating an institution."
          />
          <CreateInstitutionForm
            categories={categories}
            states={states}
            cities={cities}
            socialPlatforms={socialPlatforms}
            paymentMethods={paymentMethods}
          />
        </div>
      </LayoutBody>
    </SJLayout>
  );
};

export default CreateInstitutionPage;

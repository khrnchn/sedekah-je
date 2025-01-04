import { SearchParams } from "@/app/types";
import { SJBreadcrumbs } from "@/components/dashboard/sj-breadcrumbs";
import { LayoutBody, SJLayout } from "@/components/dashboard/sj-layout";
import { getValidFilters } from "@/lib/data-table";
import { InstitutionsTable } from "./_components/institutions-table";
import { getCategoryCounts, getInstitutions } from "./_lib/queries";
import { searchParamsCache } from "./_lib/validations";
import { SJHeader } from "@/components/dashboard/sj-header";

interface IndexPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function InstitutionsPage(props: IndexPageProps) {
  const searchParams = await props.searchParams;
  const search = searchParamsCache.parse(searchParams);

  const validFilters = getValidFilters(search.filters);

  const promises = Promise.all([
    getInstitutions({
      ...search,
      filters: validFilters,
    }),
    getCategoryCounts(),
  ]);

  return (
    <SJLayout>
      <SJBreadcrumbs
        currentPage="List of Institutions"
        parentPage={{
          title: "Institutions",
          href: "#",
        }}
      />
      <LayoutBody>
        <div className="mx-auto">
          <SJHeader
            title="Institutions"
            description="Manage and monitor list of institutions here"
          />
          {/* <FeatureFlagsProvider> */}
          <InstitutionsTable promises={promises} />
          {/* </FeatureFlagsProvider > */}
        </div>
      </LayoutBody>
    </SJLayout>
  );
}

import { SearchParams } from "@/app/types";
import { AppSidebar } from "@/components/app-sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getValidFilters } from "@/lib/data-table";
import { InstitutionsTable } from "./_components/institutions-table";
import { getCategoryCounts, getInstitutions } from "./_lib/queries";
import { searchParamsCache } from "./_lib/validations";

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
    // TODO: extract this into a layout component
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <DashboardHeader
          currentPage="List of Institutions"
          parentPage={{
            title: "Institutions",
            href: "#",
          }}
        />
        <div className="container mx-auto p-4">
          {/* <FeatureFlagsProvider> */}
          <InstitutionsTable promises={promises} />
          {/* </FeatureFlagsProvider > */}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

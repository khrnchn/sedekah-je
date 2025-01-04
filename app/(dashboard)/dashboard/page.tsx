import { SJBreadcrumbs } from "@/components/dashboard/sj-breadcrumbs";
import { SJHeader } from "@/components/dashboard/sj-header";
import { LayoutBody, SJLayout } from "@/components/dashboard/sj-layout";
import { Hello } from "./_components/hello";
import Stats from "./_components/stats";

export default function Page() {
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
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <Hello />
            <Stats />

            {/* TODO: display other informative stuffs */}
            <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" />
          </div>
        </div>
      </LayoutBody>
    </SJLayout>
  );
}

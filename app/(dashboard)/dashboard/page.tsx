import { AppSidebar } from "@/components/app-sidebar";
import { DashboardHeader } from "@/components/dashboard/sj-breadcrumbs";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Hello } from "./_components/hello";
import Stats from "./_components/stats";

export default function Page() {
	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				<DashboardHeader
					currentPage="Home"
					parentPage={{
						title: "Dashboard",
						href: "#",
					}}
				/>
				<div className="container mx-auto p-4">
					<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
						<Hello />
						<Stats />

						{/* TODO: display other informative stuffs */}
						<div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" />
					</div>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}

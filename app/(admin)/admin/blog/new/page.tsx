import { AdminLayout } from "@/components/admin-layout";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { BlogEditorForm } from "../_components/blog-editor-form";

export default function NewBlogPostPage() {
	return (
		<SidebarProvider>
			<AppSidebar variant="inset" />
			<SidebarInset>
				<AdminLayout
					title="New Blog Post"
					description="Create a draft and publish when ready."
					breadcrumbs={[
						{ label: "Dashboard", href: "/admin/dashboard" },
						{ label: "Blog", href: "/admin/blog" },
						{ label: "New" },
					]}
				>
					<BlogEditorForm />
				</AdminLayout>
			</SidebarInset>
		</SidebarProvider>
	);
}

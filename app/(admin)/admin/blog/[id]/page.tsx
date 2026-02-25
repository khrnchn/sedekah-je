import { notFound } from "next/navigation";
import { AdminLayout } from "@/components/admin-layout";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { BlogEditorForm } from "../_components/blog-editor-form";
import {
	deleteBlogPostAction,
	publishBlogPostAction,
	unpublishBlogPostAction,
} from "../_lib/actions";
import { getAdminBlogPostById } from "../_lib/queries";

type Props = {
	params: Promise<{ id: string }>;
};

export default async function BlogPostEditPage({ params }: Props) {
	const { id } = await params;
	const postId = Number(id);
	if (!Number.isFinite(postId)) {
		notFound();
	}

	const post = await getAdminBlogPostById(postId);
	if (!post) {
		notFound();
	}

	return (
		<SidebarProvider>
			<AppSidebar variant="inset" />
			<SidebarInset>
				<AdminLayout
					title={post.title}
					description="Edit post details, content, and publishing status."
					breadcrumbs={[
						{ label: "Dashboard", href: "/admin/dashboard" },
						{ label: "Blog", href: "/admin/blog" },
						{ label: "Edit" },
					]}
				>
					<div className="mb-4 flex flex-wrap gap-2">
						<form
							action={
								post.status === "published"
									? unpublishBlogPostAction
									: publishBlogPostAction
							}
						>
							<input type="hidden" name="postId" value={post.id} />
							<Button type="submit" variant="outline">
								{post.status === "published" ? "Unpublish" : "Publish"}
							</Button>
						</form>
						<form action={deleteBlogPostAction}>
							<input type="hidden" name="postId" value={post.id} />
							<Button type="submit" variant="destructive">
								Delete
							</Button>
						</form>
					</div>
					<BlogEditorForm post={post} />
				</AdminLayout>
			</SidebarInset>
		</SidebarProvider>
	);
}

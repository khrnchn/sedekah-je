import Link from "next/link";
import { AdminLayout } from "@/components/admin-layout";
import { AppSidebar } from "@/components/app-sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { formatDate } from "@/lib/utils";
import { getAdminBlogPosts } from "./_lib/queries";

export default async function AdminBlogPage() {
	const posts = await getAdminBlogPosts();

	return (
		<SidebarProvider>
			<AppSidebar variant="inset" />
			<SidebarInset>
				<AdminLayout
					title="Blog"
					description="Manage blog posts, drafts, and publishing."
					breadcrumbs={[
						{ label: "Dashboard", href: "/admin/dashboard" },
						{ label: "Blog" },
					]}
				>
					<div className="space-y-4">
						<div className="flex justify-end">
							<Button asChild>
								<Link href="/admin/blog/new">Create Post</Link>
							</Button>
						</div>
						<Card>
							<CardHeader>
								<CardTitle>Posts</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="overflow-x-auto">
									<table className="w-full text-sm">
										<thead>
											<tr className="border-b text-left text-muted-foreground">
												<th className="py-2 pr-4">Title</th>
												<th className="py-2 pr-4">Status</th>
												<th className="py-2 pr-4">Featured</th>
												<th className="py-2 pr-4">Updated</th>
												<th className="py-2 pr-4">Published</th>
												<th className="py-2">Actions</th>
											</tr>
										</thead>
										<tbody>
											{posts.map((post) => (
												<tr key={post.id} className="border-b">
													<td className="py-2 pr-4">
														<div className="font-medium">{post.title}</div>
														<div className="text-xs text-muted-foreground">
															/{post.slug}
														</div>
													</td>
													<td className="py-2 pr-4">
														<Badge
															variant={
																post.status === "published"
																	? "default"
																	: "secondary"
															}
														>
															{post.status}
														</Badge>
													</td>
													<td className="py-2 pr-4">
														{post.featured ? "Yes" : "No"}
													</td>
													<td className="py-2 pr-4">
														{post.updatedAt ? formatDate(post.updatedAt) : "-"}
													</td>
													<td className="py-2 pr-4">
														{post.publishedAt
															? formatDate(post.publishedAt)
															: "-"}
													</td>
													<td className="py-2">
														<Button asChild variant="outline" size="sm">
															<Link href={`/admin/blog/${post.id}`}>Edit</Link>
														</Button>
													</td>
												</tr>
											))}
											{posts.length === 0 ? (
												<tr>
													<td
														className="py-8 text-center text-muted-foreground"
														colSpan={6}
													>
														No posts yet.
													</td>
												</tr>
											) : null}
										</tbody>
									</table>
								</div>
							</CardContent>
						</Card>
					</div>
				</AdminLayout>
			</SidebarInset>
		</SidebarProvider>
	);
}

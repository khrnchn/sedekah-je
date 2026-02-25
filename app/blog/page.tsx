import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/ui/header";
import { BLOG_PAGE_SIZE } from "@/lib/blog";
import { getFeaturedBlogPost, getPublishedBlogList } from "@/lib/queries/blog";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
	title: "Blog",
	description: "Updates, stories, and notes from sedekah.je.",
	alternates: {
		canonical: "https://sedekah.je/blog",
	},
};

type Props = {
	searchParams: Promise<{ page?: string }>;
};

export default async function BlogPage({ searchParams }: Props) {
	const params = await searchParams;
	const page = Number.parseInt(params.page ?? "1", 10) || 1;
	const [featured, list] = await Promise.all([
		getFeaturedBlogPost(),
		getPublishedBlogList(page, BLOG_PAGE_SIZE),
	]);

	return (
		<>
			<Header />
			<main className="mx-auto w-full max-w-5xl px-4 py-8 lg:px-6">
				<div className="mb-8">
					<h1 className="text-3xl font-bold">Blog</h1>
					<p className="mt-2 text-muted-foreground">
						Updates and stories from sedekah.je.
					</p>
				</div>

				{featured ? (
					<article className="mb-10 overflow-hidden rounded-xl border">
						{featured.coverImageUrl ? (
							<Image
								src={featured.coverImageUrl}
								alt={featured.title}
								width={1200}
								height={630}
								className="h-64 w-full object-cover"
							/>
						) : null}
						<div className="space-y-3 p-6">
							<p className="text-xs uppercase tracking-wider text-muted-foreground">
								Featured
							</p>
							<h2 className="text-2xl font-semibold">
								<Link
									href={`/blog/${featured.slug}`}
									className="hover:underline"
								>
									{featured.title}
								</Link>
							</h2>
							{featured.excerpt ? (
								<p className="text-muted-foreground">{featured.excerpt}</p>
							) : null}
							<p className="text-sm text-muted-foreground">
								{featured.publishedAt ? formatDate(featured.publishedAt) : ""}
								{featured.authorName ? ` · ${featured.authorName}` : ""}
							</p>
						</div>
					</article>
				) : null}

				<div className="grid gap-5 md:grid-cols-2">
					{list.items.map((post) => (
						<article
							key={post.id}
							className="overflow-hidden rounded-lg border"
						>
							{post.coverImageUrl ? (
								<Image
									src={post.coverImageUrl}
									alt={post.title}
									width={800}
									height={420}
									className="h-48 w-full object-cover"
								/>
							) : null}
							<div className="space-y-2 p-4">
								<h3 className="text-lg font-semibold leading-snug">
									<Link href={`/blog/${post.slug}`} className="hover:underline">
										{post.title}
									</Link>
								</h3>
								{post.excerpt ? (
									<p className="text-sm text-muted-foreground">
										{post.excerpt}
									</p>
								) : null}
								<p className="text-xs text-muted-foreground">
									{post.publishedAt ? formatDate(post.publishedAt) : ""}
									{post.authorName ? ` · ${post.authorName}` : ""}
								</p>
							</div>
						</article>
					))}
				</div>

				{list.items.length === 0 ? (
					<p className="mt-10 text-center text-muted-foreground">
						No published posts yet.
					</p>
				) : null}

				{list.totalPages > 1 ? (
					<nav className="mt-8 flex items-center justify-center gap-3">
						{list.page > 1 ? (
							<Link
								href={`/blog?page=${list.page - 1}`}
								className="rounded-md border px-3 py-2 text-sm"
							>
								Previous
							</Link>
						) : null}
						<span className="text-sm text-muted-foreground">
							Page {list.page} of {list.totalPages}
						</span>
						{list.page < list.totalPages ? (
							<Link
								href={`/blog?page=${list.page + 1}`}
								className="rounded-md border px-3 py-2 text-sm"
							>
								Next
							</Link>
						) : null}
					</nav>
				) : null}
			</main>
		</>
	);
}

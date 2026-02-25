import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogRenderer } from "@/components/blog/blog-renderer";
import { Header } from "@/components/ui/header";
import { isValidBlogDocument } from "@/lib/blog";
import {
	getPublishedBlogBySlug,
	getPublishedBlogSlugs,
} from "@/lib/queries/blog";
import { formatDate } from "@/lib/utils";

type Props = {
	params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
	const slugs = await getPublishedBlogSlugs();
	return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug } = await params;
	const post = await getPublishedBlogBySlug(slug);
	if (!post) {
		return {};
	}

	const title = post.metaTitle || post.title;
	const description =
		post.metaDescription || post.excerpt || "sedekah.je blog post";
	const ogImage =
		post.ogImageUrl ||
		post.coverImageUrl ||
		"https://sedekah.je/sedekahje-og-compressed.png";
	const canonical = `https://sedekah.je/blog/${post.slug}`;

	return {
		title,
		description,
		alternates: { canonical },
		openGraph: {
			title,
			description,
			url: canonical,
			type: "article",
			images: [{ url: ogImage }],
		},
		twitter: {
			card: "summary_large_image",
			title,
			description,
			images: [ogImage],
		},
	};
}

export default async function BlogPostPage({ params }: Props) {
	const { slug } = await params;
	const post = await getPublishedBlogBySlug(slug);

	if (!post) {
		notFound();
	}

	if (!isValidBlogDocument(post.contentJson)) {
		notFound();
	}

	return (
		<>
			<Header />
			<main className="mx-auto w-full max-w-3xl px-4 py-8 lg:px-6">
				<Link
					href="/blog"
					className="text-sm text-muted-foreground hover:underline"
				>
					← Back to blog
				</Link>

				<article className="mt-4">
					<h1 className="text-3xl font-bold leading-tight">{post.title}</h1>
					<p className="mt-3 text-sm text-muted-foreground">
						{post.publishedAt ? formatDate(post.publishedAt) : ""}
						{post.authorName ? ` · ${post.authorName}` : ""}
					</p>

					{post.coverImageUrl ? (
						<div className="my-6 overflow-hidden rounded-lg border">
							<Image
								src={post.coverImageUrl}
								alt={post.title}
								width={1200}
								height={630}
								className="h-auto w-full"
							/>
						</div>
					) : null}

					<div className="mt-8">
						<BlogRenderer content={post.contentJson} />
					</div>
				</article>
			</main>
		</>
	);
}

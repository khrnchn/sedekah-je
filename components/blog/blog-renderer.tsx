import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { BlogDocument, BlogDocumentNode } from "@/lib/blog";

type Props = {
	content: BlogDocument;
};

function renderMarks(text: string, marks: BlogDocumentNode["marks"]) {
	if (!marks || marks.length === 0) {
		return text;
	}

	return marks.reduce<ReactNode>((acc, mark, index) => {
		if (mark.type === "bold") {
			return <strong key={index}>{acc}</strong>;
		}
		if (mark.type === "italic") {
			return <em key={index}>{acc}</em>;
		}
		if (mark.type === "link") {
			const href = String(mark.attrs?.href ?? "#");
			const external =
				href.startsWith("http://") || href.startsWith("https://");
			if (external) {
				return (
					<a
						key={index}
						href={href}
						target="_blank"
						rel="noopener noreferrer"
						className="underline underline-offset-4"
					>
						{acc}
					</a>
				);
			}
			return (
				<Link key={index} href={href} className="underline underline-offset-4">
					{acc}
				</Link>
			);
		}
		return acc;
	}, text);
}

function renderInline(node: BlogDocumentNode, key: string) {
	if (node.type !== "text") {
		return null;
	}
	return <span key={key}>{renderMarks(node.text ?? "", node.marks)}</span>;
}

function renderChildren(nodes: BlogDocumentNode[] | undefined, prefix: string) {
	if (!nodes) return null;
	return nodes.map((node, index) => renderNode(node, `${prefix}-${index}`));
}

function renderNode(node: BlogDocumentNode, key: string): ReactNode {
	switch (node.type) {
		case "paragraph":
			return (
				<p key={key} className="leading-8">
					{renderChildren(node.content, key)}
				</p>
			);
		case "heading": {
			const level = Number(node.attrs?.level ?? 2);
			if (level === 3) {
				return (
					<h3 key={key} className="text-xl font-semibold mt-6 mb-3">
						{renderChildren(node.content, key)}
					</h3>
				);
			}
			return (
				<h2 key={key} className="text-2xl font-semibold mt-8 mb-4">
					{renderChildren(node.content, key)}
				</h2>
			);
		}
		case "blockquote":
			return (
				<blockquote
					key={key}
					className="border-l-4 pl-4 italic text-muted-foreground"
				>
					{renderChildren(node.content, key)}
				</blockquote>
			);
		case "bulletList":
			return (
				<ul key={key} className="list-disc pl-6 space-y-2">
					{renderChildren(node.content, key)}
				</ul>
			);
		case "orderedList":
			return (
				<ol key={key} className="list-decimal pl-6 space-y-2">
					{renderChildren(node.content, key)}
				</ol>
			);
		case "listItem":
			return <li key={key}>{renderChildren(node.content, key)}</li>;
		case "codeBlock": {
			const codeText =
				node.content?.map((child) => child.text ?? "").join("\n") ?? "";
			return (
				<pre
					key={key}
					className="overflow-x-auto rounded-md bg-muted p-4 text-sm"
				>
					<code>{codeText}</code>
				</pre>
			);
		}
		case "horizontalRule":
			return <hr key={key} className="my-8" />;
		case "image": {
			const src = String(node.attrs?.src ?? "");
			const alt = String(node.attrs?.alt ?? "Blog image");
			if (!src) return null;
			return (
				<div key={key} className="my-6">
					<Image
						src={src}
						alt={alt}
						width={1200}
						height={630}
						className="h-auto w-full rounded-md border"
					/>
				</div>
			);
		}
		case "text":
			return renderInline(node, key);
		default:
			return null;
	}
}

export function BlogRenderer({ content }: Props) {
	if (!content?.content?.length) {
		return <p className="text-muted-foreground">No content yet.</p>;
	}

	return (
		<div className="space-y-4">
			{content.content.map((node, index) => renderNode(node, `node-${index}`))}
		</div>
	);
}

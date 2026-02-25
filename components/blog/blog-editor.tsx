"use client";

import Blockquote from "@tiptap/extension-blockquote";
import Bold from "@tiptap/extension-bold";
import BulletList from "@tiptap/extension-bullet-list";
import CodeBlock from "@tiptap/extension-code-block";
import Document from "@tiptap/extension-document";
import Heading from "@tiptap/extension-heading";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Image from "@tiptap/extension-image";
import Italic from "@tiptap/extension-italic";
import Link from "@tiptap/extension-link";
import ListItem from "@tiptap/extension-list-item";
import OrderedList from "@tiptap/extension-ordered-list";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import { EditorContent, useEditor } from "@tiptap/react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import type { BlogDocument } from "@/lib/blog";
import { cn } from "@/lib/utils";

type Props = {
	value: BlogDocument;
	onChange: (value: BlogDocument) => void;
	onUploadImage: (file: File) => Promise<string>;
	className?: string;
};

export function BlogEditor({
	value,
	onChange,
	onUploadImage,
	className,
}: Props) {
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const editor = useEditor({
		immediatelyRender: false,
		extensions: [
			Document,
			Paragraph,
			Text,
			Bold,
			Italic,
			Heading.configure({ levels: [2, 3] }),
			BulletList,
			OrderedList,
			ListItem,
			Blockquote,
			CodeBlock,
			HorizontalRule,
			Image.configure({ allowBase64: false }),
			Link.configure({
				autolink: true,
				openOnClick: false,
				HTMLAttributes: {
					target: "_blank",
					rel: "noopener noreferrer",
				},
			}),
		],
		content: value,
		onUpdate: ({ editor: currentEditor }) => {
			onChange(currentEditor.getJSON() as BlogDocument);
		},
		editorProps: {
			attributes: {
				class:
					"min-h-[320px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none",
			},
		},
	});

	async function handleImageUpload(file: File | null) {
		if (!editor || !file) return;
		const imageUrl = await onUploadImage(file);
		editor.chain().focus().setImage({ src: imageUrl, alt: file.name }).run();
	}

	if (!editor) {
		return <div className="min-h-[320px] rounded-md border border-dashed" />;
	}

	return (
		<div className={cn("space-y-3", className)}>
			<div className="flex flex-wrap gap-2">
				<Button
					type="button"
					size="sm"
					variant={
						editor.isActive("heading", { level: 2 }) ? "default" : "outline"
					}
					onClick={() =>
						editor.chain().focus().toggleHeading({ level: 2 }).run()
					}
				>
					H2
				</Button>
				<Button
					type="button"
					size="sm"
					variant={
						editor.isActive("heading", { level: 3 }) ? "default" : "outline"
					}
					onClick={() =>
						editor.chain().focus().toggleHeading({ level: 3 }).run()
					}
				>
					H3
				</Button>
				<Button
					type="button"
					size="sm"
					variant={editor.isActive("bold") ? "default" : "outline"}
					onClick={() => editor.chain().focus().toggleBold().run()}
				>
					Bold
				</Button>
				<Button
					type="button"
					size="sm"
					variant={editor.isActive("italic") ? "default" : "outline"}
					onClick={() => editor.chain().focus().toggleItalic().run()}
				>
					Italic
				</Button>
				<Button
					type="button"
					size="sm"
					variant={editor.isActive("bulletList") ? "default" : "outline"}
					onClick={() => editor.chain().focus().toggleBulletList().run()}
				>
					List
				</Button>
				<Button
					type="button"
					size="sm"
					variant={editor.isActive("orderedList") ? "default" : "outline"}
					onClick={() => editor.chain().focus().toggleOrderedList().run()}
				>
					Numbered
				</Button>
				<Button
					type="button"
					size="sm"
					variant={editor.isActive("blockquote") ? "default" : "outline"}
					onClick={() => editor.chain().focus().toggleBlockquote().run()}
				>
					Quote
				</Button>
				<Button
					type="button"
					size="sm"
					variant={editor.isActive("codeBlock") ? "default" : "outline"}
					onClick={() => editor.chain().focus().toggleCodeBlock().run()}
				>
					Code
				</Button>
				<Button
					type="button"
					size="sm"
					variant="outline"
					onClick={() => editor.chain().focus().setHorizontalRule().run()}
				>
					Divider
				</Button>
				<Button
					type="button"
					size="sm"
					variant="outline"
					onClick={() => fileInputRef.current?.click()}
				>
					Image
				</Button>
				<input
					hidden
					type="file"
					accept="image/*"
					ref={fileInputRef}
					onChange={async (event) => {
						await handleImageUpload(event.target.files?.[0] ?? null);
						event.target.value = "";
					}}
				/>
			</div>
			<EditorContent
				editor={editor}
				className={cn(
					"[&_h2]:mt-6 [&_h2]:text-2xl [&_h2]:font-semibold",
					"[&_h3]:mt-5 [&_h3]:text-xl [&_h3]:font-semibold",
					"[&_blockquote]:border-l-4 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground",
					"[&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6",
					"[&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-6",
					"[&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-3",
					"[&_hr]:my-5",
					"[&_img]:my-4 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-md [&_img]:border",
				)}
			/>
		</div>
	);
}

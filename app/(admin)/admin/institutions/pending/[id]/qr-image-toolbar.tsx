"use client";

import { Button } from "@/components/ui/button";
import { CopyIcon, DownloadIcon } from "@/components/ui/icons";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
	imageUrl: string;
}

export default function QrImageToolbar({ imageUrl }: Props) {
	const [copying, setCopying] = useState(false);

	async function copyImage() {
		try {
			setCopying(true);
			const res = await fetch(imageUrl);
			const blob = await res.blob();
			// @ts-ignore - ClipboardItem is still experimental typings
			await navigator.clipboard.write([
				new ClipboardItem({ [blob.type]: blob }),
			]);
			toast.success("Image copied to clipboard");
		} catch (e) {
			console.error(e);
			toast.error("Unable to copy image");
		} finally {
			setCopying(false);
		}
	}

	return (
		<div className="flex gap-2 mt-2">
			<Button
				variant="outline"
				size="icon"
				onClick={copyImage}
				disabled={copying}
				title="Copy image to clipboard"
			>
				<CopyIcon width={16} height={16} />
			</Button>
			<a href={imageUrl} download target="_blank" rel="noopener noreferrer">
				<Button variant="outline" size="icon" title="Download image">
					<DownloadIcon width={16} height={16} />
				</Button>
			</a>
			<Button
				variant="outline"
				size="icon"
				onClick={() => window.open(imageUrl, "_blank")?.focus()}
				title="Open full size"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M14 3h7v7" />
					<path d="M3 10l11-11" />
					<path d="M10 21H3v-7" />
					<path d="M14 14l7 7" />
				</svg>
			</Button>
			<Button
				variant="outline"
				size="icon"
				onClick={() =>
					window
						.open(
							`https://qrcoderaptor.com/?img=${encodeURIComponent(imageUrl)}`,
							"_blank",
						)
						?.focus()
				}
				title="Open in QRaptor"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M3 3h18v18H3z" />
					<path d="M7 7h10v10H7z" />
					<path d="M21 21l-6-6" />
				</svg>
			</Button>
		</div>
	);
}

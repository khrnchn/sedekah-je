"use client";

import { Copy, Download, Maximize2, ScanQrCode } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

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
		<div className="flex flex-wrap justify-center gap-2">
			<Button
				variant="outline"
				size="icon"
				onClick={copyImage}
				disabled={copying}
				aria-label="Copy image to clipboard"
				title="Copy image to clipboard"
			>
				<Copy className="h-4 w-4" />
			</Button>
			<Button
				asChild
				variant="outline"
				size="icon"
				aria-label="Download image"
				title="Download image"
			>
				<a href={imageUrl} download target="_blank" rel="noopener noreferrer">
					<Download className="h-4 w-4" />
				</a>
			</Button>
			<Button
				variant="outline"
				size="icon"
				onClick={() => window.open(imageUrl, "_blank")?.focus()}
				aria-label="Open image full size"
				title="Open image full size"
			>
				<Maximize2 className="h-4 w-4" />
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
				aria-label="Decode with QRaptor"
				title="Decode with QRaptor"
			>
				<ScanQrCode className="h-4 w-4" />
			</Button>
		</div>
	);
}

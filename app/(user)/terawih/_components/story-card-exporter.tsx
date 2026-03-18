"use client";

import html2canvas from "html2canvas";
import { Download, Share2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type StoryCardExporterProps = {
	fileName: string;
	children: React.ReactNode;
};

export function StoryCardExporter({
	fileName,
	children,
}: StoryCardExporterProps) {
	const cardRef = useRef<HTMLDivElement | null>(null);
	const [isExporting, setIsExporting] = useState(false);

	const exportCanvas = async () => {
		if (!cardRef.current) {
			throw new Error("Kad tidak tersedia untuk dieksport.");
		}

		return html2canvas(cardRef.current, {
			backgroundColor: null,
			scale: 3,
			useCORS: true,
		});
	};

	const downloadImage = async () => {
		try {
			setIsExporting(true);
			const canvas = await exportCanvas();
			const link = document.createElement("a");
			link.href = canvas.toDataURL("image/png");
			link.download = `${fileName}.png`;
			link.click();
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Gagal memuat turun kad.",
			);
		} finally {
			setIsExporting(false);
		}
	};

	const nativeShare = async () => {
		try {
			setIsExporting(true);
			const canvas = await exportCanvas();
			const blob = await new Promise<Blob | null>((resolve) =>
				canvas.toBlob(resolve, "image/png"),
			);

			if (!blob) {
				throw new Error("Gagal menjana imej.");
			}

			const file = new File([blob], `${fileName}.png`, { type: "image/png" });

			if (
				navigator.share &&
				navigator.canShare &&
				navigator.canShare({ files: [file] })
			) {
				await navigator.share({
					title: "Terawih Session",
					text: "Kad sesi tarawih saya di SedekahJe.",
					files: [file],
				});
				return;
			}

			await downloadImage();
		} catch (error) {
			if ((error as Error).name === "AbortError") return;
			toast.error(
				error instanceof Error ? error.message : "Gagal berkongsi kad.",
			);
		} finally {
			setIsExporting(false);
		}
	};

	return (
		<div className="space-y-4">
			<div className="mx-auto max-w-[360px]">
				<div ref={cardRef} className="aspect-[9/16] w-full">
					{children}
				</div>
			</div>
			<div className="flex flex-wrap justify-center gap-3">
				<Button onClick={nativeShare} disabled={isExporting}>
					<Share2 className="mr-2 h-4 w-4" />
					{isExporting ? "Menjana..." : "Kongsi Imej"}
				</Button>
				<Button
					variant="outline"
					onClick={downloadImage}
					disabled={isExporting}
				>
					<Download className="mr-2 h-4 w-4" />
					Simpan PNG
				</Button>
			</div>
		</div>
	);
}

"use client";

import { toPng } from "html-to-image";
import { Download, Palette, Share2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { StoryCardTheme } from "./terawih-story-card";
import {
	TerawihSessionStoryCard,
	TerawihWrappedStoryCard,
} from "./terawih-story-card";

const THEME_OPTIONS: { value: StoryCardTheme; label: string; color: string }[] =
	[
		{ value: "ember", label: "Ember", color: "#f97316" },
		{ value: "emerald", label: "Emerald", color: "#10b981" },
		{ value: "midnight", label: "Midnight", color: "#3b82f6" },
		{ value: "sand", label: "Sand", color: "#a0774a" },
	];

function ExportControls({
	cardRef,
	fileName,
	isExporting,
	setIsExporting,
	theme,
	setTheme,
}: {
	cardRef: React.RefObject<HTMLDivElement | null>;
	fileName: string;
	isExporting: boolean;
	setIsExporting: (v: boolean) => void;
	theme: StoryCardTheme;
	setTheme: (v: StoryCardTheme) => void;
}) {
	const exportPng = async () => {
		if (!cardRef.current) {
			throw new Error("Kad tidak tersedia untuk dieksport.");
		}

		return toPng(cardRef.current, {
			pixelRatio: 3,
			cacheBust: true,
		});
	};

	const downloadImage = async () => {
		try {
			setIsExporting(true);
			const dataUrl = await exportPng();
			const link = document.createElement("a");
			link.href = dataUrl;
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
			const dataUrl = await exportPng();
			const res = await fetch(dataUrl);
			const blob = await res.blob();
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
		<>
			<div className="flex items-center justify-center gap-2">
				<Palette className="h-4 w-4 text-muted-foreground" />
				{THEME_OPTIONS.map((opt) => (
					<button
						key={opt.value}
						type="button"
						onClick={() => setTheme(opt.value)}
						className="relative h-7 w-7 rounded-full transition-transform hover:scale-110"
						style={{
							backgroundColor: opt.color,
							outline:
								theme === opt.value
									? `2px solid ${opt.color}`
									: "2px solid transparent",
							outlineOffset: 2,
						}}
						title={opt.label}
					/>
				))}
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
		</>
	);
}

type SessionExporterProps = {
	fileName: string;
	mosqueName: string;
	sessionDate: string;
	ramadanStartDate?: string | null;
	startTime: string;
	endTime: string;
	durationMinutes: number;
	averageMpr: number;
	rakaat: number;
};

export function SessionStoryCardExporter(props: SessionExporterProps) {
	const cardRef = useRef<HTMLDivElement | null>(null);
	const [isExporting, setIsExporting] = useState(false);
	const [theme, setTheme] = useState<StoryCardTheme>("ember");

	return (
		<div className="space-y-4">
			<div className="mx-auto max-w-[360px]">
				<div ref={cardRef} style={{ aspectRatio: "9/16", width: "100%" }}>
					<TerawihSessionStoryCard
						mosqueName={props.mosqueName}
						sessionDate={props.sessionDate}
						ramadanStartDate={props.ramadanStartDate}
						startTime={props.startTime}
						endTime={props.endTime}
						durationMinutes={props.durationMinutes}
						averageMpr={props.averageMpr}
						rakaat={props.rakaat}
						theme={theme}
					/>
				</div>
			</div>
			<ExportControls
				cardRef={cardRef}
				fileName={props.fileName}
				isExporting={isExporting}
				setIsExporting={setIsExporting}
				theme={theme}
				setTheme={setTheme}
			/>
		</div>
	);
}

type WrappedExporterProps = {
	fileName: string;
	year: number;
	totalNights: number;
	totalMinutes: number;
	totalRakaat: number;
	averageMpr: number;
	bestStreak: number;
	topMosque: string | null;
};

export function WrappedStoryCardExporter(props: WrappedExporterProps) {
	const cardRef = useRef<HTMLDivElement | null>(null);
	const [isExporting, setIsExporting] = useState(false);
	const [theme, setTheme] = useState<StoryCardTheme>("ember");

	return (
		<div className="space-y-4">
			<div className="mx-auto max-w-[360px]">
				<div ref={cardRef} style={{ aspectRatio: "9/16", width: "100%" }}>
					<TerawihWrappedStoryCard
						year={props.year}
						totalNights={props.totalNights}
						totalMinutes={props.totalMinutes}
						totalRakaat={props.totalRakaat}
						averageMpr={props.averageMpr}
						bestStreak={props.bestStreak}
						topMosque={props.topMosque}
						theme={theme}
					/>
				</div>
			</div>
			<ExportControls
				cardRef={cardRef}
				fileName={props.fileName}
				isExporting={isExporting}
				setIsExporting={setIsExporting}
				theme={theme}
				setTheme={setTheme}
			/>
		</div>
	);
}

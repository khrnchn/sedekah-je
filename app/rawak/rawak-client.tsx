"use client";

import { AnimatePresence, motion } from "framer-motion";
import html2canvas from "html2canvas";
import {
	Clipboard,
	Download,
	Filter,
	Loader2,
	MapPin,
	QrCode,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { Institution as OldInstitution } from "@/app/types/institutions";
import FilterCategory from "@/components/filter-category";
import FilterState from "@/components/filter-state";
import FilteredCount from "@/components/filtered-count";
import GetdoaFooter from "@/components/getdoa-footer";
import QrCodeDisplay from "@/components/institution/qr-code-display";
import PageFooter from "@/components/layout/page-footer";
import PageHeader from "@/components/layout/page-header";
import { Header } from "@/components/shared/header";
import PageSection from "@/components/shared/page-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Drawer,
	DrawerContent,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import type { Institution } from "@/db/schema";
import useClientDimensions from "@/hooks/use-client-dimensions";
import {
	type CanonicalInstitutionCategory,
	normalizeInstitutionCategory,
} from "@/lib/institution-categories";
import { getBaseUrl, removeDuplicateInstitutions, slugify } from "@/lib/utils";

type Props = {
	initialInstitutions: Institution[];
};
type NormalizedInstitution = Omit<OldInstitution, "category"> & {
	category: CanonicalInstitutionCategory;
};

export function RawakClient({ initialInstitutions }: Props) {
	const [randomInstitution, setRandomInstitution] =
		useState<NormalizedInstitution | null>(null);
	const [selectedCategories, setSelectedCategories] = useState<
		CanonicalInstitutionCategory[]
	>([]);
	const [selectedState, setSelectedState] = useState<string>("");
	const { width } = useClientDimensions();
	const [url, setUrl] = useState<string>("");
	const printRef = useRef<HTMLButtonElement>(null);
	const [isDownloading, setIsDownloading] = useState(false);
	const [downloadStage, setDownloadStage] = useState<string>("");

	// Adapt DB institutions to component-compatible format
	const institutions = useMemo(() => {
		const adapted = initialInstitutions.map((inst) => ({
			...inst,
			category: normalizeInstitutionCategory(inst.category),
			description: inst.description || undefined,
			supportedPayment: inst.supportedPayment || undefined,
			coords: inst.coords || undefined,
			qrImage: inst.qrImage || "",
		})) as NormalizedInstitution[];
		return removeDuplicateInstitutions(adapted);
	}, [initialInstitutions]);

	const activeFilterCount =
		selectedCategories.length + (selectedState !== "" ? 1 : 0);

	const filteredInstitutions = useMemo(() => {
		return institutions.filter((institution) => {
			const matchesCategory =
				selectedCategories.length === 0 ||
				selectedCategories.includes(institution.category);
			const matchesState =
				selectedState === "" || institution.state === selectedState;
			return matchesCategory && matchesState;
		});
	}, [institutions, selectedCategories, selectedState]);

	const getInstitutionSlug = useCallback((inst: NormalizedInstitution) => {
		return inst.slug ?? slugify(inst.name);
	}, []);

	const generateRandomNumber = useCallback(() => {
		if (filteredInstitutions.length > 0) {
			const randomNumber = Math.floor(
				Math.random() * filteredInstitutions.length,
			);
			const selected = filteredInstitutions[randomNumber];
			setRandomInstitution(selected);
			const slug = getInstitutionSlug(selected);
			setUrl(`https://www.sedekah.je/${selected.category}/${slug}`);
		}
	}, [filteredInstitutions, getInstitutionSlug]);

	const handleCopy = useCallback(() => {
		if (!url) return;

		navigator.clipboard
			.writeText(url)
			.then(() =>
				toast.success("Pautan institusi telah disalin ke papan klipboard."),
			)
			.catch(() => toast.error("Gagal menyalin pautan. Sila cuba lagi."));
	}, [url]);

	const handleMapOpen = useCallback(() => {
		if (!randomInstitution) return;

		const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
			randomInstitution.name,
		)}`;

		window.open(mapUrl, "_blank", "noopener,noreferrer");
		toast.success("Peta dibuka dalam tab baru.");
	}, [randomInstitution]);

	return (
		<>
			<Header />

			{/* Loading Overlay for Mobile */}
			<AnimatePresence>
				{isDownloading && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-50 flex h-full w-full flex-col items-center justify-center bg-foreground/50"
					>
						<div className="flex w-full max-w-xs flex-col items-center gap-4 rounded-lg border bg-card p-6 shadow-lg">
							<div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
							<p className="text-center font-medium">Memuat turun kod QR...</p>
							<p className="text-center text-sm text-muted-foreground">
								{downloadStage || "Sila tunggu sebentar"}
							</p>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			<PageSection className="bg-background transition-colors duration-200 ease-in-out">
				<PageHeader pageTitle="Sedekah Rawak" showHeader={false} />

				{/* Desktop (sm+): inline filter UI */}
				<div className="hidden rounded-lg border bg-background/95 p-3 sm:block">
					<FilterCategory
						onCategoryChange={(categories) => {
							setSelectedCategories(
								categories.map((category) =>
									normalizeInstitutionCategory(category),
								),
							);
							setRandomInstitution(null);
						}}
						selectedState={selectedState}
						institutions={institutions}
					/>
					<div className="mt-3 flex w-full flex-row items-center gap-3">
						<div className="w-2/5">
							<FilterState
								onStateChange={(state) => {
									setSelectedState(state);
									setRandomInstitution(null);
								}}
							/>
						</div>
						<div className="w-3/5">
							<Button
								onClick={generateRandomNumber}
								className="w-full gap-2"
								disabled={isDownloading}
							>
								<QrCode className="h-4 w-4" />
								Jana QR Secara Rawak
							</Button>
						</div>
					</div>
					{(selectedState !== "" || selectedCategories.length > 0) && (
						<FilteredCount count={filteredInstitutions.length} />
					)}
				</div>

				{/* Mobile (<sm): compact row + filter drawer */}
				<div className="space-y-2 sm:hidden">
					<div className="flex w-full items-center gap-2 rounded-lg border bg-background/95 p-2">
						<div className="flex-1 min-w-0">
							<Button
								onClick={generateRandomNumber}
								className="w-full gap-2"
								disabled={isDownloading}
							>
								<QrCode className="h-4 w-4" />
								Jana Rawak
							</Button>
						</div>
						<Drawer>
							<DrawerTrigger asChild>
								<Button
									variant="outline"
									size="default"
									className="shrink-0 flex items-center gap-2"
								>
									<Filter className="h-4 w-4" />
									<span>Filter</span>
									{activeFilterCount > 0 && (
										<Badge
											variant="secondary"
											className="ml-0.5 h-5 min-w-5 px-1.5"
										>
											{activeFilterCount}
										</Badge>
									)}
								</Button>
							</DrawerTrigger>
							<DrawerContent className="max-h-[85vh] flex flex-col">
								<DrawerHeader>
									<DrawerTitle>Filter</DrawerTitle>
								</DrawerHeader>
								<div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
									<FilterState
										onStateChange={(state) => {
											setSelectedState(state);
											setRandomInstitution(null);
										}}
									/>
									<FilterCategory
										onCategoryChange={(categories) => {
											setSelectedCategories(
												categories.map((category) =>
													normalizeInstitutionCategory(category),
												),
											);
											setRandomInstitution(null);
										}}
										selectedState={selectedState}
										institutions={institutions}
									/>
								</div>
								{(selectedState !== "" || selectedCategories.length > 0) && (
									<DrawerFooter>
										<FilteredCount count={filteredInstitutions.length} />
									</DrawerFooter>
								)}
							</DrawerContent>
						</Drawer>
					</div>
				</div>

				<div className="flex flex-col gap-8 pb-4 md:flex-row">
					<Card className="w-full border-border/80 bg-card">
						{randomInstitution ? (
							<div className="flex flex-col items-center p-6">
								<div className="mb-6">
									{randomInstitution.qrContent ? (
										<QrCodeDisplay
											qrContent={randomInstitution.qrContent}
											supportedPayment={randomInstitution.supportedPayment}
											size={width < 300 ? width - 40 : 260}
											ref={printRef}
										/>
									) : (
										<Image
											priority
											width={260}
											height={260}
											src={randomInstitution.qrImage}
											alt={randomInstitution.name}
											className="rounded-lg object-cover object-top"
										/>
									)}
								</div>
								<div className="w-full">
									<h3 className="text-xl font-semibold mb-2 text-center">
										{randomInstitution.name}
									</h3>
									<div className="mb-4 flex items-center justify-center text-sm text-muted-foreground">
										<MapPin className="w-4 h-4 mr-1" />
										<span>
											{randomInstitution.city}, {randomInstitution.state}
										</span>
									</div>
									<div className="mt-4 flex w-full justify-between gap-2">
										<Button
											variant="outline"
											className="flex-1"
											// onClick={handleDownload}
											disabled={isDownloading}
											onClick={async (e) => {
												e.stopPropagation();
												setIsDownloading(true);
												setDownloadStage("Menyediakan kod QR...");
												const instSlug = getInstitutionSlug(randomInstitution);
												try {
													// Create a temporary iframe to load the QR page
													const iframe = document.createElement("iframe");
													iframe.style.visibility = "hidden";
													iframe.style.position = "fixed";
													iframe.style.right = "0";
													iframe.style.bottom = "0";
													iframe.width = "600px";
													iframe.height = "600px";

													// Set the source to the QR page URL
													const qrPageUrl = `${getBaseUrl()}/qr/${instSlug}`;
													iframe.src = qrPageUrl;

													document.body.appendChild(iframe);

													// Wait for iframe to load and ensure content is fully rendered
													await new Promise((resolve) => {
														iframe.onload = () => {
															setDownloadStage("Memuatkan halaman kod QR...");
															setTimeout(() => resolve(null), 1000);
														};
													});

													// Capture the iframe content
													setDownloadStage("Mengambil gambar kod QR...");
													const canvas = await html2canvas(
														iframe.contentDocument?.body as HTMLElement,
														{
															useCORS: true,
															allowTaint: true,
															backgroundColor: "#ffffff",
															scale: 2,
															logging: true,
														},
													);

													// Convert to downloadable image
													setDownloadStage(
														"Menyediakan fail untuk dimuat turun...",
													);
													const data = canvas.toDataURL("image/png");
													const link = document.createElement("a");
													link.href = data;
													link.download = `sedekahje-${instSlug}.png`;
													document.body.appendChild(link);
													link.click();

													// Cleanup
													document.body.removeChild(link);
													document.body.removeChild(iframe);

													toast.success("Berjaya memuat turun kod QR.");
												} catch (error) {
													console.error("Download error:", error);
													toast.error("Gagal memuat turun kod QR.");

													// Fallback to direct QR code capture if iframe method fails
													try {
														setDownloadStage("Mencuba kaedah alternatif...");
														const element = printRef.current;
														if (!element) return;

														const canvas = await html2canvas(element, {
															useCORS: true,
															allowTaint: true,
															backgroundColor: "#ffffff",
															scale: 2,
														});

														setDownloadStage(
															"Menyediakan fail untuk dimuat turun...",
														);
														const data = canvas.toDataURL("image/png");
														const link = document.createElement("a");
														link.href = data;
														link.download = `sedekahje-${instSlug}.png`;
														document.body.appendChild(link);
														link.click();
														document.body.removeChild(link);

														toast.success(
															"Berjaya memuat turun kod QR (kaedah alternatif).",
														);
													} catch (fallbackError) {
														console.error(
															"Fallback download error:",
															fallbackError,
														);
														toast.error(
															"Gagal memuat turun kod QR dengan kedua-dua kaedah.",
														);
													}
												} finally {
													setIsDownloading(false);
													setDownloadStage("");
												}
											}}
										>
											{isDownloading ? (
												<Loader2 size={16} className="mr-2 animate-spin" />
											) : (
												<Download size={16} className="mr-2" />
											)}
											<span className="text-xs font-medium">
												{isDownloading ? "Memuat Turun..." : "Muat Turun"}
											</span>
										</Button>
										<Button
											variant="outline"
											className="flex-1"
											onClick={handleCopy}
											disabled={isDownloading}
										>
											<Clipboard size={16} className="mr-2" />
											<span className="text-xs font-medium">Salin</span>
										</Button>
										<Button
											variant="outline"
											className="flex-1"
											onClick={handleMapOpen}
											disabled={isDownloading}
										>
											<MapPin size={16} className="mr-2" />
											<span className="text-xs font-medium">Peta</span>
										</Button>
									</div>
								</div>
							</div>
						) : (
							<div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-lg bg-muted/60 p-8 transition-colors duration-200">
								<QrCode size={48} className="text-muted-foreground/70 mb-4" />
								<p className="mb-6 text-center text-base text-muted-foreground">
									Klik butang untuk menjana kod QR rawak.
								</p>
							</div>
						)}
					</Card>
				</div>
				<GetdoaFooter />
				<PageFooter />
			</PageSection>
		</>
	);
}

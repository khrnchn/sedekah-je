"use client";

import { AnimatePresence, motion } from "framer-motion";
import html2canvas from "html2canvas";
import { Clipboard, Download, Loader2, MapPin, QrCode } from "lucide-react";
import Image from "next/image";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { Institution as OldInstitution } from "@/app/types/institutions";
import FilterCategory from "@/components/filter-category";
import FilterState from "@/components/filter-state";
import FilteredCount from "@/components/filtered-count";
import GetdoaFooter from "@/components/getdoa-footer";
import PageFooter from "@/components/page-footer";
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/ui/header";
import PageSection from "@/components/ui/pageSection";
import QrCodeDisplay from "@/components/ui/qrCodeDisplay";
import type { Institution } from "@/db/schema";
import useClientDimensions from "@/hooks/use-client-dimensions";
import { getBaseUrl, removeDuplicateInstitutions, slugify } from "@/lib/utils";

type Props = {
	initialInstitutions: Institution[];
};

export function RawakClient({ initialInstitutions }: Props) {
	const [randomInstitution, setRandomInstitution] =
		useState<OldInstitution | null>(null);
	const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
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
			description: inst.description || undefined,
			supportedPayment: inst.supportedPayment || undefined,
			coords: inst.coords || undefined,
			qrImage: inst.qrImage || "",
		})) as OldInstitution[];
		return removeDuplicateInstitutions(adapted);
	}, [initialInstitutions]);

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

	const getInstitutionSlug = useCallback((inst: OldInstitution) => {
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
						className="fixed inset-0 h-full w-full z-50 bg-black/50 flex flex-col items-center justify-center"
					>
						<div className="bg-card rounded-lg p-6 max-w-xs w-full flex flex-col items-center gap-4 border shadow-lg">
							<div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
							<p className="text-center font-medium">Memuat turun kod QR...</p>
							<p className="text-center text-sm text-gray-500 dark:text-gray-400">
								{downloadStage || "Sila tunggu sebentar"}
							</p>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			<PageSection className="bg-background transition-colors duration-200 ease-in-out">
				<PageHeader pageTitle="Sedekah Rawak" showHeader={false} />

				<FilterCategory
					onCategoryChange={(categories) => {
						setSelectedCategories(categories);
						setRandomInstitution(null);
					}}
					selectedState={selectedState}
					institutions={institutions}
				/>
				<div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full">
					<div className="w-full sm:w-2/5">
						<FilterState
							onStateChange={(state) => {
								setSelectedState(state);
								setRandomInstitution(null);
							}}
						/>
					</div>
					<div className="w-full sm:w-3/5">
						<Button
							onClick={generateRandomNumber}
							className="w-full bg-green-500 text-white px-6 py-3 hover:bg-green-600 transition-colors duration-300 shadow-md focus:outline-none"
							disabled={isDownloading}
						>
							🎲 Jana QR Secara Rawak
						</Button>
					</div>
				</div>

				{/* Rendered only when there are filters applied */}
				{(selectedState !== "" || selectedCategories.length > 0) && (
					<FilteredCount count={filteredInstitutions.length} />
				)}

				<div className="flex flex-col md:flex-row gap-8 pb-4">
					<Card className="w-full">
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
									<div className="flex items-center justify-center text-sm text-gray-600 dark:text-gray-400 mb-4">
										<MapPin className="w-4 h-4 mr-1" />
										<span>
											{randomInstitution.city}, {randomInstitution.state}
										</span>
									</div>
									<div className="flex justify-between space-x-2 w-full mt-4">
										<Button
											className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 px-3 py-2 rounded-md transition-all duration-200 ease-in-out flex items-center justify-center"
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
											className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 px-3 py-2 rounded-md transition-all duration-200 ease-in-out flex items-center justify-center"
											onClick={handleCopy}
											disabled={isDownloading}
										>
											<Clipboard size={16} className="mr-2" />
											<span className="text-xs font-medium">Salin</span>
										</Button>
										<Button
											className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 px-3 py-2 rounded-md transition-all duration-200 ease-in-out flex items-center justify-center"
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
							<div className="flex flex-col items-center justify-center h-full min-h-[300px] bg-muted rounded-lg p-8 transition-colors duration-200">
								<QrCode size={48} className="text-muted-foreground/70 mb-4" />
								<p className="text-muted-foreground text-lg mb-6 text-center">
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

"use client";

import { institutions as rawInstitutions } from "@/app/data/institutions";
import type { Institution } from "@/app/types/institutions";
import FilterCategory from "@/components/filter-category";
import FilterState from "@/components/filter-state";
import FilteredCount from "@/components/filtered-count";
import GetdoaFooter from "@/components/getdoa-footer";
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/ui/header";
import PageSection from "@/components/ui/pageSection";
import QrCodeDisplay from "@/components/ui/qrCodeDisplay";
import useClientDimensions from "@/hooks/use-client-dimensions";
import { removeDuplicateInstitutions, slugify } from "@/lib/utils";
import html2canvas from "html2canvas";
import { Clipboard, Download, Loader2, MapPin, QrCode } from "lucide-react";
import Image from "next/image";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import PageFooter from "@/components/page-footer";
import { AnimatePresence, motion } from "framer-motion";

const Rawak = () => {
	const cardRef = useRef<HTMLDivElement>(null);
	const [randomInstitution, setRandomInstitution] =
		useState<Institution | null>(null);
	const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
	const [selectedState, setSelectedState] = useState<string>("");
	const { width } = useClientDimensions();
	const [url, setUrl] = useState<string>("");
	const printRef = useRef<HTMLButtonElement>(null);
	const [isDownloading, setIsDownloading] = useState(false);
	const [downloadStage, setDownloadStage] = useState<string>("");

	const institutions = removeDuplicateInstitutions(rawInstitutions);

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

	const generateRandomNumber = useCallback(() => {
		if (filteredInstitutions.length > 0) {
			const randomNumber = Math.floor(
				Math.random() * filteredInstitutions.length,
			);
			setRandomInstitution(filteredInstitutions[randomNumber]);
			const category = filteredInstitutions[randomNumber].category;
			const slug = slugify(filteredInstitutions[randomNumber].name);

			setUrl(`https://www.sedekah.je/${category}/${slug}`);

			cardRef.current?.scrollIntoView({ behavior: "smooth" });
		}
	}, [filteredInstitutions]);

	const handleDownload = useCallback(async () => {
		if (!randomInstitution) return;

		setIsDownloading(true);
		setDownloadStage("Menyediakan kod QR...");

		// Define the direct capture method
		async function handleDirectCapture() {
			setDownloadStage("Mengambil gambar kod QR secara langsung...");
			if (!printRef.current) {
				throw new Error("QR element not found");
			}

			if (!randomInstitution) {
				throw new Error("No institution selected");
			}

			const element = printRef.current;
			const canvas = await html2canvas(element, {
				useCORS: true,
				allowTaint: true,
				backgroundColor: "#ffffff",
				scale: 2,
			});

			setDownloadStage("Menyediakan fail untuk dimuat turun...");
			const data = canvas.toDataURL("image/png");
			const link = document.createElement("a");
			link.href = data;
			link.download = `sedekahje-${slugify(randomInstitution.name)}.png`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);

			toast.success("Berjaya memuat turun kod QR.");
		}

		// Define the iframe method as a fallback only for desktop browsers
		async function handleIframeCapture() {
			if (!randomInstitution) {
				throw new Error("No institution selected");
			}

			// Create a temporary iframe to load the QR page
			const iframe = document.createElement("iframe");
			iframe.style.visibility = "hidden";
			iframe.style.position = "fixed";
			iframe.style.right = "0";
			iframe.style.bottom = "0";
			iframe.width = "600px";
			iframe.height = "600px";

			// Set the source to the QR page URL
			const qrPageUrl = `${window.location.origin}/qr/${slugify(randomInstitution.name)}`;
			console.log("Loading QR page:", qrPageUrl);
			iframe.src = qrPageUrl;

			document.body.appendChild(iframe);

			try {
				// Wait for iframe to load with timeout
				await new Promise<void>((resolve, reject) => {
					const iframeTimeoutId = setTimeout(() => {
						reject(new Error("Iframe loading timed out"));
					}, 5000);

					iframe.onload = () => {
						console.log("Iframe loaded");
						setDownloadStage("Memuatkan halaman kod QR...");
						clearTimeout(iframeTimeoutId);
						setTimeout(() => {
							resolve();
						}, 1000);
					};

					iframe.onerror = () => {
						clearTimeout(iframeTimeoutId);
						reject(new Error("Iframe failed to load"));
					};
				});

				if (!iframe.contentDocument || !iframe.contentDocument.body) {
					throw new Error("Cannot access iframe content");
				}

				// Capture the iframe content
				setDownloadStage("Mengambil gambar kod QR...");
				const canvas = await html2canvas(iframe.contentDocument.body, {
					useCORS: true,
					allowTaint: true,
					backgroundColor: "#ffffff",
					scale: 2,
				});

				// Convert to downloadable image
				setDownloadStage("Menyediakan fail untuk dimuat turun...");
				const data = canvas.toDataURL("image/png");
				const link = document.createElement("a");
				link.href = data;
				link.download = `sedekahje-${slugify(randomInstitution.name)}.png`;
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);

				toast.success("Berjaya memuat turun kod QR.");
			} finally {
				// Always remove the iframe
				if (document.body.contains(iframe)) {
					document.body.removeChild(iframe);
				}
			}
		}

		try {
			// Try direct capture method first for all devices - more reliable cross-browser
			await handleDirectCapture();
		} catch (directCaptureError) {
			console.error("Direct capture error:", directCaptureError);

			// Try iframe method as fallback only for desktop browsers
			if (!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
				try {
					await handleIframeCapture();
				} catch (iframeError) {
					console.error("Iframe capture error:", iframeError);
					toast.error("Gagal memuat turun kod QR. Sila cuba lagi.");
				}
			} else {
				toast.error("Gagal memuat turun kod QR. Sila cuba lagi.");
			}
		} finally {
			setIsDownloading(false);
			setDownloadStage("");
		}
	}, [randomInstitution]);

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
						<div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-xs w-full flex flex-col items-center gap-4">
							<div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
							<p className="text-center font-medium">Memuat turun kod QR...</p>
							<p className="text-center text-sm text-gray-500 dark:text-gray-400">{downloadStage || "Sila tunggu sebentar"}</p>
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

				<div className="flex flex-col md:flex-row gap-8 pb-4" ref={cardRef}>
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
											onClick={handleDownload}
											disabled={isDownloading}
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
							<div className="flex flex-col items-center justify-center h-full min-h-[300px] bg-gray-50 dark:bg-gray-800 rounded-lg p-8 transition-colors duration-200">
								<QrCode
									size={48}
									className="text-gray-400 dark:text-gray-500 mb-4"
								/>
								<p className="text-gray-600 dark:text-gray-300 text-lg mb-6 text-center">
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
};

export default Rawak;

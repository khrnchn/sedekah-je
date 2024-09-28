"use client";

import { institutions as rawInstitutions } from "@/app/data/institutions";
import type { Institution } from "@/app/types/institutions";
import FilterCategory from "@/components/filter-category";
import FilterState from "@/components/filter-state";
import FilteredCount from "@/components/filtered-count";
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import PageSection from "@/components/ui/pageSection";
import QrCodeDisplay from "@/components/ui/qrCodeDisplay";
import useClientDimensions from "@/hooks/use-client-dimensions";
import { removeDuplicateInstitutions, slugify } from "@/lib/utils";
import html2canvas from "html2canvas";
import { Clipboard, Download, MapPin, QrCode } from "lucide-react";
import Image from "next/image";
import React, {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { toast } from "sonner";

const Rawak = () => {
	const cardRef = useRef<HTMLDivElement>(null);
	const [randomInstitution, setRandomInstitution] =
		useState<Institution | null>(null);
	const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
	const [selectedState, setSelectedState] = useState<string>("");
	const [totalFilteredCount, setTotalFilteredCount] = useState<number>(0);
	const { width } = useClientDimensions();
	const [url, setUrl] = useState<string>("");
	const printRef = useRef<HTMLButtonElement>(null);

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

	useEffect(() => {
		setTotalFilteredCount(filteredInstitutions.length);
	}, [filteredInstitutions]);

	const generateRandomNumber = useCallback(() => {
		if (filteredInstitutions.length > 0) {
			const randomNumber = Math.floor(
				Math.random() * filteredInstitutions.length,
			);
			setRandomInstitution(filteredInstitutions[randomNumber]);
			const category = filteredInstitutions[randomNumber].category;
			const slug = slugify(filteredInstitutions[randomNumber].name);

			setUrl(`https://www.sedekahje.com/${category}/${slug}`);

			cardRef.current?.scrollIntoView({ behavior: "smooth" });
		}
	}, [filteredInstitutions]);

	const handleDownload = useCallback(async () => {
		if (!randomInstitution || !printRef.current) return;

		try {
			const element = printRef.current;
			const canvas = await html2canvas(element);
			const data = canvas.toDataURL("image/png");
			const link = document.createElement("a");
			link.href = data;
			link.download = `${slugify(randomInstitution.name)}-qr.png`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			toast.success("Berjaya memuat turun kod QR.");
		} catch (error) {
			toast.error("Gagal memuat turun kod QR.");
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

		const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(randomInstitution.name)}`;

		window.open(mapUrl, "_blank", "noopener,noreferrer");
		toast.success("Peta dibuka dalam tab baru.");
	}, [randomInstitution]);

	return (
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
					>
						🎲 Jana QR Secara Rawak
					</Button>
				</div>
			</div>

			{/* Rendered only when there are filters applied */}
			{(selectedState !== "" || selectedCategories.length > 0) && (
				<FilteredCount count={totalFilteredCount} />
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
									>
										<Download size={16} className="mr-2" />
										<span className="text-xs font-medium">Muat Turun</span>
									</Button>
									<Button
										className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 px-3 py-2 rounded-md transition-all duration-200 ease-in-out flex items-center justify-center"
										onClick={handleCopy}
									>
										<Clipboard size={16} className="mr-2" />
										<span className="text-xs font-medium">Salin</span>
									</Button>
									<Button
										className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 px-3 py-2 rounded-md transition-all duration-200 ease-in-out flex items-center justify-center"
										onClick={handleMapOpen}
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
		</PageSection>
	);
};

export default Rawak;

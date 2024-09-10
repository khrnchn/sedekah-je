"use client";

import Image from "next/image";
import React, { useCallback, useMemo, useState, useRef } from "react";

import FilterCategory from "@/components/filter-category";
import FilterState from "@/components/filter-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import PageSection from "@/components/ui/pageSection";
import QrCodeDisplay from "@/components/ui/qrCodeDisplay";
import useClientDimensions from "@/hooks/use-client-dimensions";
import { removeDuplicateInstitutions } from "@/lib/utils";

import { MapPin, QrCode } from "lucide-react";
import { institutions as rawInstitutions } from "../data/institutions";
import type { Institution } from "../types/institutions";

const Rawak = () => {
	const cardRef = useRef<HTMLDivElement>(null);
	const [randomInstitution, setRandomInstitution] =
		useState<Institution | null>(null);
	const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
	const [selectedState, setSelectedState] = useState<string>("");
	const { width } = useClientDimensions();

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
			cardRef.current?.scrollIntoView({ behavior: "smooth" });
		}
	}, [filteredInstitutions]);

	return (
		<PageSection className="bg-background transition-colors duration-200 ease-in-out">
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

			<div className="flex flex-col md:flex-row gap-8 pb-4" ref={cardRef}>
				<Card className="w-full">
					{randomInstitution ? (
						<div className="flex flex-col items-center" >
							<div className="m-4">
								{randomInstitution.qrContent ? (
									<QrCodeDisplay
										qrContent={randomInstitution.qrContent}
										supportedPayment={randomInstitution.supportedPayment}
										size={width < 300 ? width - 40 : 260}
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
								<Button
									asChild
									className="flex items-center justify-center rounded-none rounded-b-lg bg-green-500 text-white px-6 py-3  hover:bg-green-600 transition-colors duration-300 shadow-md focus:outline-none"
								>
									<a
										href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(randomInstitution.name)}`}
										target="_blank"
										rel="noreferrer"
									>
										Cari di peta
									</a>
								</Button>
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

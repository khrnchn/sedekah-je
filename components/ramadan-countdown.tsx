"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight } from "lucide-react";
import moment from "moment-hijri";

/**
 * Calculates Ramadan information based on the current Hijri date
 * @returns Current Ramadan data and status
 */
const calculateRamadanInfo = async () => {
	// Get current Hijri date
	const today = moment();

	const hijriMonth = today.iMonth();
	// Adjust for Malaysia starting Ramadan 1 day late
	const hijriDay = today.iDate() - 1;
	const hijriYear = today.iYear();

	// Ramadan is the 9th month in Hijri calendar (0-indexed in moment-hijri)
	const isRamadan = hijriMonth === 8;

	// Calculate days in Ramadan for current year
	const totalDays = moment.iDaysInMonth(hijriYear, 8);

	// Calculate progress percentage
	const progressPercentage = (hijriDay / totalDays) * 100;

	// Format Hijri date
	const hijriDate = `Ramadan ${hijriDay}, ${hijriYear} AH`;

	// Handle edge case where hijriDay becomes 0 or negative
	if (hijriDay <= 0) {
		return {
			isRamadan: false,
			hijriDay: 0,
			totalDays,
			progressPercentage: 0,
			hijriDate: "Ramadan not started yet",
		};
	}

	return {
		isRamadan,
		hijriDay,
		totalDays,
		progressPercentage,
		hijriDate,
	};
};

const RamadanProgress = () => {
	const { data: ramadanInfo, isLoading } = useQuery({
		queryKey: ["ramadanInfo"],
		queryFn: calculateRamadanInfo,
		refetchInterval: 1000 * 60 * 60 * 24, // Refetch every day
		refetchOnWindowFocus: false, // Nak avoid unnecessary calls
	});

	// Show skeleton while loading
	if (isLoading || !ramadanInfo) {
		return (
			<Card className="relative overflow-hidden bg-gradient-to-r from-emerald-400 to-teal-800 text-white shadow-lg p-4 sm:p-6">
				<div className="absolute inset-0 opacity-30 ramadhan-bg" />
				<CardHeader className="relative p-2 sm:p-6">
					<CardTitle className="flex items-center justify-center gap-2 text-center text-lg sm:text-3xl font-bold">
						<Skeleton className="h-5 w-5 sm:h-8 sm:w-8 bg-white/30 rounded-full" />
						<Skeleton className="h-8 w-48 sm:h-10 sm:w-64 bg-white/30 rounded-md" />
					</CardTitle>
				</CardHeader>
				<CardContent className="relative flex flex-col items-center gap-4 sm:gap-6 p-2">
					{/* Ramadan Progress Skeleton */}
					<div className="w-full">
						<Skeleton className="h-6 w-48 mx-auto mb-2 bg-white/30 rounded-md" />
						<Skeleton className="w-full bg-white/20 h-3 rounded-full" />
						<Skeleton className="h-4 w-32 mx-auto mt-1 bg-white/30 rounded-md" />
					</div>

					{/* Ramadan Message & CTA Skeleton */}
					<div className="mt-2 text-center space-y-2 w-full">
						<Skeleton className="h-16 sm:h-14 w-full bg-white/10 rounded-lg" />
						<Skeleton className="h-4 w-3/4 mx-auto bg-white/20 rounded-md" />
					</div>
				</CardContent>
			</Card>
		);
	}

	// Return null if it's not Ramadan
	if (!ramadanInfo.isRamadan) {
		return null;
	}

	return (
		<Card
			className="relative overflow-hidden bg-gradient-to-r from-emerald-400
      to-teal-800 text-white shadow-lg p-4 sm:p-6"
		>
			<div className="absolute inset-0 opacity-30 ramadhan-bg" />
			<CardHeader className="relative p-2 sm:p-6">
				<CardTitle
					className="flex items-center justify-center gap-2 text-center
          text-lg sm:text-3xl font-bold"
				>
					<Star className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-300" />
					<span>{ramadanInfo.hijriDate}</span>
				</CardTitle>
			</CardHeader>
			<CardContent className="relative flex flex-col items-center gap-4 sm:gap-6 p-2">
				{/* Ramadan Progress */}
				<div className="w-full">
					<div className="text-center text-sm sm:text-lg font-semibold mb-2">
						Perjalanan Bulan Ramadan
					</div>
					<div className="w-full bg-white/20 h-3 rounded-full">
						<div
							className="bg-white h-3 rounded-full"
							style={{ width: `${ramadanInfo.progressPercentage}%` }}
						/>
					</div>
					<div className="text-center text-xs sm:text-sm mt-1">
						Hari ke-{ramadanInfo.hijriDay} dari {ramadanInfo.totalDays}
					</div>
				</div>

				{/* Ramadan Message & CTA, Call to Action */}
				<div className="mt-2 text-center space-y-2">
					<div className="text-xs sm:text-sm bg-white/10 p-2 sm:p-3 rounded-lg">
						<span className="font-bold">#SedekahJe 30 Hari 30 QR</span> - Ikuti
						kempen sedekah Ramadan kami di{" "}
						<a
							href="https://x.com/sedekahje"
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-1 underline font-semibold hover:text-green-200 transition-colors"
						>
							<span>@sedekahje</span>
							<ArrowUpRight className="h-3 w-3" />
						</a>
					</div>
					<p className="text-xs italic opacity-80">
						"Tidak akan berkurang harta dengan sedekah" - HR Muslim 2588
					</p>
				</div>
			</CardContent>
		</Card>
	);
};

const Star = ({ className }: { className?: string }) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill="currentColor"
		className={className}
	>
		<path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
	</svg>
);

export default RamadanProgress;

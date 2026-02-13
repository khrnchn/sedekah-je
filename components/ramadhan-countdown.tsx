"use client";

import { Card, CardContent } from "@/components/ui/card";
import { calculateSunsetTime } from "@/lib/utils/sunset";
import { type Location, getUserLocation } from "@/lib/utils/timezone";
import moment from "moment-hijri";
import { useEffect, useMemo, useState } from "react";

type RamadanStatus = {
	isRamadan: boolean;
	days: number;
	hours: number;
	minutes: number;
};

/**
 * Calculate Ramadan start date for current or next Ramadan
 * Ramadan starts at Maghrib (sunset) of the previous day (Islamic day begins at sunset)
 * Returns the next upcoming Ramadhan start date
 */
function getNextRamadanStartDate(location: Location): Date {
	const now = new Date();
	const today = moment(now);
	const currentYear = today.iYear();
	const currentMonth = today.iMonth(); // 0-indexed (8 = Ramadan)
	const currentDay = today.iDate();

	// Get this year's Ramadan start date
	// Ramadan starts at Maghrib of the previous day (Islamic day begins at sunset)
	const thisYearRamadanStartMoment = moment(now)
		.iYear(currentYear)
		.iMonth(8)
		.iDate(1);
	const thisYearRamadanStartDate = thisYearRamadanStartMoment.toDate();
	// Subtract one day and set to Maghrib time
	thisYearRamadanStartDate.setDate(thisYearRamadanStartDate.getDate() - 1);
	const thisYearStartDate = calculateSunsetTime(
		thisYearRamadanStartDate,
		location,
	);

	// Check if we're past this year's Ramadan
	const daysInThisYearRamadan = moment.iDaysInMonth(currentYear, 8);
	const isPastThisYearRamadan =
		currentMonth > 8 ||
		(currentMonth === 8 && currentDay > daysInThisYearRamadan);

	// If we're past this year's Ramadan, get next year's
	if (isPastThisYearRamadan) {
		const nextYear = currentYear + 1;
		const nextYearRamadanStartMoment = moment(now)
			.iYear(nextYear)
			.iMonth(8)
			.iDate(1);
		const nextYearRamadanStartDate = nextYearRamadanStartMoment.toDate();
		// Subtract one day and set to Maghrib time
		nextYearRamadanStartDate.setDate(nextYearRamadanStartDate.getDate() - 1);
		return calculateSunsetTime(nextYearRamadanStartDate, location);
	}

	// Otherwise, return this year's Ramadan start date
	return thisYearStartDate;
}

/**
 * Calculate the start date for the 30-day countdown window
 * The countdown window starts 30 days before Ramadhan, at Maghrib (sunset) of the previous day
 */
function getCountdownStartDate(ramadanStart: Date, location: Location): Date {
	// Calculate 30 days before Ramadhan start
	const countdownStart = new Date(ramadanStart);
	countdownStart.setDate(countdownStart.getDate() - 30);

	// Subtract one more day and set to Maghrib time (following Islamic day tradition)
	countdownStart.setDate(countdownStart.getDate() - 1);
	return calculateSunsetTime(countdownStart, location);
}

/**
 * Calculate current Ramadan status for countdown
 * Only shows countdown if within 30 days before Ramadhan starts (starting from Maghrib of previous day)
 */
function calculateRamadanStatus(
	ramadanStart: Date,
	location: Location,
): RamadanStatus | null {
	const now = new Date();

	// Hide component if we're at or past Ramadhan start
	if (now >= ramadanStart) {
		return null;
	}

	// Calculate the countdown start date (30 days before Ramadhan, at Maghrib of previous day)
	const countdownStartDate = getCountdownStartDate(ramadanStart, location);

	// Hide component if we're before the countdown start date
	if (now < countdownStartDate) {
		return null;
	}

	// Calculate time difference until Ramadhan starts
	const diffMs = ramadanStart.getTime() - now.getTime();

	// Calculate total days, hours, and minutes
	const totalSeconds = Math.floor(diffMs / 1000);
	const totalMinutes = Math.floor(totalSeconds / 60);
	const totalHours = Math.floor(totalMinutes / 60);

	const days = Math.floor(totalHours / 24);
	const hours = totalHours % 24;
	const minutes = totalMinutes % 60;

	return {
		isRamadan: false,
		days: Math.max(0, days),
		hours: Math.max(0, hours),
		minutes: Math.max(0, minutes),
	};
}

export default function RamadhanCountdown() {
	// Get user location from timezone (synchronous, no permission needed)
	const location = useMemo(() => getUserLocation(), []);

	// Calculate Ramadan start date once (memoized)
	const nextRamadanStart = useMemo(
		() => getNextRamadanStartDate(location),
		[location],
	);

	const [status, setStatus] = useState<RamadanStatus | null>(() =>
		calculateRamadanStatus(nextRamadanStart, location),
	);

	// Update countdown every second
	useEffect(() => {
		const interval = setInterval(() => {
			const newStatus = calculateRamadanStatus(nextRamadanStart, location);
			setStatus(newStatus);
		}, 1000); // 1 second

		return () => clearInterval(interval);
	}, [location, nextRamadanStart]);

	// Hide component if status is null (not within 30 days before Ramadhan or after Ramadhan starts)
	if (status === null) {
		return null;
	}

	// Show countdown before Ramadan
	return (
		<Card className="relative overflow-hidden bg-gradient-to-r from-emerald-400 to-teal-800 text-white shadow-lg">
			<div className="absolute inset-0 opacity-30 ramadhan-bg" />
			<CardContent className="relative p-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
				<span className="text-lg sm:text-xl">🌙</span>
				<span className="font-semibold text-sm sm:text-base">
					Ramadan bermula dalam:
				</span>
				<div className="flex items-center gap-2 sm:gap-4">
					{status.days > 0 && (
						<span className="font-bold text-sm sm:text-base">
							{status.days} {status.days === 1 ? "hari" : "hari"}
						</span>
					)}
					<span className="font-bold text-sm sm:text-base">
						{status.hours} {status.hours === 1 ? "jam" : "jam"}
					</span>
					<span className="font-bold text-sm sm:text-base">
						{status.minutes} {status.minutes === 1 ? "minit" : "minit"}
					</span>
				</div>
			</CardContent>
		</Card>
	);
}

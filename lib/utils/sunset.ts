import type { Location } from "./timezone";

/**
 * Calculate Maghrib (sunset) time for a given date based on user's location
 * Uses astronomical formulas with corrections for atmospheric refraction
 * Maghrib is when the sun is 0.833° below the horizon (geometric sunset + refraction + sun radius)
 * @param date - The date to calculate sunset for
 * @param location - User's location (latitude, longitude)
 * @returns Date object with Maghrib time set (always returns a valid Date, uses fallback for edge cases)
 */
export function calculateSunsetTime(date: Date, location: Location): Date {
	const latitude = location.latitude;
	const longitude = location.longitude;

	// Calculate day of year
	const startOfYear = new Date(date.getFullYear(), 0, 1);
	const dayOfYear =
		Math.floor(
			(date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24),
		) + 1;

	// Solar declination (angle of sun relative to equator)
	const declination =
		23.45 * Math.sin((((360 * (284 + dayOfYear)) / 365) * Math.PI) / 180);

	// Convert to radians
	const latRad = (latitude * Math.PI) / 180;
	const decRad = (declination * Math.PI) / 180;

	// Maghrib angle: sun is 0.833° below horizon
	// This accounts for:
	// - Geometric sunset (0°)
	// - Atmospheric refraction (~0.583°)
	// - Sun's angular radius (~0.25°)
	const maghribAngleRad = (0.833 * Math.PI) / 180;

	// Calculate hour angle (when sun reaches Maghrib angle)
	// Formula: cos(hourAngle) = -tan(lat) * tan(dec) - sin(maghribAngle) / (cos(lat) * cos(dec))
	const cosHourAngle =
		-Math.tan(latRad) * Math.tan(decRad) -
		Math.sin(maghribAngleRad) / (Math.cos(latRad) * Math.cos(decRad));

	// Handle edge cases (polar regions where there's no sunset/sunrise)
	if (cosHourAngle > 1) {
		// No sunset (midnight sun - sun never sets)
		// Use approximate sunset time (e.g., 11 PM) as fallback
		const fallbackDate = new Date(date);
		fallbackDate.setHours(23, 0, 0, 0);
		return fallbackDate;
	}
	if (cosHourAngle < -1) {
		// No sunrise (polar night - sun never rises)
		// Use approximate sunset time (e.g., 2 PM) as fallback
		const fallbackDate = new Date(date);
		fallbackDate.setHours(14, 0, 0, 0);
		return fallbackDate;
	}

	const hourAngle = Math.acos(cosHourAngle);

	// Equation of time (correction factor in minutes)
	const B = ((360 / 365) * (dayOfYear - 81) * Math.PI) / 180;
	const equationOfTime =
		9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);

	// Solar noon is typically around 12:00 PM local time, adjusted for equation of time
	// Also adjust for longitude (time correction)
	const longitudeCorrection = (longitude / 15) * 60; // Convert longitude to minutes
	const solarNoon = 12 + (equationOfTime + longitudeCorrection) / 60;

	// Sunset time (in hours from midnight)
	// hourAngle is in radians, convert to hours (24 hours = 2π radians)
	const sunsetHour = solarNoon + (hourAngle * 12) / Math.PI;

	// Validate sunset hour is reasonable (between 0 and 24)
	if (Number.isNaN(sunsetHour) || sunsetHour < 0 || sunsetHour >= 24) {
		// Fallback to approximate sunset time
		const fallbackDate = new Date(date);
		fallbackDate.setHours(19, 0, 0, 0); // 7 PM as fallback
		return fallbackDate;
	}

	// Create date with sunset time
	const sunsetDate = new Date(date);
	const hours = Math.floor(sunsetHour);
	const minutes = Math.floor((sunsetHour - hours) * 60);
	const seconds = Math.floor(((sunsetHour - hours) * 60 - minutes) * 60);

	sunsetDate.setHours(hours, minutes, seconds, 0);

	return sunsetDate;
}

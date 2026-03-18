import { describe, expect, test } from "bun:test";
import {
	buildWrappedSummary,
	calculateAverageMpr,
	calculateBestStreak,
	calculateDurationMinutes,
	formatDurationForCard,
	getRamadanNightLabel,
} from "@/lib/terawih";

describe("terawih helpers", () => {
	test("calculates session duration in minutes", () => {
		expect(calculateDurationMinutes("21:00", "22:45")).toBe(105);
	});

	test("calculates average minutes per rakaat", () => {
		expect(calculateAverageMpr(105, 20)).toBe(5.25);
	});

	test("formats duration for share card", () => {
		expect(formatDurationForCard(105)).toBe("1h 45m");
		expect(formatDurationForCard(60)).toBe("1h");
		expect(formatDurationForCard(45)).toBe("45m");
	});

	test("derives the ramadan night label from campaign start", () => {
		expect(getRamadanNightLabel("2026-03-19", "2026-03-19")).toBe(
			"MALAM 1 RAMADAN",
		);
		expect(getRamadanNightLabel("2026-03-23", "2026-03-19")).toBe(
			"MALAM 5 RAMADAN",
		);
	});

	test("computes best streak and wrapped summary", () => {
		expect(
			calculateBestStreak(["2026-03-19", "2026-03-20", "2026-03-22"]),
		).toBe(2);

		const summary = buildWrappedSummary([
			{
				sessionDate: "2026-03-19",
				durationMinutes: 90,
				rakaat: 20,
				averageMpr: 4.5,
				mosqueName: "Masjid A",
			},
			{
				sessionDate: "2026-03-20",
				durationMinutes: 100,
				rakaat: 20,
				averageMpr: 5,
				mosqueName: "Masjid A",
			},
			{
				sessionDate: "2026-03-22",
				durationMinutes: 80,
				rakaat: 8,
				averageMpr: 10,
				mosqueName: "Masjid B",
			},
		]);

		expect(summary.totalNights).toBe(3);
		expect(summary.totalMinutes).toBe(270);
		expect(summary.totalRakaat).toBe(48);
		expect(summary.averageMpr).toBe(5.63);
		expect(summary.longestSessionMinutes).toBe(100);
		expect(summary.bestStreak).toBe(2);
		expect(summary.topMosque).toBe("Masjid A");
		expect(summary.uniqueMosques).toBe(2);
	});
});

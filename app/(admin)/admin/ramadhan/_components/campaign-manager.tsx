"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { getRamadhanDate } from "@/lib/ramadhan";
import { cn } from "@/lib/utils";
import { addDays, format, startOfDay } from "date-fns";
import { useRouter } from "next/navigation";
import {
	useCallback,
	useEffect,
	useMemo,
	useState,
	useTransition,
} from "react";
import { toast } from "sonner";
import { saveCampaign } from "../_lib/actions";
import { InstitutionPicker } from "./institution-picker";

type CampaignDayRow = {
	dayNumber: number;
	featuredDate: string;
	institutionId: number | null;
	institutionName: string | null;
	caption: string | null;
};

type CampaignManagerProps = {
	initialYear: number;
	initialCampaign: CampaignDayRow[];
	initialInstitutions: {
		id: number;
		name: string;
		slug: string;
		category: string;
		state: string;
	}[];
};

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 11 }, (_, i) => CURRENT_YEAR - 2 + i);

function buildDaysFromExisting(
	startDateStr: string,
	existing: CampaignDayRow[],
): CampaignDayRow[] {
	const startDate = new Date(`${startDateStr}T12:00:00`);
	const existingByDay = new Map(existing.map((e) => [e.dayNumber, e]));
	return Array.from({ length: 30 }, (_, i) => {
		const dayNumber = i + 1;
		const existingDay = existingByDay.get(dayNumber);
		const date = getRamadhanDate(startDate, dayNumber);
		return {
			dayNumber,
			featuredDate: date.toISOString().slice(0, 10),
			institutionId: existingDay?.institutionId ?? null,
			institutionName: existingDay?.institutionName ?? null,
			caption: existingDay?.caption ?? null,
		};
	});
}

export function CampaignManager({
	initialYear,
	initialCampaign,
	initialInstitutions,
}: CampaignManagerProps) {
	const router = useRouter();

	// Derive start date from first campaign day if available
	const defaultStartDate =
		initialCampaign.length > 0
			? (initialCampaign[0]?.featuredDate ?? `${initialYear}-03-01`)
			: `${initialYear}-03-01`;

	const [year, setYear] = useState(initialYear);
	const [startDate, setStartDate] = useState(defaultStartDate);
	const [days, setDays] = useState<CampaignDayRow[]>(() =>
		buildDaysFromExisting(defaultStartDate, initialCampaign),
	);
	const [isPending, startTransition] = useTransition();

	// Recompute dates when year or startDate changes
	useEffect(() => {
		setDays((prev) =>
			prev.map((row) => {
				const d = new Date(`${startDate}T12:00:00`);
				d.setDate(d.getDate() + row.dayNumber - 1);
				return {
					...row,
					featuredDate: d.toISOString().slice(0, 10),
				};
			}),
		);
	}, [startDate]);

	const updateDay = useCallback(
		(dayNumber: number, updates: Partial<CampaignDayRow>) => {
			setDays((prev) =>
				prev.map((row) =>
					row.dayNumber === dayNumber ? { ...row, ...updates } : row,
				),
			);
		},
		[],
	);

	const handleSave = useCallback(() => {
		startTransition(async () => {
			try {
				await saveCampaign({
					year,
					startDate,
					days: days.map((d) => ({
						dayNumber: d.dayNumber,
						institutionId: d.institutionId,
						caption: d.caption,
					})),
				});
				toast.success("Kempen Ramadan berjaya disimpan.");
			} catch (err) {
				toast.error(
					err instanceof Error ? err.message : "Gagal menyimpan kempen.",
				);
			}
		});
	}, [year, startDate, days]);

	// Sync when initialYear changes (e.g. user switched year via URL)
	useEffect(() => {
		setYear(initialYear);
		const defaultStart =
			initialCampaign.length > 0
				? (initialCampaign[0]?.featuredDate ?? `${initialYear}-03-01`)
				: `${initialYear}-03-01`;
		setStartDate(defaultStart);
		setDays(buildDaysFromExisting(defaultStart, initialCampaign));
	}, [initialYear, initialCampaign]);

	const start = useMemo(
		() => startOfDay(new Date(`${startDate}T12:00:00`)),
		[startDate],
	);
	const ramadhanDates = useMemo(
		() => Array.from({ length: 30 }, (_, i) => addDays(start, i)),
		[start],
	);
	const dateToDayNumber = useMemo(() => {
		const map = new Map<string, number>();
		for (let i = 0; i < 30; i++) {
			const d = addDays(start, i);
			map.set(format(d, "yyyy-MM-dd"), i + 1);
		}
		return map;
	}, [start]);

	const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
	const selectedRow = useMemo(() => {
		if (!selectedDate) return null;
		const dayNum = dateToDayNumber.get(format(selectedDate, "yyyy-MM-dd"));
		return dayNum != null
			? (days.find((d) => d.dayNumber === dayNum) ?? null)
			: null;
	}, [selectedDate, dateToDayNumber, days]);

	const modifiers = useMemo(
		() => ({
			ramadhan: ramadhanDates,
			assigned: ramadhanDates.filter((d) => {
				const dayNum = dateToDayNumber.get(format(d, "yyyy-MM-dd"));
				return (
					dayNum != null &&
					(days.find((r) => r.dayNumber === dayNum)?.institutionId ?? null) !=
						null
				);
			}),
		}),
		[ramadhanDates, dateToDayNumber, days],
	);
	const modifiersClassNames = {
		ramadhan: "bg-muted/50 font-medium",
		assigned:
			"bg-emerald-100 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-100",
	};
	const disabledDates = (date: Date) => {
		const dayNum = dateToDayNumber.get(format(date, "yyyy-MM-dd"));
		return dayNum == null || dayNum < 1 || dayNum > 30;
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap gap-4 items-end">
				<div className="space-y-2">
					<Label>Tahun</Label>
					<Select
						value={String(year)}
						onValueChange={(v) => {
							const newYear = Number(v);
							setYear(newYear);
							router.replace(`/admin/ramadhan?year=${newYear}`);
						}}
					>
						<SelectTrigger className="w-[120px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{YEARS.map((y) => (
								<SelectItem key={y} value={String(y)}>
									{y}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-2">
					<Label>Tarikh Mula Ramadan (Gregorian)</Label>
					<Input
						type="date"
						value={startDate}
						onChange={(e) => setStartDate(e.target.value)}
						className="w-[180px]"
					/>
				</div>
				<Button onClick={handleSave} disabled={isPending}>
					{isPending ? "Menyimpan..." : "Simpan"}
				</Button>
			</div>

			<div className="flex flex-col lg:flex-row gap-6">
				<Calendar
					mode="single"
					selected={selectedDate}
					onSelect={setSelectedDate}
					defaultMonth={start}
					disabled={disabledDates}
					modifiers={modifiers}
					modifiersClassNames={modifiersClassNames}
					className={cn("rounded-md border")}
				/>
				<div className="flex-1 min-w-0 space-y-4">
					{selectedRow ? (
						<>
							<div>
								<h3 className="text-sm font-medium mb-2">
									Hari {selectedRow.dayNumber} — {selectedRow.featuredDate}
								</h3>
								<div className="space-y-4">
									<div>
										<Label>Institusi</Label>
										<div className="mt-1">
											<InstitutionPicker
												institutions={initialInstitutions}
												value={selectedRow.institutionId}
												onChange={(id) =>
													updateDay(selectedRow.dayNumber, {
														institutionId: id,
														institutionName:
															id !== null
																? (initialInstitutions.find((i) => i.id === id)
																		?.name ?? null)
																: null,
													})
												}
												placeholder="Pilih institusi..."
											/>
										</div>
									</div>
									<div>
										<Label>Kapsyen</Label>
										<Input
											placeholder="Mesej harian (pilihan)"
											value={selectedRow.caption ?? ""}
											onChange={(e) =>
												updateDay(selectedRow.dayNumber, {
													caption: e.target.value || null,
												})
											}
											className="mt-1"
										/>
									</div>
								</div>
							</div>
						</>
					) : (
						<div
							className={cn(
								"rounded-lg border border-dashed p-8 text-center text-muted-foreground",
							)}
						>
							<p className="text-sm">
								Pilih tarikh pada kalendar untuk mengedit institusi.
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { getRamadhanDate } from "@/lib/ramadhan";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
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

	const startDateAsDate = startDate
		? new Date(`${startDate}T12:00:00`)
		: undefined;
	const [datePickerOpen, setDatePickerOpen] = useState(false);

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
					<Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
						<PopoverTrigger asChild>
							<Button
								variant="outline"
								className={cn(
									"w-[180px] justify-start text-left font-normal",
									!startDate && "text-muted-foreground",
								)}
							>
								<CalendarIcon className="mr-2 h-4 w-4" />
								{startDate && startDateAsDate ? (
									format(startDateAsDate, "dd MMM yyyy")
								) : (
									<span>Pilih tarikh</span>
								)}
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-auto p-0" align="start">
							<Calendar
								mode="single"
								selected={startDateAsDate}
								onSelect={(date) => {
									if (date) {
										setStartDate(format(date, "yyyy-MM-dd"));
										setDatePickerOpen(false);
									}
								}}
								defaultMonth={startDateAsDate}
							/>
						</PopoverContent>
					</Popover>
				</div>
				<Button onClick={handleSave} disabled={isPending}>
					{isPending ? "Menyimpan..." : "Simpan"}
				</Button>
			</div>

			<div className="rounded-md border overflow-x-auto">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b bg-muted/50">
							<th className="text-left p-2 w-16">Hari</th>
							<th className="text-left p-2 w-28">Tarikh</th>
							<th className="text-left p-2 min-w-[220px]">Institusi</th>
							<th className="text-left p-2">Kapsyen</th>
						</tr>
					</thead>
					<tbody>
						{days.map((row) => (
							<tr key={row.dayNumber} className="border-b hover:bg-muted/30">
								<td className="p-2 font-medium">{row.dayNumber}</td>
								<td className="p-2 text-muted-foreground">
									{row.featuredDate}
								</td>
								<td className="p-2">
									<InstitutionPicker
										institutions={initialInstitutions}
										value={row.institutionId}
										onChange={(id) =>
											updateDay(row.dayNumber, {
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
								</td>
								<td className="p-2">
									<Input
										placeholder="Mesej harian (pilihan)"
										value={row.caption ?? ""}
										onChange={(e) =>
											updateDay(row.dayNumber, {
												caption: e.target.value || null,
											})
										}
										className="max-w-xs"
									/>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}

"use client";

import { format } from "date-fns";
import { ms as msLocale } from "date-fns/locale";
import {
	CalendarIcon,
	Clock,
	MoonStar,
	QrCode,
	TimerReset,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import type { TERAWIH_RAKAAT_PRESETS } from "@/lib/terawih";
import { cn } from "@/lib/utils";
import { createTerawihSession } from "../_lib/actions";
import type { TerawihInstitutionOption } from "../_lib/queries";
import { InstitutionPicker } from "./institution-picker";

type TerawihSessionFormProps = {
	institutions: TerawihInstitutionOption[];
	defaultDate: string;
};

const initialTerawihActionState = {
	status: "idle",
} as const;

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) =>
	String(i).padStart(2, "0"),
);
const MINUTE_OPTIONS = [
	"00",
	"05",
	"10",
	"15",
	"20",
	"25",
	"30",
	"35",
	"40",
	"45",
	"50",
	"55",
];

function TimePicker({
	value,
	onChange,
	label,
}: {
	value: string;
	onChange: (time: string) => void;
	label: string;
}) {
	const [hour, minute] = value ? value.split(":") : ["", ""];

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					type="button"
					variant="outline"
					className={cn(
						"w-full justify-start font-normal",
						!value && "text-muted-foreground",
					)}
				>
					<Clock className="mr-2 h-4 w-4" />
					{value || label}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-3" align="start">
				<div className="flex gap-2">
					<div className="space-y-1.5">
						<p className="text-xs font-medium text-muted-foreground px-1">
							Jam
						</p>
						<div className="h-48 overflow-y-auto rounded-md border">
							{HOUR_OPTIONS.map((h) => (
								<button
									key={h}
									type="button"
									className={cn(
										"block w-full px-3 py-1.5 text-sm text-left hover:bg-accent",
										hour === h &&
											"bg-primary text-primary-foreground hover:bg-primary",
									)}
									onClick={() => onChange(`${h}:${minute || "00"}`)}
								>
									{h}
								</button>
							))}
						</div>
					</div>
					<div className="space-y-1.5">
						<p className="text-xs font-medium text-muted-foreground px-1">
							Minit
						</p>
						<div className="h-48 overflow-y-auto rounded-md border">
							{MINUTE_OPTIONS.map((m) => (
								<button
									key={m}
									type="button"
									className={cn(
										"block w-full px-3 py-1.5 text-sm text-left hover:bg-accent",
										minute === m &&
											"bg-primary text-primary-foreground hover:bg-primary",
									)}
									onClick={() => onChange(`${hour || "21"}:${m}`)}
								>
									{m}
								</button>
							))}
						</div>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}

export function TerawihSessionForm({
	institutions,
	defaultDate,
}: TerawihSessionFormProps) {
	const router = useRouter();
	const [state, formAction, isPending] = useActionState(
		createTerawihSession,
		initialTerawihActionState,
	);
	const [usePendingMosque, setUsePendingMosque] = useState(false);
	const [selectedInstitutionId, setSelectedInstitutionId] = useState<
		number | null
	>(null);
	const [rakaatPreset, setRakaatPreset] =
		useState<(typeof TERAWIH_RAKAAT_PRESETS)[number]>("8");

	const [sessionDate, setSessionDate] = useState(defaultDate);
	const [datePickerOpen, setDatePickerOpen] = useState(false);
	const [startTime, setStartTime] = useState("");
	const [endTime, setEndTime] = useState("");

	const sessionDateAsDate = sessionDate
		? new Date(`${sessionDate}T12:00:00`)
		: undefined;

	const selectedInstitution = useMemo(
		() =>
			institutions.find(
				(institution) => institution.id === selectedInstitutionId,
			),
		[institutions, selectedInstitutionId],
	);

	useEffect(() => {
		if (state.status === "success" && state.sessionId) {
			toast.success(state.message);
			router.push(`/terawih/${state.sessionId}`);
			return;
		}

		if (state.status === "error" && state.message) {
			toast.error(state.message);
		}
	}, [router, state]);

	return (
		<Card className="border-orange-500/20 shadow-sm">
			<CardHeader className="pb-4">
				<CardTitle className="flex items-center gap-2 text-base">
					<MoonStar className="h-5 w-5 text-orange-500" />
					Log Sesi Tarawih
				</CardTitle>
			</CardHeader>
			<CardContent>
				<form action={formAction} className="space-y-5">
					{/* Mosque picker */}
					<div className="space-y-2">
						<Label>Masjid</Label>
						{usePendingMosque ? (
							<>
								<Input
									id="pendingInstitutionName"
									name="pendingInstitutionName"
									placeholder="Contoh: Masjid IIUM"
									defaultValue={selectedInstitution?.name}
								/>
								<p className="text-xs text-muted-foreground">
									Log sesi dahulu, kemudian hantar QR masjid melalui borang
									sumbangan.
								</p>
								{state.fieldErrors?.pendingInstitutionName?.[0] && (
									<p className="text-sm text-destructive">
										{state.fieldErrors.pendingInstitutionName[0]}
									</p>
								)}
							</>
						) : (
							<InstitutionPicker
								institutions={institutions}
								value={selectedInstitutionId}
								onChange={setSelectedInstitutionId}
							/>
						)}
						<input
							type="hidden"
							name="institutionId"
							value={usePendingMosque ? "" : (selectedInstitutionId ?? "")}
						/>
						<div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
							<Button
								type="button"
								variant="ghost"
								className="h-auto p-0 text-xs text-orange-600 hover:text-orange-700"
								onClick={() => {
									setUsePendingMosque((value) => !value);
									if (!usePendingMosque) {
										setSelectedInstitutionId(null);
									}
								}}
							>
								{usePendingMosque
									? "Pilih dari senarai masjid"
									: "Tak jumpa? Log nama sementara"}
							</Button>
							<Link
								href="/contribute"
								className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
							>
								<QrCode className="h-3.5 w-3.5" />
								Hantar QR
							</Link>
						</div>
					</div>

					{/* Date picker */}
					<div className="space-y-2">
						<Label>Tarikh</Label>
						<input type="hidden" name="sessionDate" value={sessionDate} />
						<Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
							<PopoverTrigger asChild>
								<Button
									type="button"
									variant="outline"
									className={cn(
										"w-full justify-start font-normal",
										!sessionDate && "text-muted-foreground",
									)}
								>
									<CalendarIcon className="mr-2 h-4 w-4" />
									{sessionDate && sessionDateAsDate
										? format(sessionDateAsDate, "dd MMM yyyy", {
												locale: msLocale,
											})
										: "Pilih tarikh"}
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0" align="start">
								<Calendar
									mode="single"
									selected={sessionDateAsDate}
									onSelect={(date) => {
										if (date) {
											setSessionDate(format(date, "yyyy-MM-dd"));
											setDatePickerOpen(false);
										}
									}}
									defaultMonth={sessionDateAsDate}
									disabled={(date) => date > new Date()}
								/>
							</PopoverContent>
						</Popover>
						{state.fieldErrors?.sessionDate?.[0] && (
							<p className="text-sm text-destructive">
								{state.fieldErrors.sessionDate[0]}
							</p>
						)}
					</div>

					{/* Time pickers - 2 columns on mobile */}
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-2">
							<Label>Masa mula</Label>
							<input type="hidden" name="startTime" value={startTime} />
							<TimePicker
								value={startTime}
								onChange={setStartTime}
								label="Mula"
							/>
							{state.fieldErrors?.startTime?.[0] && (
								<p className="text-sm text-destructive">
									{state.fieldErrors.startTime[0]}
								</p>
							)}
						</div>
						<div className="space-y-2">
							<Label>Masa tamat</Label>
							<input type="hidden" name="endTime" value={endTime} />
							<TimePicker value={endTime} onChange={setEndTime} label="Tamat" />
							{state.fieldErrors?.endTime?.[0] && (
								<p className="text-sm text-destructive">
									{state.fieldErrors.endTime[0]}
								</p>
							)}
						</div>
					</div>

					{/* Rakaat */}
					<div className="space-y-2">
						<Label>Rakaat</Label>
						<div className="grid grid-cols-2 gap-3">
							<Select
								name="rakaatPreset"
								value={rakaatPreset}
								onValueChange={(value) =>
									setRakaatPreset(
										value as (typeof TERAWIH_RAKAAT_PRESETS)[number],
									)
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Pilih rakaat" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="8">8 rakaat</SelectItem>
									<SelectItem value="20">20 rakaat</SelectItem>
									<SelectItem value="custom">Custom</SelectItem>
								</SelectContent>
							</Select>
							<Input
								id="customRakaat"
								name="customRakaat"
								type="number"
								min={1}
								disabled={rakaatPreset !== "custom"}
								placeholder="Jumlah"
							/>
						</div>
						{state.fieldErrors?.customRakaat?.[0] && (
							<p className="text-sm text-destructive">
								{state.fieldErrors.customRakaat[0]}
							</p>
						)}
					</div>

					{/* Notes */}
					<div className="space-y-2">
						<Label htmlFor="notes">Catatan ringkas</Label>
						<Textarea
							id="notes"
							name="notes"
							rows={2}
							placeholder="Contoh: Imam baca surah panjang malam ini."
						/>
					</div>

					{/* Info box */}
					<div className="flex items-start gap-2.5 rounded-lg border border-orange-500/20 bg-orange-500/5 p-3 text-xs text-muted-foreground">
						<TimerReset className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
						<p>
							Tempoh dan purata MPR dikira automatik berdasarkan masa dan
							rakaat.
						</p>
					</div>

					<Button type="submit" className="w-full" disabled={isPending}>
						{isPending ? "Menyimpan sesi..." : "Simpan dan jana kad"}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}

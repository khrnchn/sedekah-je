"use client";

import { MoonStar, QrCode, TimerReset } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { TERAWIH_RAKAAT_PRESETS } from "@/lib/terawih";
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
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<MoonStar className="h-5 w-5 text-orange-500" />
					Log Sesi Tarawih
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				<form action={formAction} className="space-y-6">
					<div className="space-y-2">
						<Label htmlFor="institution-picker">Masjid</Label>
						{usePendingMosque ? (
							<>
								<Input
									id="pendingInstitutionName"
									name="pendingInstitutionName"
									placeholder="Contoh: Masjid IIUM"
									defaultValue={selectedInstitution?.name}
								/>
								<p className="text-sm text-muted-foreground">
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
						<div className="flex flex-wrap gap-3 text-sm">
							<Button
								type="button"
								variant="ghost"
								className="h-auto p-0 text-orange-600 hover:text-orange-700"
								onClick={() => {
									setUsePendingMosque((value) => !value);
									if (!usePendingMosque) {
										setSelectedInstitutionId(null);
									}
								}}
							>
								{usePendingMosque
									? "Pilih dari senarai masjid"
									: "Tak jumpa masjid? Log dengan nama sementara"}
							</Button>
							<Link
								href="/contribute"
								className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
							>
								<QrCode className="h-4 w-4" />
								Hantar QR masjid
							</Link>
						</div>
					</div>

					<div className="grid gap-4 md:grid-cols-3">
						<div className="space-y-2">
							<Label htmlFor="sessionDate">Tarikh</Label>
							<Input
								id="sessionDate"
								name="sessionDate"
								type="date"
								defaultValue={defaultDate}
								required
							/>
							{state.fieldErrors?.sessionDate?.[0] && (
								<p className="text-sm text-destructive">
									{state.fieldErrors.sessionDate[0]}
								</p>
							)}
						</div>
						<div className="space-y-2">
							<Label htmlFor="startTime">Masa mula</Label>
							<Input id="startTime" name="startTime" type="time" required />
							{state.fieldErrors?.startTime?.[0] && (
								<p className="text-sm text-destructive">
									{state.fieldErrors.startTime[0]}
								</p>
							)}
						</div>
						<div className="space-y-2">
							<Label htmlFor="endTime">Masa tamat</Label>
							<Input id="endTime" name="endTime" type="time" required />
							{state.fieldErrors?.endTime?.[0] && (
								<p className="text-sm text-destructive">
									{state.fieldErrors.endTime[0]}
								</p>
							)}
						</div>
					</div>

					<div className="grid gap-4 md:grid-cols-[minmax(0,220px)_1fr]">
						<div className="space-y-2">
							<Label>Rakaat</Label>
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
						</div>
						<div className="space-y-2">
							<Label htmlFor="customRakaat">Jumlah rakaat custom</Label>
							<Input
								id="customRakaat"
								name="customRakaat"
								type="number"
								min={1}
								disabled={rakaatPreset !== "custom"}
								placeholder="Contoh: 12"
							/>
							{state.fieldErrors?.customRakaat?.[0] && (
								<p className="text-sm text-destructive">
									{state.fieldErrors.customRakaat[0]}
								</p>
							)}
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="notes">Catatan ringkas</Label>
						<Textarea
							id="notes"
							name="notes"
							rows={3}
							placeholder="Contoh: Imam baca surah panjang malam ini."
						/>
					</div>

					<div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 text-sm text-muted-foreground">
						<div className="flex items-center gap-2 font-medium text-foreground">
							<TimerReset className="h-4 w-4 text-orange-500" />
							Metrik dikira automatik
						</div>
						<p className="mt-1">
							Sistem akan mengira tempoh sesi dan purata minit per rakaat
							berdasarkan masa mula, masa tamat, dan jumlah rakaat.
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

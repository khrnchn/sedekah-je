"use client";

import { Heart, Trash2, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
	addFridayFavourite,
	type FridayInstitutionSearchResult,
	removeFridayFavourite,
	setFridayOverride,
} from "../_lib/actions";
import type {
	FridayFavouriteRow,
	FridayInstitutionOption,
} from "../_lib/queries";
import { AsyncInstitutionPicker } from "./async-institution-picker";

type FridayCampaignManagerProps = {
	activeOverrideInstitutionId: number | null;
	currentCampaign: {
		featuredDate: string;
		institutionId: number;
		source: "random" | "override";
		institutionName: string;
		institutionState: string;
	} | null;
	favourites: FridayFavouriteRow[];
	activeOverrideInstitution: FridayInstitutionOption | null;
};

export function FridayCampaignManager({
	activeOverrideInstitutionId,
	activeOverrideInstitution,
	currentCampaign,
	favourites,
}: FridayCampaignManagerProps) {
	const router = useRouter();
	const [overrideId, setOverrideId] = useState<number | null>(
		activeOverrideInstitutionId,
	);
	const [overrideOption, setOverrideOption] =
		useState<FridayInstitutionOption | null>(activeOverrideInstitution);
	const [favouriteId, setFavouriteId] = useState<number | null>(null);
	const [favouriteOption, setFavouriteOption] =
		useState<FridayInstitutionSearchResult | null>(null);
	const [isPending, startTransition] = useTransition();

	const favouriteInstitutionIds = useMemo(
		() => favourites.map((f) => f.institutionId),
		[favourites],
	);

	const refresh = () => router.refresh();

	function saveOverride(nextId: number | null = overrideId) {
		startTransition(async () => {
			try {
				await setFridayOverride(nextId);
				setOverrideId(nextId);
				if (nextId === null) {
					setOverrideOption(null);
				}
				toast.success(
					nextId
						? "Override kempen Jumaat disimpan."
						: "Override kempen Jumaat dikosongkan.",
				);
				refresh();
			} catch (err) {
				toast.error(err instanceof Error ? err.message : "Gagal menyimpan.");
			}
		});
	}

	function addFavourite() {
		if (!favouriteId) {
			toast.error("Pilih institusi dahulu.");
			return;
		}

		startTransition(async () => {
			try {
				await addFridayFavourite(favouriteId);
				setFavouriteId(null);
				setFavouriteOption(null);
				toast.success("Favourite ditambah.");
				refresh();
			} catch (err) {
				toast.error(err instanceof Error ? err.message : "Gagal menambah.");
			}
		});
	}

	function removeFavourite(favourite: FridayFavouriteRow) {
		startTransition(async () => {
			try {
				await removeFridayFavourite(favourite.id);
				if (overrideId === favourite.institutionId) {
					setOverrideId(null);
					setOverrideOption(null);
				}
				toast.success("Favourite dibuang.");
				refresh();
			} catch (err) {
				toast.error(err instanceof Error ? err.message : "Gagal membuang.");
			}
		});
	}

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-lg">
						<Zap className="h-5 w-5" />
						Status Kempen Jumaat
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2 text-sm">
					{currentCampaign ? (
						<>
							<p className="font-medium">{currentCampaign.institutionName}</p>
							<p className="text-muted-foreground">
								{currentCampaign.institutionState} •{" "}
								{currentCampaign.featuredDate} •{" "}
								{currentCampaign.source === "override" ? "Override" : "Random"}
							</p>
						</>
					) : (
						<p className="text-muted-foreground">
							Tiada kempen aktif sekarang. Window aktif dari Khamis 7:00 PM
							hingga Jumaat 6:59 PM MYT.
						</p>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="text-lg">Override Aktif</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid gap-2">
						<Label>Institusi untuk dipush sekarang</Label>
						<AsyncInstitutionPicker
							value={overrideId}
							selectedOption={overrideOption}
							onChange={(institution) => {
								setOverrideId(institution?.id ?? null);
								setOverrideOption(institution);
							}}
							disabled={isPending}
							placeholder="Pilih override..."
						/>
					</div>
					<div className="flex flex-wrap gap-2">
						<Button onClick={() => saveOverride()} disabled={isPending}>
							Simpan override
						</Button>
						<Button
							type="button"
							variant="outline"
							onClick={() => saveOverride(null)}
							disabled={isPending || overrideId === null}
						>
							Kosongkan override
						</Button>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-lg">
						<Heart className="h-5 w-5" />
						Favourites
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex flex-col gap-3 sm:flex-row">
						<div className="flex-1">
							<AsyncInstitutionPicker
								value={favouriteId}
								selectedOption={favouriteOption}
								onChange={(institution) => {
									setFavouriteId(institution?.id ?? null);
									setFavouriteOption(institution);
								}}
								excludeIds={favouriteInstitutionIds}
								disabled={isPending}
								placeholder="Tambah favourite..."
							/>
						</div>
						<Button onClick={addFavourite} disabled={isPending}>
							Tambah
						</Button>
					</div>

					<div className="rounded-md border">
						{favourites.length === 0 ? (
							<p className="p-4 text-sm text-muted-foreground">
								Belum ada favourite.
							</p>
						) : (
							<div className="divide-y">
								{favourites.map((favourite) => (
									<div
										key={favourite.id}
										className="flex items-center justify-between gap-3 p-3"
									>
										<div className="min-w-0">
											<p className="truncate text-sm font-medium">
												{favourite.institutionName}
											</p>
											<p className="text-xs text-muted-foreground">
												{favourite.institutionState} •{" "}
												{favourite.institutionCategory}
											</p>
										</div>
										<div className="flex shrink-0 gap-2">
											<Button
												type="button"
												size="sm"
												variant="outline"
												onClick={() => {
													setOverrideId(favourite.institutionId);
													setOverrideOption({
														id: favourite.institutionId,
														name: favourite.institutionName,
														slug: favourite.institutionSlug,
														category: favourite.institutionCategory,
														state: favourite.institutionState,
													});
													saveOverride(favourite.institutionId);
												}}
												disabled={isPending}
											>
												Push
											</Button>
											<Button
												type="button"
												size="icon"
												variant="ghost"
												onClick={() => removeFavourite(favourite)}
												disabled={isPending}
												aria-label={`Buang ${favourite.institutionName}`}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

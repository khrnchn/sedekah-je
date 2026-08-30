"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
	Building2,
	CaseSensitive,
	ExternalLink,
	Link2,
	Loader2,
	MapPin,
	Search,
	User,
	Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
	forwardRef,
	useImperativeHandle,
	useState,
	useTransition,
} from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AdminLocationMap } from "@/app/(admin)/admin/institutions/pending/[id]/_components/admin-location-map";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldLabel,
} from "@/components/shared/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
import type { Institution } from "@/db/institutions";
import { env } from "@/env";
import { formatFullDate, formatTime } from "@/lib/date-utils";
import { normalizeInstitutionCategory } from "@/lib/institution-categories";
import {
	categories as CATEGORY_OPTIONS,
	supportedPayments as PAYMENT_OPTIONS,
	states as STATE_OPTIONS,
} from "@/lib/institution-constants";
import { geocodeInstitution } from "@/lib/integrations/geocode";
import { cn, toTitleCase } from "@/lib/utils";
import {
	reverseGeocodeInstitutionByAdmin,
	updateInstitutionByAdmin,
} from "../../_lib/actions";
import { searchApprovedInstitutionsForDuplicateCheck } from "../../_lib/queries";

type PartialInstitution = Partial<Institution> & {
	id: number;
	sourceUrl?: string;
	contributorRemarks?: string;
	contributorName?: string | null;
	contributorId?: string | null;
	contributorEmail?: string | null;
	createdAt?: Date;
};

type Props = {
	institution: PartialInstitution;
};

export type ReviewFormHandle = {
	save: () => Promise<boolean>;
	setQrContent: (qrContent: string) => void;
};

// Coordinate validation (lat -90 to 90, lon -180 to 180, both optional)
const coordString = z.string().optional().or(z.literal(""));
const latString = coordString.refine(
	(val) => {
		if (!val || val === "") return true;
		const num = Number.parseFloat(val);
		return !Number.isNaN(num) && num >= -90 && num <= 90;
	},
	{ message: "Latitude must be between -90 and 90" },
);
const lonString = coordString.refine(
	(val) => {
		if (!val || val === "") return true;
		const num = Number.parseFloat(val);
		return !Number.isNaN(num) && num >= -180 && num <= 180;
	},
	{ message: "Longitude must be between -180 and 180" },
);

// Helper schema for optional valid URL
const urlOrEmpty = z
	.string()
	.optional()
	.refine(
		(val) => {
			if (!val || val === "") return true;
			try {
				new URL(val);
				return true;
			} catch {
				return false;
			}
		},
		{ message: "Invalid URL" },
	);

/** Parse "lat, lon" paste from Google Maps etc. Returns null if not two valid coords. */
function parseCoordPaste(text: string): { lat: number; lon: number } | null {
	const numbers = text.match(/-?\d+\.?\d*/g);
	if (!numbers || numbers.length < 2) return null;

	const a = Number.parseFloat(numbers[0]);
	const b = Number.parseFloat(numbers[1]);
	if (Number.isNaN(a) || Number.isNaN(b)) return null;

	// Malaysia: lat 1–7, lon 99–120. Google Maps format is "lat, lon".
	let lat: number;
	let lon: number;
	if (a >= 1 && a <= 7 && b >= 99 && b <= 120) {
		lat = a;
		lon = b;
	} else if (b >= 1 && b <= 7 && a >= 99 && a <= 120) {
		lat = b;
		lon = a;
	} else {
		// Assume first is lat, second is lon (Google Maps default)
		lat = Math.abs(a) <= 90 ? a : b;
		lon = Math.abs(a) <= 90 ? b : a;
	}

	if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
		return null;
	}
	return { lat, lon };
}

const reviewSchema = (institution: PartialInstitution) =>
	z.object({
		name: z.string().min(1, "Name is required"),
		category: z.enum(CATEGORY_OPTIONS),
		state: z.enum(STATE_OPTIONS),
		city: z.string().min(1),
		address: z.string().optional(),
		lat: latString,
		lon: lonString,
		facebook: urlOrEmpty,
		instagram: urlOrEmpty,
		website: urlOrEmpty,
		sourceUrl: z.string().optional(),
		contributorRemarks: z.string().optional(),
		supportedPayment: z
			.array(z.enum(PAYMENT_OPTIONS))
			.min(1, "At least one payment method is required"),
		qrContent: institution.qrContent
			? z.string().optional()
			: z
					.string()
					.min(1, "QR content required when automatic extraction fails"),
	});

const InstitutionReviewForm = forwardRef<ReviewFormHandle, Props>(
	function InstitutionReviewForm({ institution }, ref) {
		const router = useRouter();

		const [_isPending, startTransition] = useTransition();
		const [isRecalibrating, setIsRecalibrating] = useState(false);
		const [isFillingAddress, setIsFillingAddress] = useState(false);
		const [replaceAddressDialog, setReplaceAddressDialog] = useState<{
			open: boolean;
			newAddress: string;
		}>({ open: false, newAddress: "" });
		const [checkExistingOpen, setCheckExistingOpen] = useState(false);
		const [checkExistingQuery, setCheckExistingQuery] = useState("");
		const [checkExistingResults, setCheckExistingResults] = useState<
			Awaited<ReturnType<typeof searchApprovedInstitutionsForDuplicateCheck>>
		>([]);
		const [isCheckingExisting, setIsCheckingExisting] = useState(false);
		const [hasSearchedExisting, setHasSearchedExisting] = useState(false);

		function runCheckExistingSearch() {
			const q = checkExistingQuery.trim();
			if (!q) return;
			setIsCheckingExisting(true);
			searchApprovedInstitutionsForDuplicateCheck(q)
				.then((res) => {
					setCheckExistingResults(res);
					setHasSearchedExisting(true);
				})
				.catch(() => toast.error("Failed to search"))
				.finally(() => setIsCheckingExisting(false));
		}

		const formattedSubmissionDate = institution.createdAt
			? formatFullDate(institution.createdAt)
			: "N/A";

		const formattedSubmissionTime = institution.createdAt
			? formatTime(institution.createdAt)
			: "N/A";

		const dynamicSchema = reviewSchema(institution);
		type LocalFormData = z.infer<typeof dynamicSchema>;

		const { handleSubmit, getValues, setValue, trigger, watch, control } =
			useForm<LocalFormData>({
				resolver: zodResolver(dynamicSchema),
				defaultValues: {
					name: institution.name ?? "",
					category: normalizeInstitutionCategory(institution.category),
					state: institution.state || STATE_OPTIONS[0],
					city: institution.city ?? "",
					address: institution.address ?? "",
					lat:
						institution.coords && Array.isArray(institution.coords)
							? String(institution.coords[0])
							: "",
					lon:
						institution.coords && Array.isArray(institution.coords)
							? String(institution.coords[1])
							: "",
					facebook: institution.socialMedia?.facebook ?? "",
					instagram: institution.socialMedia?.instagram ?? "",
					website: institution.socialMedia?.website ?? "",
					sourceUrl: institution.sourceUrl ?? "",
					contributorRemarks: institution.contributorRemarks ?? "",
					supportedPayment: institution.supportedPayment ?? ["duitnow"],
					qrContent: institution.qrContent ?? "",
				},
			});

		const facebookUrl = watch("facebook");
		const instagramUrl = watch("instagram");
		const websiteUrl = watch("website");
		const latVal = watch("lat");
		const lonVal = watch("lon");
		const latNum = Number.parseFloat(latVal ?? "");
		const lonNum = Number.parseFloat(lonVal ?? "");
		const hasValidCoords =
			latVal != null &&
			lonVal != null &&
			latVal.trim() !== "" &&
			lonVal.trim() !== "" &&
			!Number.isNaN(latNum) &&
			!Number.isNaN(lonNum) &&
			latNum >= -90 &&
			latNum <= 90 &&
			lonNum >= -180 &&
			lonNum <= 180;

		// Watched (not getValues) so the lookup buttons re-enable as the admin types.
		const nameVal = watch("name")?.trim() ?? "";
		const cityVal = watch("city")?.trim() ?? "";
		const stateVal = watch("state") ?? "";
		const hasLookupFields = Boolean(nameVal && cityVal && stateVal);
		const lookupQuery = `${nameVal}, ${cityVal}, ${stateVal}`;
		const searchQuery = `${nameVal} ${cityVal} ${stateVal}`;

		const generateGoogleSearchUrl = (
			platform: string,
			institutionName: string,
		) => {
			const query = `${platform} ${institutionName}`;
			return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
		};

		function buildPayload(formData: LocalFormData) {
			const {
				facebook,
				instagram,
				website,
				lat,
				lon,
				sourceUrl: _sourceUrl, // read-only
				contributorRemarks: _contributorRemarks, // read-only
				...rest
			} = formData;
			const latStr = lat?.trim() ?? "";
			const lonStr = lon?.trim() ?? "";
			const latNum = latStr ? Number.parseFloat(latStr) : Number.NaN;
			const lonNum = lonStr ? Number.parseFloat(lonStr) : Number.NaN;
			const coords: [number, number] | null =
				latStr &&
				lonStr &&
				!Number.isNaN(latNum) &&
				latNum >= -90 &&
				latNum <= 90 &&
				!Number.isNaN(lonNum) &&
				lonNum >= -180 &&
				lonNum <= 180
					? [latNum, lonNum]
					: null;
			return {
				...rest,
				coords,
				socialMedia: {
					facebook: facebook || undefined,
					instagram: instagram || undefined,
					website: website || undefined,
				},
			} as Parameters<typeof updateInstitutionByAdmin>[1];
		}

		async function saveChanges(data: LocalFormData) {
			startTransition(async () => {
				try {
					await updateInstitutionByAdmin(institution.id, buildPayload(data));
					toast.success("Changes saved");
					router.refresh();
				} catch (e) {
					console.error(e);
					toast.error("Failed to save changes");
				}
			});
		}

		// Expose save method
		useImperativeHandle(ref, () => ({
			save: async () => {
				const isValid = await trigger();
				if (!isValid) {
					toast.error("Validation errors – please fix form before approving");
					return false;
				}
				const values = getValues();
				try {
					await updateInstitutionByAdmin(institution.id, buildPayload(values));
					return true;
				} catch (e) {
					console.error(e);
					toast.error("Failed to save changes");
					return false;
				}
			},
			setQrContent: (qrContent: string) => {
				setValue("qrContent", qrContent, {
					shouldDirty: true,
					shouldValidate: true,
				});
			},
		}));

		return (
			<form onSubmit={handleSubmit(saveChanges)} className="space-y-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 p-5 pb-4">
						<CardTitle className="flex items-center gap-2 text-base font-semibold">
							<Building2 className="h-4 w-4 text-muted-foreground" />
							Institution
						</CardTitle>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => {
								const name = getValues("name");
								const city = getValues("city");
								const address = getValues("address");
								if (name) setValue("name", toTitleCase(name));
								if (city) setValue("city", toTitleCase(city));
								if (address) setValue("address", toTitleCase(address));
							}}
						>
							<CaseSensitive className="mr-2 h-4 w-4" />
							Capitalize
						</Button>
					</CardHeader>
					<CardContent className="space-y-5 p-5 pt-0">
						<Controller
							name="name"
							control={control}
							render={({ field, fieldState }) => (
								<Field>
									<FieldLabel htmlFor="name">Name</FieldLabel>
									<div className="flex gap-2">
										<Input
											{...field}
											id="name"
											className="flex-1"
											aria-invalid={fieldState.invalid}
											placeholder="Nama Institusi"
										/>
										<Popover
											open={checkExistingOpen}
											onOpenChange={(open) => {
												setCheckExistingOpen(open);
												if (!open) {
													setCheckExistingResults([]);
													setCheckExistingQuery("");
													setHasSearchedExisting(false);
												} else {
													setCheckExistingQuery(
														getValues("name")?.trim() ?? "",
													);
												}
											}}
										>
											<PopoverTrigger asChild>
												<Button
													type="button"
													variant="outline"
													size="icon"
													className="shrink-0"
													aria-label="Check for an existing institution"
													title="Check for an existing institution"
												>
													<Search className="h-4 w-4" />
												</Button>
											</PopoverTrigger>
											<PopoverContent
												className="max-h-80 w-96 overflow-y-auto"
												align="end"
											>
												<div className="space-y-3">
													<div className="text-sm font-medium">
														Check for an existing institution
													</div>
													<div className="flex gap-2">
														<Input
															placeholder="Partial name, city, etc."
															value={checkExistingQuery}
															onChange={(e) =>
																setCheckExistingQuery(e.target.value)
															}
															onKeyDown={(e) => {
																if (e.key === "Enter") {
																	e.preventDefault();
																	runCheckExistingSearch();
																}
															}}
															className="h-9 flex-1"
														/>
														<Button
															type="button"
															size="sm"
															className="h-9"
															disabled={
																!checkExistingQuery.trim() || isCheckingExisting
															}
															onClick={runCheckExistingSearch}
															aria-label="Search approved institutions"
														>
															{isCheckingExisting ? (
																<Loader2 className="h-4 w-4 animate-spin" />
															) : (
																<Search className="h-4 w-4" />
															)}
														</Button>
													</div>
													{isCheckingExisting ? (
														<p className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
															<Loader2 className="h-4 w-4 animate-spin" />
															Searching...
														</p>
													) : hasSearchedExisting &&
														checkExistingResults.length === 0 ? (
														<p className="rounded-md border border-dashed py-4 text-center text-sm text-muted-foreground">
															No matches found
														</p>
													) : checkExistingResults.length > 0 ? (
														<ul className="-mx-1 space-y-0.5">
															{checkExistingResults.map((inst) => (
																<li key={inst.id}>
																	<a
																		href={`/${inst.category}/${inst.slug}`}
																		target="_blank"
																		rel="noopener noreferrer"
																		className="flex items-center gap-2 rounded-md p-2 text-sm transition-colors hover:bg-muted"
																	>
																		<Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
																		<div className="min-w-0 flex-1">
																			<div className="truncate font-medium">
																				{inst.name}
																			</div>
																			<div className="text-xs text-muted-foreground">
																				{inst.city}
																				{inst.state ? `, ${inst.state}` : ""}
																			</div>
																		</div>
																		<ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
																	</a>
																</li>
															))}
														</ul>
													) : null}
													{checkExistingQuery.trim() && (
														<a
															href={`/?search=${encodeURIComponent(checkExistingQuery.trim())}`}
															target="_blank"
															rel="noopener noreferrer"
															className="block border-t pt-3 text-sm text-primary underline-offset-4 hover:underline"
														>
															View on homepage →
														</a>
													)}
												</div>
											</PopoverContent>
										</Popover>
									</div>
									{fieldState.invalid && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>
						<div className="grid gap-4 md:grid-cols-3">
							<Controller
								control={control}
								name="category"
								render={({ field, fieldState }) => (
									<Field>
										<FieldLabel htmlFor="category">Kategori</FieldLabel>
										<Select value={field.value} onValueChange={field.onChange}>
											<SelectTrigger
												id="category"
												aria-invalid={fieldState.invalid}
											>
												<SelectValue placeholder="Pilih kategori" />
											</SelectTrigger>
											<SelectContent>
												{CATEGORY_OPTIONS.map((c) => (
													<SelectItem key={c} value={c}>
														{toTitleCase(c)}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>
							<Controller
								control={control}
								name="state"
								render={({ field, fieldState }) => (
									<Field>
										<FieldLabel htmlFor="state">State</FieldLabel>
										<Select value={field.value} onValueChange={field.onChange}>
											<SelectTrigger
												id="state"
												aria-invalid={fieldState.invalid}
											>
												<SelectValue placeholder="Select state" />
											</SelectTrigger>
											<SelectContent>
												{STATE_OPTIONS.map((s) => (
													<SelectItem key={s} value={s} className="capitalize">
														{s}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>
							<Controller
								name="city"
								control={control}
								render={({ field, fieldState }) => (
									<Field>
										<FieldLabel htmlFor="city">City</FieldLabel>
										<Input
											{...field}
											id="city"
											aria-invalid={fieldState.invalid}
										/>
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="p-5 pb-4">
						<CardTitle className="flex items-center gap-2 text-base font-semibold">
							<MapPin className="h-4 w-4 text-muted-foreground" />
							Location
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-5 p-5 pt-0">
						{env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
							<div className="space-y-3">
								<AdminLocationMap
									lat={hasValidCoords ? latNum : null}
									lon={hasValidCoords ? lonNum : null}
									institutionName={institution.name ?? ""}
									onCoordsChange={(lat, lon) => {
										setValue("lat", String(lat));
										setValue("lon", String(lon));
									}}
									onPlaceSelect={(place) => {
										setValue("lat", String(place.lat));
										setValue("lon", String(place.lon));
										if (place.address != null)
											setValue("address", place.address);
										if (place.city != null) setValue("city", place.city);
										if (place.state != null) setValue("state", place.state);
										if (place.name != null) setValue("name", place.name);
									}}
								/>
								<div className="flex flex-wrap gap-2">
									{institution.sourceUrl && (
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={() =>
												window.open(institution.sourceUrl, "_blank")
											}
										>
											<ExternalLink className="mr-2 h-4 w-4" />
											Source URL
										</Button>
									)}
									<Button
										type="button"
										variant="outline"
										size="sm"
										disabled={!hasLookupFields}
										title={
											hasLookupFields
												? undefined
												: "Needs a name, city, and state"
										}
										onClick={() =>
											window.open(
												`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`,
												"_blank",
											)
										}
									>
										<Search className="mr-2 h-4 w-4" />
										Google Search
									</Button>
								</div>
							</div>
						) : (
							<div className="space-y-2">
								<span className="text-sm font-medium">Quick lookup</span>
								<div className="flex flex-wrap gap-2">
									<Button
										type="button"
										variant="outline"
										size="sm"
										disabled={!hasLookupFields}
										title={
											hasLookupFields
												? undefined
												: "Needs a name, city, and state"
										}
										onClick={() =>
											window.open(
												`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lookupQuery)}`,
												"_blank",
											)
										}
									>
										<MapPin className="mr-2 h-4 w-4" />
										Google Maps
									</Button>
									<Button
										type="button"
										variant="outline"
										size="sm"
										disabled={!hasLookupFields}
										title={
											hasLookupFields
												? undefined
												: "Needs a name, city, and state"
										}
										onClick={() =>
											window.open(
												`https://www.openstreetmap.org/search?query=${encodeURIComponent(lookupQuery)}`,
												"_blank",
											)
										}
									>
										<MapPin className="mr-2 h-4 w-4" />
										OSM
									</Button>
									<Button
										type="button"
										variant="outline"
										size="sm"
										disabled={!hasLookupFields}
										title={
											hasLookupFields
												? undefined
												: "Needs a name, city, and state"
										}
										onClick={() =>
											window.open(
												`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`,
												"_blank",
											)
										}
									>
										<Search className="mr-2 h-4 w-4" />
										Google Search
									</Button>
									{institution.sourceUrl && (
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={() =>
												window.open(institution.sourceUrl, "_blank")
											}
										>
											<ExternalLink className="mr-2 h-4 w-4" />
											Source URL
										</Button>
									)}
								</div>
							</div>
						)}

						<Controller
							name="address"
							control={control}
							render={({ field, fieldState }) => (
								<Field>
									<div className="flex flex-wrap items-center justify-between gap-2">
										<FieldLabel htmlFor="address">Address</FieldLabel>
										<Button
											type="button"
											variant="outline"
											size="sm"
											disabled={isFillingAddress || !hasValidCoords}
											title={
												hasValidCoords
													? "Reverse geocode from the coordinates below"
													: "Needs valid coordinates"
											}
											onClick={async () => {
												const latStr = getValues("lat")?.trim() ?? "";
												const lonStr = getValues("lon")?.trim() ?? "";
												const lat = Number.parseFloat(latStr);
												const lon = Number.parseFloat(lonStr);
												const currentAddress =
													getValues("address")?.trim() ?? "";

												setIsFillingAddress(true);
												try {
													const result = await reverseGeocodeInstitutionByAdmin(
														lat,
														lon,
													);
													if (result) {
														const newAddr = result.addressLine;
														if (currentAddress && currentAddress !== newAddr) {
															setReplaceAddressDialog({
																open: true,
																newAddress: newAddr,
															});
														} else {
															setValue("address", newAddr);
															toast.success("Address filled from coordinates");
														}
													} else {
														toast.error(
															"No address found for these coordinates",
														);
													}
												} catch {
													toast.error("Failed to fetch address");
												} finally {
													setIsFillingAddress(false);
												}
											}}
										>
											{isFillingAddress ? (
												<>
													<Loader2 className="mr-2 h-4 w-4 animate-spin" />
													Filling...
												</>
											) : (
												<>
													<MapPin className="mr-2 h-4 w-4" />
													Fill from coords
												</>
											)}
										</Button>
									</div>
									<Textarea
										{...field}
										id="address"
										rows={3}
										aria-invalid={fieldState.invalid}
									/>
									{fieldState.invalid && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>

						{/* Confirm overwrite address dialog */}
						<Dialog
							open={replaceAddressDialog.open}
							onOpenChange={(open) =>
								!open &&
								setReplaceAddressDialog({ open: false, newAddress: "" })
							}
						>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Replace address?</DialogTitle>
									<DialogDescription>
										Address field already has content. Replace with the
										reverse-geocoded result?
									</DialogDescription>
								</DialogHeader>
								<DialogFooter>
									<Button
										variant="outline"
										onClick={() =>
											setReplaceAddressDialog({
												open: false,
												newAddress: "",
											})
										}
									>
										Cancel
									</Button>
									<Button
										onClick={() => {
											setValue("address", replaceAddressDialog.newAddress);
											setReplaceAddressDialog({
												open: false,
												newAddress: "",
											});
											toast.success("Address replaced");
										}}
									>
										Replace
									</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>

						<div className="space-y-3">
							<div className="flex flex-wrap items-center justify-between gap-2">
								<span className="text-sm font-medium">Coordinates</span>
								<Button
									type="button"
									variant="outline"
									size="sm"
									disabled={isRecalibrating}
									title="Geocode from name, city, and state"
									onClick={async () => {
										const name = getValues("name");
										const city = getValues("city");
										const state = getValues("state");
										if (!name || !city || !state) {
											toast.error(
												"Name, city, and state required for recalibration",
											);
											return;
										}
										setIsRecalibrating(true);
										try {
											const result = await geocodeInstitution(
												name,
												city,
												state,
											);
											if (result) {
												setValue("lat", String(result[0]));
												setValue("lon", String(result[1]));
												toast.success("Coordinates updated from address");
											} else {
												toast.error("Could not geocode address");
											}
										} catch {
											toast.error("Failed to recalibrate coordinates");
										} finally {
											setIsRecalibrating(false);
										}
									}}
								>
									{isRecalibrating ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Recalibrating...
										</>
									) : (
										<>
											<MapPin className="mr-2 h-4 w-4" />
											Recalibrate
										</>
									)}
								</Button>
							</div>
							<div className="grid gap-4 sm:grid-cols-2">
								<Controller
									name="lat"
									control={control}
									render={({ field, fieldState }) => (
										<Field>
											<FieldLabel
												htmlFor="lat"
												className="text-sm font-normal text-muted-foreground"
											>
												Latitude
											</FieldLabel>
											<Input
												{...field}
												id="lat"
												placeholder="-90 to 90"
												aria-invalid={fieldState.invalid}
												onPaste={(e) => {
													const text = e.clipboardData?.getData("text") ?? "";
													const parsed = parseCoordPaste(text);
													if (parsed) {
														e.preventDefault();
														setValue("lat", String(parsed.lat));
														setValue("lon", String(parsed.lon));
														toast.success("Coordinates pasted");
													}
												}}
											/>
											{fieldState.invalid && (
												<FieldError errors={[fieldState.error]} />
											)}
										</Field>
									)}
								/>
								<Controller
									name="lon"
									control={control}
									render={({ field, fieldState }) => (
										<Field>
											<FieldLabel
												htmlFor="lon"
												className="text-sm font-normal text-muted-foreground"
											>
												Longitude
											</FieldLabel>
											<Input
												{...field}
												id="lon"
												placeholder="-180 to 180"
												aria-invalid={fieldState.invalid}
												onPaste={(e) => {
													const text = e.clipboardData?.getData("text") ?? "";
													const parsed = parseCoordPaste(text);
													if (parsed) {
														e.preventDefault();
														setValue("lat", String(parsed.lat));
														setValue("lon", String(parsed.lon));
														toast.success("Coordinates pasted");
													}
												}}
											/>
											{fieldState.invalid && (
												<FieldError errors={[fieldState.error]} />
											)}
										</Field>
									)}
								/>
							</div>
							<FieldDescription>
								Paste a "lat, lon" pair from Google Maps into either field to
								fill both.
							</FieldDescription>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="p-5 pb-4">
						<CardTitle className="flex items-center gap-2 text-base font-semibold">
							<Wallet className="h-4 w-4 text-muted-foreground" />
							Payment
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-5 p-5 pt-0">
						<Controller
							name="supportedPayment"
							control={control}
							render={({ field, fieldState }) => (
								<Field>
									<FieldLabel>Supported payment methods</FieldLabel>
									<div className="flex flex-wrap gap-2">
										{PAYMENT_OPTIONS.map((payment) => {
											const checked = field.value?.includes(payment) ?? false;
											return (
												<label
													key={payment}
													htmlFor={`payment-${payment}`}
													className={cn(
														"flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm capitalize transition-colors",
														checked
															? "border-primary bg-primary/5"
															: "hover:bg-accent hover:text-accent-foreground",
													)}
												>
													<Checkbox
														id={`payment-${payment}`}
														checked={checked}
														onCheckedChange={(next) => {
															const current = field.value ?? [];
															field.onChange(
																next
																	? [...current, payment]
																	: current.filter((v) => v !== payment),
															);
														}}
													/>
													{payment}
												</label>
											);
										})}
									</div>
									{fieldState.invalid && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>
						{/* Manual QR Content field (only shown if missing) */}
						{!institution.qrContent && (
							<Controller
								name="qrContent"
								control={control}
								render={({ field, fieldState }) => (
									<Field>
										<FieldLabel htmlFor="qrContent">
											Manual QR content
										</FieldLabel>
										<FieldDescription>
											Automatic extraction failed. Paste the decoded QR string
											from the panel on the right.
										</FieldDescription>
										<Textarea
											{...field}
											id="qrContent"
											rows={3}
											className="font-mono text-xs"
											placeholder="00020101021126..."
											aria-invalid={fieldState.invalid}
										/>
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="p-5 pb-4">
						<CardTitle className="flex items-center gap-2 text-base font-semibold">
							<Link2 className="h-4 w-4 text-muted-foreground" />
							Links
						</CardTitle>
					</CardHeader>
					<CardContent className="p-5 pt-0">
						<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
							<Controller
								name="facebook"
								control={control}
								render={({ field, fieldState }) => (
									<Field>
										<FieldLabel htmlFor="facebook">Facebook</FieldLabel>
										<div className="flex gap-2">
											<Input
												{...field}
												id="facebook"
												placeholder="https://facebook.com/..."
												aria-invalid={fieldState.invalid}
											/>
											{facebookUrl ? (
												<Button
													type="button"
													variant="outline"
													size="icon"
													className="shrink-0"
													aria-label="Open Facebook page"
													title="Open Facebook page"
													onClick={() => window.open(facebookUrl, "_blank")}
												>
													<ExternalLink className="h-4 w-4" />
												</Button>
											) : (
												<Button
													type="button"
													variant="outline"
													size="icon"
													className="shrink-0"
													aria-label="Search Facebook for this institution"
													title="Search Facebook for this institution"
													onClick={() =>
														window.open(
															generateGoogleSearchUrl(
																"facebook",
																institution.name || "",
															),
															"_blank",
														)
													}
												>
													<Search className="h-4 w-4" />
												</Button>
											)}
										</div>
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>
							<Controller
								name="instagram"
								control={control}
								render={({ field, fieldState }) => (
									<Field>
										<FieldLabel htmlFor="instagram">Instagram</FieldLabel>
										<div className="flex gap-2">
											<Input
												{...field}
												id="instagram"
												placeholder="https://instagram.com/..."
												aria-invalid={fieldState.invalid}
											/>
											{instagramUrl ? (
												<Button
													type="button"
													variant="outline"
													size="icon"
													className="shrink-0"
													aria-label="Open Instagram profile"
													title="Open Instagram profile"
													onClick={() => window.open(instagramUrl, "_blank")}
												>
													<ExternalLink className="h-4 w-4" />
												</Button>
											) : (
												<Button
													type="button"
													variant="outline"
													size="icon"
													className="shrink-0"
													aria-label="Search Instagram for this institution"
													title="Search Instagram for this institution"
													onClick={() =>
														window.open(
															generateGoogleSearchUrl(
																"instagram",
																institution.name || "",
															),
															"_blank",
														)
													}
												>
													<Search className="h-4 w-4" />
												</Button>
											)}
										</div>
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>
							<Controller
								name="website"
								control={control}
								render={({ field, fieldState }) => (
									<Field>
										<FieldLabel htmlFor="website">Website</FieldLabel>
										<div className="flex gap-2">
											<Input
												{...field}
												id="website"
												placeholder="https://..."
												aria-invalid={fieldState.invalid}
											/>
											{websiteUrl ? (
												<Button
													type="button"
													variant="outline"
													size="icon"
													className="shrink-0"
													aria-label="Open website"
													title="Open website"
													onClick={() => window.open(websiteUrl, "_blank")}
												>
													<ExternalLink className="h-4 w-4" />
												</Button>
											) : (
												<Button
													type="button"
													variant="outline"
													size="icon"
													className="shrink-0"
													aria-label="Search the web for this institution"
													title="Search the web for this institution"
													onClick={() =>
														window.open(
															generateGoogleSearchUrl(
																"website",
																institution.name || "",
															),
															"_blank",
														)
													}
												>
													<Search className="h-4 w-4" />
												</Button>
											)}
										</div>
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="p-5 pb-4">
						<CardTitle className="flex items-center gap-2 text-base font-semibold">
							<User className="h-4 w-4 text-muted-foreground" />
							Submission
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4 p-5 pt-0">
						<dl className="grid gap-4 sm:grid-cols-2">
							<div className="space-y-1.5">
								<dt className="text-sm font-medium">Submitted by</dt>
								<dd className="rounded-md border bg-muted/40 p-3">
									<div className="truncate text-sm font-medium">
										{institution.contributorName || "Anonymous user"}
									</div>
									{institution.contributorEmail && (
										<div className="truncate text-xs text-muted-foreground">
											{institution.contributorEmail}
										</div>
									)}
								</dd>
							</div>
							<div className="space-y-1.5">
								<dt className="text-sm font-medium">Submitted at</dt>
								<dd className="rounded-md border bg-muted/40 p-3">
									<div className="text-sm font-medium">
										{formattedSubmissionDate}
									</div>
									<div className="text-xs text-muted-foreground">
										{formattedSubmissionTime}
									</div>
								</dd>
							</div>
						</dl>
						<div className="space-y-1.5">
							<div className="text-sm font-medium">Source URL</div>
							{institution.sourceUrl ? (
								<a
									href={institution.sourceUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="flex items-center gap-2 rounded-md border bg-muted/40 p-3 text-sm text-primary underline-offset-4 hover:underline"
								>
									<span className="min-w-0 flex-1 truncate">
										{institution.sourceUrl}
									</span>
									<ExternalLink className="h-4 w-4 shrink-0" />
								</a>
							) : (
								<p className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
									No source URL provided
								</p>
							)}
						</div>
						<div className="space-y-1.5">
							<div className="text-sm font-medium">Contributor notes</div>
							{institution.contributorRemarks?.trim() ? (
								<p className="whitespace-pre-wrap rounded-md border bg-muted/40 p-3 text-sm leading-relaxed">
									{institution.contributorRemarks}
								</p>
							) : (
								<p className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
									No additional notes provided
								</p>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Submit button removed; actions handled in ReviewActions */}
			</form>
		);
	},
);

export default InstitutionReviewForm;

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ExternalLink, Loader2, MapPin, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import {
	forwardRef,
	useImperativeHandle,
	useState,
	useTransition,
} from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AdminLocationMap } from "@/app/(admin)/admin/institutions/pending/[id]/_components/admin-location-map";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Institution } from "@/db/institutions";
import { env } from "@/env";
import { geocodeInstitution } from "@/lib/geocode";
import {
	categories as CATEGORY_OPTIONS,
	supportedPayments as PAYMENT_OPTIONS,
	states as STATE_OPTIONS,
} from "@/lib/institution-constants";
import {
	reverseGeocodeInstitutionByAdmin,
	updateInstitutionByAdmin,
} from "../../_lib/queries";

type Props = {
	institution: Partial<Institution> & {
		id: number;
		sourceUrl?: string;
		contributorRemarks?: string;
		contributorName?: string | null;
		contributorId?: string | null;
		contributorEmail?: string | null;
		createdAt?: Date;
		reviewedAt?: Date | null;
		reviewedBy?: string | null;
		reviewerName?: string | null;
		adminNotes?: string | null;
	};
	isEditing: boolean;
	onEditComplete: () => void;
};

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

const formSchema = z.object({
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
	supportedPayment: z
		.array(z.enum(PAYMENT_OPTIONS))
		.min(1, "At least one payment method is required"),
	qrContent: z.string().optional(),
});
type FormData = z.infer<typeof formSchema>;

export type ApprovedFormHandle = {
	save: () => void;
};

const ApprovedInstitutionForm = forwardRef<ApprovedFormHandle, Props>(
	function ApprovedInstitutionForm(
		{ institution, isEditing, onEditComplete },
		ref,
	) {
		const router = useRouter();
		const [_isPending, startTransition] = useTransition();
		const [isRecalibrating, setIsRecalibrating] = useState(false);
		const [isFillingAddress, setIsFillingAddress] = useState(false);
		const [replaceAddressDialog, setReplaceAddressDialog] = useState<{
			open: boolean;
			newAddress: string;
		}>({ open: false, newAddress: "" });

		const formattedSubmissionDate = institution.createdAt
			? format(new Date(institution.createdAt), "d MMMM yyyy")
			: "N/A";

		const formattedSubmissionTime = institution.createdAt
			? format(new Date(institution.createdAt), "p")
			: "N/A";

		const formattedReviewDate = institution.reviewedAt
			? format(new Date(institution.reviewedAt), "d MMMM yyyy")
			: "N/A";

		const formattedReviewTime = institution.reviewedAt
			? format(new Date(institution.reviewedAt), "p")
			: "N/A";

		const {
			register,
			handleSubmit,
			getValues,
			setValue,
			watch,
			formState: { errors },
		} = useForm<FormData>({
			resolver: zodResolver(formSchema),
			defaultValues: {
				name: institution.name ?? "",
				category: institution.category || CATEGORY_OPTIONS[0],
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
				supportedPayment: institution.supportedPayment ?? ["duitnow"],
				qrContent: institution.qrContent ?? "",
			},
		});

		const facebookUrl = watch("facebook");
		const instagramUrl = watch("instagram");
		const websiteUrl = watch("website");
		const nameVal = watch("name");
		const cityVal = watch("city");
		const stateVal = watch("state");
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

		useImperativeHandle(ref, () => ({
			save: () => {
				handleSubmit(saveChanges)();
			},
		}));

		const generateGoogleSearchUrl = (
			platform: string,
			institutionName: string,
		) => {
			const query = `${platform} ${institutionName}`;
			return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
		};

		function buildPayload(formData: FormData) {
			const { facebook, instagram, website, lat, lon, ...rest } = formData;
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

		async function saveChanges(data: FormData) {
			startTransition(async () => {
				try {
					await updateInstitutionByAdmin(institution.id, buildPayload(data));
					toast.success("Changes saved successfully");
					router.refresh();
					onEditComplete();
				} catch (e) {
					console.error(e);
					toast.error("Failed to save changes");
				}
			});
		}

		return (
			<form onSubmit={handleSubmit(saveChanges)} className="space-y-6">
				{/* Institution Info Section */}
				<Card className="p-4 mb-6 rounded-lg shadow-sm">
					<CardHeader className="pb-4">
						<CardTitle className="text-xl font-semibold flex items-center gap-2">
							📋 Institution Info
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<label className="font-medium" htmlFor="name">
								Name
							</label>
							{isEditing ? (
								<>
									<Input id="name" {...register("name")} />
									{errors.name && (
										<p className="text-sm text-red-500">
											{errors.name.message}
										</p>
									)}
								</>
							) : (
								<div className="p-3 bg-muted rounded-md border">
									{institution.name}
								</div>
							)}
						</div>

						<div className="space-y-2">
							<label className="font-medium" htmlFor="category">
								Category
							</label>
							{isEditing ? (
								<>
									<select
										id="category"
										{...register("category")}
										className="w-full h-10 px-3 border rounded-md bg-background"
									>
										<option value="" disabled>
											Select category
										</option>
										{CATEGORY_OPTIONS.map((c) => (
											<option key={c} value={c} className="capitalize">
												{c}
											</option>
										))}
									</select>
									{errors.category && (
										<p className="text-sm text-red-500">
											{errors.category.message}
										</p>
									)}
								</>
							) : (
								<div className="p-3 bg-muted rounded-md border capitalize">
									{institution.category}
								</div>
							)}
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="space-y-2">
								<label htmlFor="state" className="font-medium">
									State
								</label>
								{isEditing ? (
									<>
										<select
											id="state"
											{...register("state")}
											className="w-full h-10 px-3 border rounded-md bg-background"
										>
											<option value="" disabled>
												Select state
											</option>
											{STATE_OPTIONS.map((s) => (
												<option key={s} value={s} className="capitalize">
													{s}
												</option>
											))}
										</select>
										{errors.state && (
											<p className="text-sm text-red-500">
												{errors.state.message}
											</p>
										)}
									</>
								) : (
									<div className="p-3 bg-muted rounded-md border">
										{institution.state}
									</div>
								)}
							</div>
							<div className="space-y-2">
								<label htmlFor="city" className="font-medium">
									City
								</label>
								{isEditing ? (
									<>
										<Input id="city" {...register("city")} />
										{errors.city && (
											<p className="text-sm text-red-500">
												{errors.city.message}
											</p>
										)}
									</>
								) : (
									<div className="p-3 bg-muted rounded-md border">
										{institution.city}
									</div>
								)}
							</div>
						</div>

						{isEditing && (
							<div className="space-y-2">
								<div className="font-medium text-muted-foreground">
									{env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
										? "Location Map"
										: "Quick Lookup"}
								</div>
								{env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
									<div className="space-y-2">
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
										{institution.sourceUrl && (
											<div className="flex flex-wrap gap-2">
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
											</div>
										)}
									</div>
								) : (
									<div className="flex flex-wrap gap-2">
										{(() => {
											const name = nameVal?.trim() ?? "";
											const city = cityVal?.trim() ?? "";
											const state = stateVal ?? "";
											const lookupQuery = `${name}, ${city}, ${state}`;
											const searchQuery = `${name} ${city} ${state}`;
											const hasLookupFields =
												Boolean(name) && Boolean(city) && Boolean(state);

											return (
												<>
													<Button
														type="button"
														variant="outline"
														size="sm"
														disabled={!hasLookupFields}
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
												</>
											);
										})()}
									</div>
								)}
							</div>
						)}

						<div className="space-y-2">
							<label htmlFor="address" className="font-medium">
								Address
							</label>
							{isEditing ? (
								<div className="flex items-start gap-2">
									<Textarea
										id="address"
										rows={3}
										className="flex-1"
										{...register("address")}
									/>
									<Button
										type="button"
										variant="outline"
										size="sm"
										className="shrink-0 mt-8"
										disabled={isFillingAddress || !hasValidCoords}
										onClick={async () => {
											const latStr = getValues("lat")?.trim() ?? "";
											const lonStr = getValues("lon")?.trim() ?? "";
											const lat = Number.parseFloat(latStr);
											const lon = Number.parseFloat(lonStr);
											const currentAddress = getValues("address")?.trim() ?? "";

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
													toast.error("No address found for these coordinates");
												}
											} catch {
												toast.error("Failed to fetch address");
											} finally {
												setIsFillingAddress(false);
											}
										}}
									>
										{isFillingAddress ? (
											<Loader2 className="h-4 w-4 animate-spin" />
										) : (
											"Fill Address from Coords"
										)}
									</Button>
								</div>
							) : (
								<div className="p-3 bg-muted rounded-md border min-h-[84px]">
									{institution.address || "No address provided"}
								</div>
							)}
						</div>

						{/* Replace address confirmation dialog */}
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

						<div className="space-y-2">
							<div className="font-medium">Coordinates</div>
							{isEditing ? (
								<>
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
										<div className="space-y-1">
											<label
												htmlFor="lat"
												className="text-sm text-muted-foreground"
											>
												Latitude
											</label>
											<Input
												id="lat"
												placeholder="-90 to 90"
												{...register("lat")}
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
											{errors.lat && (
												<p className="text-sm text-red-500">
													{errors.lat.message}
												</p>
											)}
										</div>
										<div className="space-y-1">
											<label
												htmlFor="lon"
												className="text-sm text-muted-foreground"
											>
												Longitude
											</label>
											<Input
												id="lon"
												placeholder="-180 to 180"
												{...register("lon")}
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
											{errors.lon && (
												<p className="text-sm text-red-500">
													{errors.lon.message}
												</p>
											)}
										</div>
									</div>
									<Button
										type="button"
										variant="outline"
										size="sm"
										disabled={isRecalibrating}
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
												<Loader2 className="h-4 w-4 animate-spin" />
												Recalibrating...
											</>
										) : (
											"Recalibrate"
										)}
									</Button>
								</>
							) : (
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div className="space-y-1">
										<label
											htmlFor="lat"
											className="text-sm text-muted-foreground"
										>
											Latitude
										</label>
										<Input
											id="lat"
											value={
												institution.coords && Array.isArray(institution.coords)
													? String(institution.coords[0])
													: "—"
											}
											disabled
											className="bg-muted"
										/>
									</div>
									<div className="space-y-1">
										<label
											htmlFor="lon"
											className="text-sm text-muted-foreground"
										>
											Longitude
										</label>
										<Input
											id="lon"
											value={
												institution.coords && Array.isArray(institution.coords)
													? String(institution.coords[1])
													: "—"
											}
											disabled
											className="bg-muted"
										/>
									</div>
								</div>
							)}
						</div>

						<div className="space-y-2">
							<div className="font-medium">Supported Payment Methods</div>
							{isEditing ? (
								<>
									<div className="flex flex-wrap gap-3">
										{PAYMENT_OPTIONS.map((payment) => (
											<label
												key={payment}
												className="flex items-center space-x-2"
											>
												<input
													type="checkbox"
													value={payment}
													{...register("supportedPayment")}
													className="rounded border-gray-300"
												/>
												<span className="capitalize">{payment}</span>
											</label>
										))}
									</div>
									{errors.supportedPayment && (
										<p className="text-sm text-red-500">
											{errors.supportedPayment.message}
										</p>
									)}
								</>
							) : (
								<div className="p-3 bg-muted rounded-md border">
									{institution.supportedPayment?.length
										? institution.supportedPayment
												.map((p) => p.toUpperCase())
												.join(", ")
										: "No payment methods specified"}
								</div>
							)}
						</div>
						{/* QR Content field */}
						<div className="space-y-2">
							<label htmlFor="qrContent" className="font-medium">
								QR Content
							</label>
							{isEditing ? (
								<Textarea
									id="qrContent"
									rows={3}
									placeholder="QR code content"
									{...register("qrContent")}
								/>
							) : (
								<div className="p-3 bg-muted rounded-md border min-h-[84px] text-sm break-all">
									{institution.qrContent || "No QR content available"}
								</div>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Social Media Links Section */}
				<Card className="p-4 mb-6 rounded-lg shadow-sm">
					<CardHeader className="pb-4">
						<CardTitle className="text-xl font-semibold flex items-center gap-2">
							🔗 Social Media Links
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<label htmlFor="facebook" className="font-medium">
								Facebook URL
							</label>
							{isEditing ? (
								<div className="flex gap-2">
									<Input
										id="facebook"
										placeholder="https://facebook.com/..."
										{...register("facebook")}
									/>
									{facebookUrl ? (
										<Button
											type="button"
											variant="outline"
											size="icon"
											onClick={() => window.open(facebookUrl, "_blank")}
										>
											<ExternalLink className="h-4 w-4" />
										</Button>
									) : (
										<Button
											type="button"
											variant="outline"
											size="icon"
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
							) : (
								<div className="flex gap-2">
									<div className="flex-1 p-3 bg-muted rounded-md border">
										{institution.socialMedia?.facebook || "No Facebook URL"}
									</div>
									{institution.socialMedia?.facebook && (
										<Button
											type="button"
											variant="outline"
											size="icon"
											onClick={() =>
												window.open(institution.socialMedia?.facebook, "_blank")
											}
										>
											<ExternalLink className="h-4 w-4" />
										</Button>
									)}
								</div>
							)}
							{errors.facebook && (
								<p className="text-sm text-red-500">
									{errors.facebook.message as string}
								</p>
							)}
						</div>

						<div className="space-y-2">
							<label htmlFor="instagram" className="font-medium">
								Instagram URL
							</label>
							{isEditing ? (
								<div className="flex gap-2">
									<Input
										id="instagram"
										placeholder="https://instagram.com/..."
										{...register("instagram")}
									/>
									{instagramUrl ? (
										<Button
											type="button"
											variant="outline"
											size="icon"
											onClick={() => window.open(instagramUrl, "_blank")}
										>
											<ExternalLink className="h-4 w-4" />
										</Button>
									) : (
										<Button
											type="button"
											variant="outline"
											size="icon"
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
							) : (
								<div className="flex gap-2">
									<div className="flex-1 p-3 bg-muted rounded-md border">
										{institution.socialMedia?.instagram || "No Instagram URL"}
									</div>
									{institution.socialMedia?.instagram && (
										<Button
											type="button"
											variant="outline"
											size="icon"
											onClick={() =>
												window.open(
													institution.socialMedia?.instagram,
													"_blank",
												)
											}
										>
											<ExternalLink className="h-4 w-4" />
										</Button>
									)}
								</div>
							)}
							{errors.instagram && (
								<p className="text-sm text-red-500">
									{errors.instagram.message as string}
								</p>
							)}
						</div>

						<div className="space-y-2">
							<label htmlFor="website" className="font-medium">
								Website URL
							</label>
							{isEditing ? (
								<div className="flex gap-2">
									<Input
										id="website"
										placeholder="https://..."
										{...register("website")}
									/>
									{websiteUrl ? (
										<Button
											type="button"
											variant="outline"
											size="icon"
											onClick={() => window.open(websiteUrl, "_blank")}
										>
											<ExternalLink className="h-4 w-4" />
										</Button>
									) : (
										<Button
											type="button"
											variant="outline"
											size="icon"
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
							) : (
								<div className="flex gap-2">
									<div className="flex-1 p-3 bg-muted rounded-md border">
										{institution.socialMedia?.website || "No Website URL"}
									</div>
									{institution.socialMedia?.website && (
										<Button
											type="button"
											variant="outline"
											size="icon"
											onClick={() =>
												window.open(institution.socialMedia?.website, "_blank")
											}
										>
											<ExternalLink className="h-4 w-4" />
										</Button>
									)}
								</div>
							)}
							{errors.website && (
								<p className="text-sm text-red-500">
									{errors.website.message as string}
								</p>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Contributor Info Section */}
				<Card className="p-4 mb-6 rounded-lg shadow-sm bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
					<CardHeader className="pb-4">
						<CardTitle className="text-xl font-semibold flex items-center gap-2">
							👤 Contributor Information
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<div className="font-medium text-muted-foreground">
									Submitted By
								</div>
								<div className="p-3 bg-background rounded-md border">
									<div className="font-medium">
										{institution.contributorName || "Anonymous User"}
									</div>
									{institution.contributorEmail && (
										<div className="text-sm text-muted-foreground">
											{institution.contributorEmail}
										</div>
									)}
								</div>
							</div>
							<div className="space-y-2">
								<div className="font-medium text-muted-foreground">
									Submission Date
								</div>
								<div className="p-3 bg-background rounded-md border">
									<div className="font-medium">{formattedSubmissionDate}</div>
									<div className="text-sm text-muted-foreground">
										{formattedSubmissionTime}
									</div>
								</div>
							</div>
						</div>
						<div className="space-y-2">
							<div className="font-medium text-muted-foreground">
								Source URL (if from social media)
							</div>
							<div className="flex gap-2">
								<div className="flex-1 p-3 bg-background rounded-md border">
									{institution.sourceUrl || "No source URL provided"}
								</div>
								{institution.sourceUrl && (
									<Button
										type="button"
										variant="outline"
										size="icon"
										onClick={() => window.open(institution.sourceUrl, "_blank")}
									>
										<ExternalLink className="h-4 w-4" />
									</Button>
								)}
							</div>
						</div>
						<div className="space-y-2">
							<div className="font-medium text-muted-foreground">
								Contributor Notes
							</div>
							<div className="p-3 bg-background rounded-md border min-h-[84px]">
								{institution.contributorRemarks ||
									"No additional notes provided"}
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Review Info Section */}
				<Card className="p-4 mb-6 rounded-lg shadow-sm bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
					<CardHeader className="pb-4">
						<CardTitle className="text-xl font-semibold flex items-center gap-2">
							✅ Review Information
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="space-y-2">
								<div className="font-medium text-muted-foreground">Status</div>
								<div className="p-3 bg-background rounded-md border">
									<div className="font-medium text-green-600">Approved</div>
								</div>
							</div>
							<div className="space-y-2">
								<div className="font-medium text-muted-foreground">
									Approved By
								</div>
								<div className="p-3 bg-background rounded-md border">
									<div className="font-medium">
										{institution.reviewerName ?? institution.reviewedBy ?? "-"}
									</div>
								</div>
							</div>
							<div className="space-y-2">
								<div className="font-medium text-muted-foreground">
									Review Date
								</div>
								<div className="p-3 bg-background rounded-md border">
									<div className="font-medium">{formattedReviewDate}</div>
									<div className="text-sm text-muted-foreground">
										{formattedReviewTime}
									</div>
								</div>
							</div>
						</div>
						{institution.adminNotes && (
							<div className="space-y-2">
								<div className="font-medium text-muted-foreground">
									Admin Notes
								</div>
								<div className="p-3 bg-background rounded-md border">
									{institution.adminNotes}
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			</form>
		);
	},
);

export default ApprovedInstitutionForm;

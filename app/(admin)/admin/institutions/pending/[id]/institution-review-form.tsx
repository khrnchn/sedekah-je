"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CaseSensitive, ExternalLink, Loader2, Search } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Institution } from "@/db/institutions";
import { geocodeInstitution } from "@/lib/geocode";
import {
	categories as CATEGORY_OPTIONS,
	supportedPayments as PAYMENT_OPTIONS,
	states as STATE_OPTIONS,
} from "@/lib/institution-constants";
import { toTitleCase } from "@/lib/utils";
import { updateInstitutionByAdmin } from "../../_lib/queries";

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

		const [isPending, startTransition] = useTransition();
		const [isRecalibrating, setIsRecalibrating] = useState(false);

		const formattedSubmissionDate = institution.createdAt
			? format(new Date(institution.createdAt), "d MMMM yyyy")
			: "N/A";

		const formattedSubmissionTime = institution.createdAt
			? format(new Date(institution.createdAt), "p")
			: "N/A";

		const dynamicSchema = reviewSchema(institution);
		type LocalFormData = z.infer<typeof dynamicSchema>;

		const {
			register,
			handleSubmit,
			getValues,
			setValue,
			trigger,
			watch,
			control,
		} = useForm<LocalFormData>({
			resolver: zodResolver(dynamicSchema),
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
				sourceUrl: institution.sourceUrl ?? "",
				contributorRemarks: institution.contributorRemarks ?? "",
				supportedPayment: institution.supportedPayment ?? ["duitnow"],
				qrContent: institution.qrContent ?? "",
			},
		});

		const facebookUrl = watch("facebook");
		const instagramUrl = watch("instagram");
		const websiteUrl = watch("website");

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
		}));

		return (
			<form onSubmit={handleSubmit(saveChanges)} className="space-y-6">
				{/* Institution Info Section */}
				<Card className="p-4 mb-6 rounded-lg shadow-sm">
					<CardHeader className="pb-4">
						<CardTitle className="text-xl font-semibold flex items-center gap-2">
							📋 Institution Info
						</CardTitle>
						<div className="flex justify-end">
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
								<CaseSensitive className="h-4 w-4" />
								Capitalize All
							</Button>
						</div>
					</CardHeader>
					<CardContent className="space-y-4">
						<FieldGroup>
							<Controller
								name="name"
								control={control}
								render={({ field, fieldState }) => (
									<Field>
										<FieldLabel>Name</FieldLabel>
										<Input
											{...field}
											id="name"
											aria-invalid={fieldState.invalid}
											placeholder="Nama Institusi"
										/>
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>
						</FieldGroup>
						<FieldGroup>
							<Controller
								control={control}
								name="category"
								render={({ field, fieldState }) => (
									<Field>
										<FieldLabel>Kategori</FieldLabel>
										<Select value={field.value} onValueChange={field.onChange}>
											<SelectTrigger className="w-full bg-background h-10">
												<SelectValue placeholder="Pilih kategori" />
											</SelectTrigger>
											<SelectContent>
												{CATEGORY_OPTIONS.map((c) => (
													<SelectItem key={c} value={c} className="capitalize">
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
						</FieldGroup>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<FieldGroup>
								<Controller
									control={control}
									name="state"
									render={({ field, fieldState }) => (
										<Field>
											<FieldLabel>State</FieldLabel>
											<Select
												value={field.value}
												onValueChange={field.onChange}
											>
												<SelectTrigger
													className="w-full bg-background h-10"
													id="state"
													aria-invalid={fieldState.invalid}
												>
													<SelectValue placeholder="Select state" />
												</SelectTrigger>
												<SelectContent>
													{STATE_OPTIONS.map((s) => (
														<SelectItem
															key={s}
															value={s}
															className="capitalize"
														>
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
							</FieldGroup>
							<FieldGroup>
								<Controller
									name="city"
									control={control}
									render={({ field, fieldState }) => (
										<Field>
											<FieldLabel>City</FieldLabel>
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
							</FieldGroup>
						</div>

						<FieldGroup>
							<Controller
								name="address"
								control={control}
								render={({ field, fieldState }) => (
									<Field>
										<FieldLabel>Address</FieldLabel>
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
						</FieldGroup>

						<FieldGroup>
							<FieldLabel>Coordinates</FieldLabel>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<Controller
									name="lat"
									control={control}
									render={({ field, fieldState }) => (
										<Field>
											<FieldLabel className="text-sm text-muted-foreground font-normal">
												Latitude
											</FieldLabel>
											<Input
												{...field}
												id="lat"
												placeholder="-90 to 90"
												aria-invalid={fieldState.invalid}
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
											<FieldLabel className="text-sm text-muted-foreground font-normal">
												Longitude
											</FieldLabel>
											<Input
												{...field}
												id="lon"
												placeholder="-180 to 180"
												aria-invalid={fieldState.invalid}
											/>
											{fieldState.invalid && (
												<FieldError errors={[fieldState.error]} />
											)}
										</Field>
									)}
								/>
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
										const result = await geocodeInstitution(name, city, state);
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
						</FieldGroup>

						<FieldGroup>
							<Controller
								name="supportedPayment"
								control={control}
								render={({ field, fieldState }) => (
									<Field>
										<FieldLabel>Supported Payment Methods</FieldLabel>
										<div className="flex flex-wrap gap-3 mt-2">
											{PAYMENT_OPTIONS.map((payment) => (
												<label
													key={payment}
													className="flex items-center space-x-2"
												>
													<input
														type="checkbox"
														value={payment}
														checked={field.value?.includes(payment)}
														onChange={(e) => {
															const valueCopy = [...(field.value || [])];
															if (e.target.checked) {
																field.onChange([...valueCopy, payment]);
															} else {
																field.onChange(
																	valueCopy.filter((v) => v !== payment),
																);
															}
														}}
														className="rounded border-gray-300"
													/>
													<span className="capitalize">{payment}</span>
												</label>
											))}
										</div>
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>
						</FieldGroup>
						{/* Manual QR Content field (only shown if missing) */}
						{!institution.qrContent && (
							<FieldGroup>
								<Controller
									name="qrContent"
									control={control}
									render={({ field, fieldState }) => (
										<Field>
											<FieldLabel>Manual QR Content</FieldLabel>
											<Textarea
												{...field}
												id="qrContent"
												rows={3}
												placeholder="Paste scanned QR text here"
												aria-invalid={fieldState.invalid}
											/>
											{fieldState.invalid && (
												<FieldError errors={[fieldState.error]} />
											)}
										</Field>
									)}
								/>
							</FieldGroup>
						)}
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
						<FieldGroup>
							<Controller
								name="facebook"
								control={control}
								render={({ field, fieldState }) => (
									<Field>
										<FieldLabel>Facebook URL</FieldLabel>
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
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>
						</FieldGroup>
						<FieldGroup>
							<Controller
								name="instagram"
								control={control}
								render={({ field, fieldState }) => (
									<Field>
										<FieldLabel>Instagram URL</FieldLabel>
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
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>
						</FieldGroup>
						<FieldGroup>
							<Controller
								name="website"
								control={control}
								render={({ field, fieldState }) => (
									<Field>
										<FieldLabel>Website URL</FieldLabel>
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
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>
						</FieldGroup>
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
									{/* <div className="text-sm text-muted-foreground">
										ID: {institution.contributorId || "anonymous"}
									</div> */}
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
						<FieldGroup>
							<Field>
								<FieldLabel className="text-muted-foreground font-medium">
									Source URL (if from social media)
								</FieldLabel>
								<div className="flex gap-2">
									<Input
										id="sourceUrl"
										{...register("sourceUrl")}
										disabled
										placeholder="No source URL provided"
									/>
									{institution.sourceUrl && (
										<Button
											type="button"
											variant="outline"
											size="icon"
											onClick={() =>
												window.open(institution.sourceUrl, "_blank")
											}
										>
											<ExternalLink className="h-4 w-4" />
										</Button>
									)}
								</div>
							</Field>
						</FieldGroup>
						<FieldGroup>
							<Field>
								<FieldLabel className="text-muted-foreground font-medium">
									Contributor Notes
								</FieldLabel>
								<Textarea
									id="contributorRemarks"
									rows={3}
									{...register("contributorRemarks")}
									disabled
									placeholder="No additional notes provided"
								/>
							</Field>
						</FieldGroup>
					</CardContent>
				</Card>

				{/* Review History Section */}
				<Card className="p-4 mb-6 rounded-lg shadow-sm border-dashed border-2 border-muted-foreground/30">
					<CardHeader className="pb-4">
						<CardTitle className="text-xl font-semibold flex items-center gap-2">
							📋 Review History
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex flex-col items-center justify-center py-8 text-center">
							<div className="text-6xl mb-4">🏗️</div>
							<h3 className="text-lg font-semibold text-muted-foreground mb-2">
								Coming Soon
							</h3>
							<p className="text-sm text-muted-foreground max-w-md">
								Review history will show previous admin actions, status changes,
								and notes for this institution submission.
							</p>
						</div>
						{/* Mock preview of what it will look like */}
						<div className="border-t pt-4">
							<div className="text-xs text-muted-foreground mb-3">Preview:</div>
							<div className="space-y-3 opacity-50">
								<div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
									<div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
									<div className="flex-1">
										<div className="flex items-center gap-2 text-sm">
											<span className="font-medium">Admin User</span>
											<span className="text-muted-foreground">•</span>
											<span className="text-muted-foreground">2 hours ago</span>
										</div>
										<div className="text-sm text-muted-foreground mt-1">
											Updated institution details and saved changes
										</div>
									</div>
								</div>
								<div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
									<div className="w-2 h-2 bg-amber-500 rounded-full mt-2" />
									<div className="flex-1">
										<div className="flex items-center gap-2 text-sm">
											<span className="font-medium">System</span>
											<span className="text-muted-foreground">•</span>
											<span className="text-muted-foreground">1 day ago</span>
										</div>
										<div className="text-sm text-muted-foreground mt-1">
											Institution submitted for review
										</div>
									</div>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Submit button removed; actions handled in ReviewActions */}
			</form>
		);
	},
);

export default InstitutionReviewForm;

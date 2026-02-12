"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Institution } from "@/db/institutions";
import { geocodeInstitution } from "@/lib/geocode";
import {
	categories as CATEGORY_OPTIONS,
	supportedPayments as PAYMENT_OPTIONS,
	states as STATE_OPTIONS,
} from "@/lib/institution-constants";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ExternalLink, Loader2, Search } from "lucide-react";
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
import { updateInstitutionByAdmin } from "../../_lib/queries";

type Props = {
	institution: Partial<Institution> & {
		id: number;
		sourceUrl?: string;
		contributorRemarks?: string;
		contributorName?: string | null;
		contributorId?: string | null;
		contributorEmail?: string | null;
		createdAt?: Date;
	};
};

export type ReviewFormHandle = {
	save: () => Promise<boolean>;
};

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

		// dynamically build schema based on whether original qrContent exists
		const dynamicSchema = z.object({
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
		type LocalFormData = z.infer<typeof dynamicSchema>;

		const {
			register,
			handleSubmit,
			getValues,
			setValue,
			trigger,
			watch,
			formState: { errors },
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
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<label className="font-medium" htmlFor="name">
								Name
							</label>
							<Input id="name" {...register("name")} />
							{errors.name && (
								<p className="text-sm text-red-500">{errors.name.message}</p>
							)}
						</div>

						<div className="space-y-2">
							<label className="font-medium" htmlFor="category">
								Category
							</label>
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
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div className="space-y-2">
								<label htmlFor="state" className="font-medium">
									State
								</label>
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
									<p className="text-sm text-red-500">{errors.state.message}</p>
								)}
							</div>
							<div className="space-y-2">
								<label htmlFor="city" className="font-medium">
									City
								</label>
								<Input id="city" {...register("city")} />
								{errors.city && (
									<p className="text-sm text-red-500">{errors.city.message}</p>
								)}
							</div>
						</div>

						<div className="space-y-2">
							<label htmlFor="address" className="font-medium">
								Address
							</label>
							<Textarea id="address" rows={3} {...register("address")} />
						</div>

						<div className="space-y-2">
							<div className="font-medium">Coordinates</div>
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
									/>
									{errors.lat && (
										<p className="text-sm text-red-500">{errors.lat.message}</p>
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
									/>
									{errors.lon && (
										<p className="text-sm text-red-500">{errors.lon.message}</p>
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
										const result = await geocodeInstitution(name, city, state);
										if (result) {
											setValue("lat", String(result[0]));
											setValue("lon", String(result[1]));
											toast.success("Coordinates updated from address");
										} else {
											toast.error("Could not geocode address");
										}
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
						</div>

						<div className="space-y-2">
							<div className="font-medium">Supported Payment Methods</div>
							<div className="flex flex-wrap gap-3">
								{PAYMENT_OPTIONS.map((payment) => (
									<label key={payment} className="flex items-center space-x-2">
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
						</div>
						{/* Manual QR Content field (only shown if missing) */}
						{!institution.qrContent && (
							<div className="space-y-2">
								<label htmlFor="qrContent" className="font-medium">
									Manual QR Content
								</label>
								<Textarea
									id="qrContent"
									rows={3}
									placeholder="Paste scanned QR text here"
									{...register("qrContent")}
								/>
								{errors.qrContent && (
									<p className="text-sm text-red-500">
										{errors.qrContent.message as string}
									</p>
								)}
							</div>
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
						<div className="space-y-2">
							<label htmlFor="facebook" className="font-medium">
								Facebook URL
							</label>
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
						<div className="space-y-2">
							<label
								htmlFor="sourceUrl"
								className="font-medium text-muted-foreground"
							>
								Source URL (if from social media)
							</label>
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
										onClick={() => window.open(institution.sourceUrl, "_blank")}
									>
										<ExternalLink className="h-4 w-4" />
									</Button>
								)}
							</div>
						</div>
						<div className="space-y-2">
							<label
								htmlFor="contributorRemarks"
								className="font-medium text-muted-foreground"
							>
								Contributor Notes
							</label>
							<Textarea
								id="contributorRemarks"
								rows={3}
								{...register("contributorRemarks")}
								disabled
								placeholder="No additional notes provided"
							/>
						</div>
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

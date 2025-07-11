"use client";

import {
	type InstitutionFormData,
	institutionFormSchema,
} from "@/app/(user)/contribute/_lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
	categories as CATEGORY_OPTIONS,
	states as STATE_OPTIONS,
} from "@/db/institutions";
import { useAuth } from "@/hooks/use-auth";
import { useLocationPrefill } from "@/hooks/use-location-prefill";
import { useQrExtraction } from "@/hooks/use-qr-extraction";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { submitInstitution } from "../_lib/submit-institution";

function SubmitButton({
	isSubmitting,
	qrExtracting,
	qrExtractionFailed,
	hasAttemptedExtraction,
	qrContent,
}: {
	isSubmitting: boolean;
	qrExtracting: boolean;
	qrExtractionFailed: boolean;
	hasAttemptedExtraction: boolean;
	qrContent: string | null;
}) {
	const isDisabled =
		isSubmitting || qrExtracting || (hasAttemptedExtraction && !qrContent);

	return (
		<Button type="submit" className="w-full" disabled={isDisabled}>
			{isSubmitting ? (
				<>
					<Spinner size="small" className="mr-2" />
					{qrExtracting ? "Extracting QR..." : "Submitting..."}
				</>
			) : (
				"Submit"
			)}
		</Button>
	);
}

export default function InstitutionForm() {
	const { user } = useAuth();

	/* QR extraction and social media */
	const {
		qrContent,
		qrExtracting,
		qrExtractionFailed,
		hasAttemptedExtraction,
		handleQrImageChange,
		clearQrContent,
	} = useQrExtraction();
	const [socialMediaExpanded, setSocialMediaExpanded] = useState(false);
	const [fileUploadMode, setFileUploadMode] = useState<"camera" | "gallery">(
		"gallery",
	);
	const [isSubmitting, setIsSubmitting] = useState(false);

	/* React Hook Form */
	const form = useForm<InstitutionFormData>({
		resolver: zodResolver(institutionFormSchema),
		defaultValues: {
			name: "",
			category: "",
			state: "",
			city: "",
			facebook: "",
			instagram: "",
			website: "",
			contributorRemarks: "",
			fromSocialMedia: false,
			sourceUrl: "",
			contributorId: user?.id ?? "",
			lat: "",
			lon: "",
			qrExtractionSuccess: false,
		},
	});

	const {
		register,
		handleSubmit,
		formState: { errors },
		setValue,
		reset,
		watch,
	} = form;

	const fromSocialMedia = watch("fromSocialMedia");

	/* Update contributorId when user changes */
	useEffect(() => {
		if (user?.id) {
			setValue("contributorId", user.id);
		}
	}, [user?.id, setValue]);

	/* Update QR extraction success status */
	useEffect(() => {
		setValue("qrExtractionSuccess", !!qrContent);
	}, [qrContent, setValue]);

	/* Location management via custom hook */
	const { loadingLocation, fetchLocation, prefilledCity, prefilledState } =
		useLocationPrefill(setValue);

	const [useCurrentLocation, setUseCurrentLocation] = useState(false);

	/* Form submission handler */
	const onSubmit = async (data: InstitutionFormData) => {
		setIsSubmitting(true);

		try {
			const formData = new FormData();

			// Add form fields
			for (const [key, value] of Object.entries(data)) {
				if (value !== undefined && value !== null) {
					formData.append(key, value.toString());
				}
			}

			// Add QR image file
			const qrImageInput = document.getElementById(
				"qrImage",
			) as HTMLInputElement;
			if (qrImageInput?.files?.[0]) {
				formData.append("qrImage", qrImageInput.files[0]);
			}

			const result = await submitInstitution(undefined, formData);

			if (result.status === "success") {
				toast.success("Thank you!", {
					description: "Your contribution is being reviewed.",
				});
				reset();
				if (qrImageInput) qrImageInput.value = "";
				clearQrContent();
			} else if (result.status === "error") {
				toast.error("Error", {
					description:
						"Please check your form. There are errors in the submitted data.",
				});
			}
		} catch (error) {
			console.error("Form submission error:", error);
			toast.error("Error", {
				description: "Something went wrong. Please try again.",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleLocationToggle = (checked: boolean) => {
		setUseCurrentLocation(checked);
		if (checked) {
			fetchLocation();
		} else {
			// Clear location data when unchecked
			setValue("lat", "");
			setValue("lon", "");
		}
	};

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			encType="multipart/form-data"
			className="space-y-6 max-w-lg mx-auto pb-20 md:pb-6"
		>
			<fieldset disabled={isSubmitting || qrExtracting} className="space-y-6">
				{/* Hidden contributorId */}
				<input
					type="hidden"
					{...register("contributorId")}
					value={user?.id ?? ""}
				/>
				<input type="hidden" {...register("lat")} />
				<input type="hidden" {...register("lon")} />
				<input type="hidden" {...register("qrExtractionSuccess")} />

				{/* Location toggle */}
				<div className="space-y-2">
					<div className="flex items-center space-x-2">
						<input
							type="checkbox"
							id="useCurrentLocation"
							checked={useCurrentLocation}
							onChange={(e) => handleLocationToggle(e.target.checked)}
							className="rounded"
							disabled={loadingLocation}
						/>
						<label htmlFor="useCurrentLocation" className="font-medium">
							I'm currently at this location
						</label>
					</div>
					{loadingLocation && (
						<p className="text-sm text-blue-600 pl-6">Detecting location…</p>
					)}
				</div>

				<div className="space-y-2">
					<label htmlFor="qrImage" className="font-medium">
						QR Code Image <span className="text-red-500">*</span>
					</label>
					<div className="flex gap-2 mb-2">
						<Button
							type="button"
							variant={fileUploadMode === "gallery" ? "default" : "outline"}
							size="sm"
							onClick={() => setFileUploadMode("gallery")}
						>
							Gallery
						</Button>
						<Button
							type="button"
							variant={fileUploadMode === "camera" ? "default" : "outline"}
							size="sm"
							onClick={() => setFileUploadMode("camera")}
						>
							Camera
						</Button>
					</div>
					<Input
						id="qrImage"
						type="file"
						name="qrImage"
						accept="image/*"
						capture={fileUploadMode === "camera" ? "environment" : undefined}
						onChange={handleQrImageChange}
					/>
					{qrExtracting && (
						<p className="text-sm text-blue-600">Extracting QR content...</p>
					)}
					{qrContent && (
						<div className="p-3 bg-green-50 border border-green-200 rounded-md">
							<p className="text-sm font-medium text-green-800">QR Content:</p>
							<p className="text-sm text-green-700 break-all">{qrContent}</p>
						</div>
					)}
					{!qrExtracting && qrExtractionFailed && hasAttemptedExtraction && (
						<div className="p-3 bg-red-50 border border-red-200 rounded-md">
							<p className="text-sm font-medium text-red-800">
								QR code could not be detected
							</p>
							<p className="text-sm text-red-700">Try these tips:</p>
							<ul className="text-sm text-red-600 list-disc list-inside mt-1 space-y-1">
								<li>Crop the image closer to the QR code</li>
								<li>Ensure the image is clear and not blurry</li>
								<li>Check that the QR code is not too small</li>
								<li>Make sure there's good lighting/contrast</li>
							</ul>
						</div>
					)}
					{!qrExtracting &&
						hasAttemptedExtraction &&
						!qrContent &&
						!qrExtractionFailed && (
							<div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
								<p className="text-sm font-medium text-yellow-800">
									Processing QR code...
								</p>
							</div>
						)}
					{errors.qrExtractionSuccess && (
						<p className="text-sm text-red-500">
							Please upload a valid QR code image that can be successfully
							processed
						</p>
					)}
				</div>

				<div className="space-y-2">
					<label htmlFor="name" className="font-medium">
						Institution Name <span className="text-red-500">*</span>
					</label>
					<Input
						id="name"
						{...register("name")}
						placeholder="Example: Al-Falah Mosque"
						className={errors.name ? "border-red-500" : ""}
					/>
					{errors.name && (
						<p className="text-sm text-red-500">{errors.name.message}</p>
					)}
				</div>

				<div className="space-y-2">
					<label htmlFor="category" className="font-medium">
						Category <span className="text-red-500">*</span>
					</label>
					<select
						id="category"
						{...register("category")}
						className={`w-full h-10 px-3 border rounded-md bg-background ${errors.category ? "border-red-500" : ""}`}
						defaultValue=""
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
						<p className="text-sm text-red-500">{errors.category.message}</p>
					)}
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div className="space-y-2">
						<label htmlFor="state" className="font-medium">
							State <span className="text-red-500">*</span>
						</label>
						<select
							id="state"
							{...register("state")}
							className={`w-full h-10 px-3 border rounded-md bg-background ${errors.state ? "border-red-500" : ""}`}
							defaultValue={prefilledState || ""}
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
							City <span className="text-red-500">*</span>
						</label>
						<Input
							id="city"
							{...register("city")}
							placeholder="Example: Shah Alam"
							className={errors.city ? "border-red-500" : ""}
							defaultValue={prefilledCity}
						/>
						{errors.city && (
							<p className="text-sm text-red-500">{errors.city.message}</p>
						)}
					</div>
				</div>

				<div className="space-y-2">
					<label htmlFor="contributorRemarks" className="font-medium">
						Additional Notes
					</label>
					<textarea
						id="contributorRemarks"
						{...register("contributorRemarks")}
						placeholder="Any additional notes or information about this institution..."
						className={`w-full min-h-[80px] px-3 py-2 border rounded-md bg-background resize-vertical ${errors.contributorRemarks ? "border-red-500" : ""}`}
					/>
					{errors.contributorRemarks && (
						<p className="text-sm text-red-500">
							{errors.contributorRemarks.message}
						</p>
					)}
				</div>

				<div className="space-y-2">
					<div className="flex items-center space-x-2">
						<input
							type="checkbox"
							id="fromSocialMedia"
							{...register("fromSocialMedia")}
							className="rounded"
						/>
						<label htmlFor="fromSocialMedia" className="font-medium">
							I got this information online
						</label>
					</div>
					{fromSocialMedia && (
						<div className="space-y-2 pl-6">
							<label htmlFor="sourceUrl" className="font-medium text-sm">
								Source URL
							</label>
							<Input
								id="sourceUrl"
								{...register("sourceUrl")}
								placeholder="https://facebook.com/post/123 or Instagram URL"
								className={errors.sourceUrl ? "border-red-500" : ""}
							/>
							{errors.sourceUrl && (
								<p className="text-sm text-red-500">
									{errors.sourceUrl.message}
								</p>
							)}
						</div>
					)}
				</div>

				<div className="space-y-2">
					<Button
						type="button"
						variant="ghost"
						onClick={() => setSocialMediaExpanded(!socialMediaExpanded)}
						className="flex items-center space-x-2 font-medium p-0 h-auto hover:bg-transparent"
					>
						<span>Social Media</span>
						{socialMediaExpanded ? (
							<ChevronUp className="w-4 h-4" />
						) : (
							<ChevronDown className="w-4 h-4" />
						)}
					</Button>
					{socialMediaExpanded && (
						<div className="space-y-2 pl-4 border-l-2 border-gray-200">
							<Input
								id="facebook"
								{...register("facebook")}
								placeholder="Facebook URL"
								className={errors.facebook ? "border-red-500" : ""}
							/>
							{errors.facebook && (
								<p className="text-sm text-red-500">
									{errors.facebook.message}
								</p>
							)}
							<Input
								id="instagram"
								{...register("instagram")}
								placeholder="Instagram URL"
								className={errors.instagram ? "border-red-500" : ""}
							/>
							{errors.instagram && (
								<p className="text-sm text-red-500">
									{errors.instagram.message}
								</p>
							)}
							<Input
								id="website"
								{...register("website")}
								placeholder="Website URL"
								className={errors.website ? "border-red-500" : ""}
							/>
							{errors.website && (
								<p className="text-sm text-red-500">{errors.website.message}</p>
							)}
						</div>
					)}
				</div>
				<SubmitButton
					isSubmitting={isSubmitting}
					qrExtracting={qrExtracting}
					qrExtractionFailed={qrExtractionFailed}
					hasAttemptedExtraction={hasAttemptedExtraction}
					qrContent={qrContent}
				/>
			</fieldset>
		</form>
	);
}

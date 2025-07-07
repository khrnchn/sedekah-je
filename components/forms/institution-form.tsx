"use client";

import {
	type SubmitInstitutionFormState,
	submitInstitution,
} from "@/app/_actions/submit-institution";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
	categories as CATEGORY_OPTIONS,
	states as STATE_OPTIONS,
} from "@/db/institutions";
import { useAuth } from "@/hooks/use-auth";
import {
	type InstitutionFormData,
	institutionFormSchema,
} from "@/lib/validations/institution";
import { zodResolver } from "@hookform/resolvers/zod";
import jsQR from "jsqr";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const initialState: SubmitInstitutionFormState = { status: "idle" };

export default function InstitutionForm() {
	const { user } = useAuth();
	const [state, formAction] = useFormState(submitInstitution, initialState);

	/* Step management */
	const [step, setStep] = useState<"question" | "form">("question");
	const [loadingLocation, setLoadingLocation] = useState(false);
	const [prefilledCity, setPrefilledCity] = useState("");
	const [prefilledState, setPrefilledState] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	/* QR extraction and social media */
	const [qrContent, setQrContent] = useState<string | null>(null);
	const [qrExtracting, setQrExtracting] = useState(false);
	const [socialMediaExpanded, setSocialMediaExpanded] = useState(false);

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
		},
	});

	const {
		register,
		formState: { errors },
		setValue,
		reset,
		watch,
	} = form;

	const fromSocialMedia = watch("fromSocialMedia");

	/** Geolocation + reverse-geocode */
	async function fetchLocation() {
		setLoadingLocation(true);
		try {
			navigator.geolocation.getCurrentPosition(
				async (pos) => {
					const { latitude, longitude } = pos.coords;
					try {
						const res = await fetch(
							`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
						);
						const data = await res.json();
						console.log("Reverse geocoding data:", data);

						if (data.address) {
							const city =
								data.address.town ||
								data.address.city ||
								data.address.village ||
								"";
							const state = data.address.state || "";
							setPrefilledCity(city);
							setPrefilledState(state);
							setValue("city", city);
							setValue("state", state as (typeof STATE_OPTIONS)[number]);
						}
					} catch (err) {
						console.error("Reverse geocoding failed", err);
					} finally {
						setLoadingLocation(false);
						setStep("form");
					}
				},
				() => {
					/* error */
					setLoadingLocation(false);
					setStep("form");
				},
			);
		} catch (e) {
			setLoadingLocation(false);
			setStep("form");
		}
	}

	/* Handle QR image upload and extraction */
	async function handleQrImageChange(
		event: React.ChangeEvent<HTMLInputElement>,
	) {
		const file = event.target.files?.[0];
		if (!file) {
			setQrContent(null);
			return;
		}

		setQrExtracting(true);
		setQrContent(null);

		try {
			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d");
			const img = new Image();

			img.onload = () => {
				canvas.width = img.width;
				canvas.height = img.height;
				ctx?.drawImage(img, 0, 0);

				const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
				if (imageData) {
					const code = jsQR(imageData.data, imageData.width, imageData.height);
					if (code) {
						setQrContent(code.data);
						toast("QR code detected successfully!", {
							description: "QR code content has been extracted.",
						});
					} else {
						toast("QR code could not be detected", {
							description: "Admin will extract QR content manually.",
						});
					}
				}
				setQrExtracting(false);
			};

			img.onerror = () => {
				toast("Error processing image", {
					description: "Unable to process image file.",
				});
				setQrExtracting(false);
			};

			img.src = URL.createObjectURL(file);
		} catch (error) {
			console.error("QR extraction error:", error);
			toast("Error extracting QR", {
				description: "Admin will extract QR content manually.",
			});
			setQrExtracting(false);
		}
	}

	/* Toast feedback */
	useEffect(() => {
		console.log("Form state updated:", state);
		if (state.status === "success") {
			console.log("Success state detected, showing toast");
			toast.success("Thank you!", {
				description: "Your contribution is being reviewed.",
			});
			reset();
			// Clear file input manually as it isn't controlled by React Hook Form
			const fileInput = document.getElementById(
				"qrImage",
			) as HTMLInputElement | null;
			if (fileInput) fileInput.value = "";
			setQrContent(null);
			setIsSubmitting(false);
		} else if (state.status === "error") {
			console.log("Server validation errors:", state.errors);
			toast.error("Error", {
				description:
					"Please check your form. There are errors in the submitted data.",
			});
			setIsSubmitting(false);
		}
	}, [state, reset]);

	/* onSubmit just toggles loading & lets native submission proceed */
	async function onClientSubmit(e: React.FormEvent<HTMLFormElement>) {
		const isValid = await form.trigger();
		if (!isValid) {
			e.preventDefault();
			toast.error("Error", {
				description: "Please check your form. There are errors.",
			});
			return;
		}

		toast("Submitting…", { description: "Processing your contribution." });
		setIsSubmitting(true);
	}

	if (step === "question") {
		return (
			<div className="max-w-lg mx-auto space-y-6 text-center">
				<h2 className="text-xl font-semibold">
					Are you currently at the institution location?
				</h2>
				<div className="flex justify-center gap-4">
					<Button onClick={fetchLocation} disabled={loadingLocation}>
						Yes
					</Button>
					<Button variant="secondary" onClick={() => setStep("form")}>
						No
					</Button>
				</div>
				{loadingLocation && <p>Detecting location…</p>}
			</div>
		);
	}

	return (
		<form
			action={formAction}
			onSubmit={onClientSubmit}
			encType="multipart/form-data"
			className="space-y-6 max-w-lg mx-auto pb-20 md:pb-6"
		>
			<fieldset disabled={isSubmitting} className="space-y-6">
				{/* Hidden contributorId */}
				<input
					type="hidden"
					{...register("contributorId")}
					value={user?.id ?? ""}
				/>

				<div className="space-y-2">
					<label htmlFor="qrImage" className="font-medium">
						QR Code Image <span className="text-red-500">*</span>
					</label>
					<Input
						id="qrImage"
						type="file"
						name="qrImage"
						accept="image/*"
						required
						capture="environment"
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
							I got this information from social media
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
					<button
						type="button"
						onClick={() => setSocialMediaExpanded(!socialMediaExpanded)}
						className="flex items-center space-x-2 font-medium text-gray-700 hover:text-gray-900"
					>
						<span>Social Media</span>
						{socialMediaExpanded ? (
							<ChevronUp className="w-4 h-4" />
						) : (
							<ChevronDown className="w-4 h-4" />
						)}
					</button>
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

				<Button type="submit" className="w-full" disabled={isSubmitting}>
					{isSubmitting ? (
						<>
							<Spinner size="small" className="mr-2" />
							Submitting...
						</>
					) : (
						"Submit"
					)}
				</Button>
			</fieldset>
		</form>
	);
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
	lazy,
	Suspense,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import {
	extendedInstitutionFormClientSchema,
	type InstitutionFormData,
} from "@/app/(user)/contribute/_lib/validations";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/use-auth";
import {
	categories as CATEGORY_OPTIONS,
	states as STATE_OPTIONS,
} from "@/lib/institution-constants";
import { cn, toTitleCase } from "@/lib/utils";
import { submitInstitution } from "../_lib/submit-institution";

// Lazy load heavy features for better mobile performance
const QRExtractionFeature = lazy(() => import("./qr-extraction-feature"));
const LocationServicesFeature = lazy(
	() => import("./location-services-feature"),
);

function SubmitButton({
	isSubmitting,
	qrExtracting,
	hasFile,
	isAuthenticated,
}: {
	isSubmitting: boolean;
	qrExtracting: boolean;
	qrExtractionFailed: boolean;
	hasFile: boolean;
	isAuthenticated: boolean;
}) {
	const isDisabled =
		isSubmitting || qrExtracting || !hasFile || !isAuthenticated;

	return (
		<Button
			type="submit"
			className="w-full h-12 text-base" // Larger touch target for mobile
			disabled={isDisabled}
		>
			{isSubmitting ? (
				<>
					<Spinner size="small" className="mr-2" />
					Menghantar...
				</>
			) : !isAuthenticated ? (
				"Log masuk untuk hantar"
			) : (
				"Hantar"
			)}
		</Button>
	);
}

// Basic fallback components for progressive enhancement
function QRUploadSkeleton() {
	return (
		<div className="space-y-2">
			<Skeleton className="h-6 w-1/2" />
			<Skeleton className="h-12 w-full" />
		</div>
	);
}

function BasicLocationInput() {
	return (
		<div className="space-y-2">
			<p className="text-sm text-gray-600">
				Sila isi koordinat secara manual jika diperlukan
			</p>
		</div>
	);
}

export default function InstitutionFormOptimized() {
	const { user } = useAuth();

	/* QR and location state */
	const [qrContent, setQrContent] = useState<string | null>(null);
	const [qrStatus, setQrStatus] = useState({
		qrExtracting: false,
		qrExtractionFailed: false,
		hasAttemptedExtraction: false,
		hasFile: false,
	});
	const clearQrContentRef = useRef<(() => void) | null>(null);
	const setClearQrContent = useCallback((fn: (() => void) | null) => {
		clearQrContentRef.current = fn;
	}, []);

	const [socialMediaExpanded, setSocialMediaExpanded] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [enableAdvancedFeatures, setEnableAdvancedFeatures] = useState(false);

	/* React Hook Form */
	const form = useForm<InstitutionFormData>({
		resolver: zodResolver(extendedInstitutionFormClientSchema),
		defaultValues: {
			name: "",
			category: undefined,
			state: undefined,
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
		},
	});

	const {
		register,
		control,
		handleSubmit,
		formState: { errors },
		setValue,
		reset,
		watch,
	} = form;

	const fromSocialMedia = watch("fromSocialMedia");

	/* Progressive Enhancement: Enable advanced features after initial load */
	useEffect(() => {
		// Some mobile browsers (e.g., Safari iOS) don’t implement requestIdleCallback.
		// Fallback to setTimeout to avoid a ReferenceError and keep the enhancement logic working.
		const idleCb =
			typeof window !== "undefined" && "requestIdleCallback" in window
				? (
						window as Window & {
							requestIdleCallback: (cb: IdleRequestCallback) => number;
						}
					).requestIdleCallback
				: (cb: () => void) => window.setTimeout(cb, 0);

		const idleCancel =
			typeof window !== "undefined" && "cancelIdleCallback" in window
				? (
						window as Window & {
							cancelIdleCallback: (handle: number) => void;
						}
					).cancelIdleCallback
				: (id: number) => window.clearTimeout(id);

		const handle = idleCb(() => {
			setEnableAdvancedFeatures(true);
		});

		return () => idleCancel(handle);
	}, []);

	/* Update contributorId when user changes */
	useEffect(() => {
		if (user?.id) {
			setValue("contributorId", user.id);
		}
	}, [user?.id, setValue]);

	/* Form submission handler */
	const onSubmit = async (data: InstitutionFormData) => {
		// Authentication check
		if (!user?.id) {
			toast.error("Ralat", {
				description:
					"Anda mesti log masuk untuk menyumbang. Sila log masuk dan cuba lagi.",
			});
			return;
		}

		setIsSubmitting(true);
		// Clear previous general errors
		form.clearErrors("root.general");

		try {
			const formData = new FormData();

			// Add form fields
			for (const [key, value] of Object.entries(data)) {
				if (value !== undefined && value !== null) {
					formData.append(key, value.toString());
				}
			}

			// Manually append QR content from state
			if (qrContent) {
				formData.append("qrContent", qrContent);
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
				toast.success("Jazakallahu khair!", {
					description: "Sumbangan anda sedang disemak.",
				});
				reset();
				if (clearQrContentRef.current) {
					clearQrContentRef.current();
				}
			} else if (result.status === "error") {
				// Handle specific field errors
				if (result.errors) {
					for (const [key, messages] of Object.entries(result.errors)) {
						if (key !== "general") {
							form.setError(key as keyof InstitutionFormData, {
								type: "manual",
								message: messages.join(", "),
							});
						}
					}
				}
				// Handle general, non-field-specific errors
				const generalError = result.errors?.general?.[0];
				if (generalError) {
					form.setError("root.general", {
						type: "manual",
						message: generalError,
					});
				} else {
					toast.error("Ralat", {
						description:
							"Sila semak borang anda. Terdapat ralat dalam data yang dihantar.",
					});
				}
			}
		} catch (error) {
			console.error("Form submission error:", error);
			toast.error("Ralat", {
				description: "Sesuatu yang tidak kena berlaku. Sila cuba lagi.",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			encType="multipart/form-data"
			className="space-y-6 max-w-lg mx-auto pb-20 md:pb-6 px-4 md:px-0"
		>
			<fieldset
				disabled={isSubmitting || qrStatus.qrExtracting}
				className="space-y-6"
			>
				{/* Hidden fields */}
				<input
					type="hidden"
					{...register("contributorId")}
					value={user?.id ?? ""}
				/>

				{/* Progressive location services */}
				{enableAdvancedFeatures ? (
					<Suspense fallback={<BasicLocationInput />}>
						<LocationServicesFeature setValue={setValue} />
					</Suspense>
				) : (
					<BasicLocationInput />
				)}

				{/* Progressive QR extraction */}
				<div className="space-y-4">
					<Suspense fallback={<QRUploadSkeleton />}>
						<QRExtractionFeature
							isSubmitting={isSubmitting}
							onQrContentChange={setQrContent}
							onStatusChange={setQrStatus}
							onClearQrContent={setClearQrContent}
						/>
					</Suspense>
				</div>

				{/* Institution name - mobile optimized */}
				<Controller
					control={control}
					name="name"
					render={({ field, fieldState }) => (
						<Field className="space-y-2" {...field}>
							<FieldLabel htmlFor="name" className="font-medium text-base">
								Nama Institusi <span className="text-red-500">*</span>
							</FieldLabel>
							<Input
								id="name"
								{...register("name")}
								placeholder="Contoh: Masjid Al-Falah"
								className={`h-12 text-base ${fieldState.invalid ? "border-red-500" : ""}`}
								autoComplete="organization"
							/>
							{errors.name && (
								<p className="text-sm text-red-500">{errors.name.message}</p>
							)}
						</Field>
					)}
				/>

				{/* Category - mobile optimized */}
				<Controller
					name="category"
					control={control}
					render={({ field, fieldState }) => (
						<Field className="space-y-2" {...field}>
							<FieldLabel className="font-medium text-base">
								Kategory <span className="text-red-500">*</span>
							</FieldLabel>
							<Select value={field.value ?? ""} onValueChange={field.onChange}>
								<SelectTrigger
									id="category"
									className={cn("w-full h-12 text-base")}
									aria-invalid={fieldState.invalid}
								>
									<SelectValue placeholder="Pilih kategori" />
								</SelectTrigger>
								<SelectContent>
									{CATEGORY_OPTIONS.map((c) => (
										<SelectItem key={c} value={c} className="capitalize">
											{toTitleCase(c)}
										</SelectItem>
									))}
								</SelectContent>
								{fieldState.invalid && (
									<FieldError errors={[fieldState.error]} />
								)}
							</Select>
						</Field>
					)}
				/>

				{/* Location - mobile optimized grid */}
				<div className="grid grid-cols-1 gap-4">
					<Controller
						name="state"
						control={control}
						render={({ field, fieldState }) => (
							<Field className="space-y-2">
								<FieldLabel htmlFor="state" className="font-medium text-base">
									Negeri <span className="text-red-500">*</span>
								</FieldLabel>
								<Select
									value={field.value ?? ""}
									onValueChange={field.onChange}
								>
									<SelectTrigger
										id="state"
										className={cn("w-full h-12 text-base")}
										aria-invalid={fieldState.invalid}
									>
										<SelectValue placeholder="Pilih negeri" />
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
							<Field className="space-y-2">
								<FieldLabel htmlFor="city" className="font-medium text-base">
									Bandar <span className="text-red-500">*</span>
								</FieldLabel>
								<Input
									id="city"
									{...field}
									placeholder="Contoh: Shah Alam"
									className={cn(
										"h-12 text-base",
										fieldState.invalid && "border-red-500",
									)}
									autoComplete="address-level2"
								/>
								{fieldState.invalid && (
									<FieldError errors={[fieldState.error]} />
								)}
							</Field>
						)}
					/>
				</div>

				{/* Coordinates - mobile optimized grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<Controller
						name="lat"
						control={control}
						render={({ field, fieldState }) => (
							<Field className="space-y-2">
								<FieldLabel htmlFor="lat" className="font-medium text-base">
									Latitud
								</FieldLabel>
								<Input
									id="lat"
									type="number"
									step="any"
									{...field}
									placeholder="Contoh: 3.1390"
									className={cn(
										"h-12 text-base",
										fieldState.invalid && "border-red-500",
									)}
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
							<Field className="space-y-2">
								<FieldLabel htmlFor="lon" className="font-medium text-base">
									Longitud
								</FieldLabel>
								<Input
									id="lon"
									type="number"
									step="any"
									{...field}
									placeholder="Contoh: 101.6869"
									className={cn(
										"h-12 text-base",
										fieldState.invalid && "border-red-500",
									)}
								/>
								{fieldState.invalid && (
									<FieldError errors={[fieldState.error]} />
								)}
							</Field>
						)}
					/>
				</div>
				<p className="text-sm text-muted-foreground">
					Koordinat adalah pilihan. Jika tidak diisi, sistem akan cuba mencari
					koordinat secara automatik.
				</p>

				{/* Additional info */}
				<Controller
					name="contributorRemarks"
					control={control}
					render={({ field, fieldState }) => (
						<Field className="space-y-2">
							<FieldLabel
								htmlFor="contributorRemarks"
								className="font-medium text-base"
							>
								Info Tambahan
							</FieldLabel>
							<textarea
								id="contributorRemarks"
								{...field}
								placeholder="Info tambahan berkenaan institusi ini"
								className={cn(
									"w-full min-h-[100px] px-3 py-2 text-base border rounded-md bg-background resize-vertical",
									fieldState.invalid && "border-red-500",
								)}
							/>
							{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
						</Field>
					)}
				/>

				{/* Social media source */}
				<Field className="space-y-2">
					<Controller
						name="fromSocialMedia"
						control={control}
						render={({ field }) => (
							<div className="flex items-center space-x-3">
								<input
									type="checkbox"
									id="fromSocialMedia"
									checked={field.value}
									onChange={field.onChange}
									onBlur={field.onBlur}
									name={field.name}
									ref={field.ref}
									className="rounded w-4 h-4"
								/>
								<FieldLabel
									htmlFor="fromSocialMedia"
									className="font-medium text-base"
								>
									Saya dapat maklumat QR ini dari media sosial
								</FieldLabel>
							</div>
						)}
					/>
					{fromSocialMedia && (
						<Controller
							name="sourceUrl"
							control={control}
							render={({ field, fieldState }) => (
								<Field className="space-y-2 pl-6">
									<FieldLabel
										htmlFor="sourceUrl"
										className="font-medium text-sm"
									>
										Alamat Web
									</FieldLabel>
									<Input
										id="sourceUrl"
										{...field}
										placeholder="https://facebook.com/post/123 atau URL Instagram"
										className={cn(
											"h-12 text-base",
											fieldState.invalid && "border-red-500",
										)}
										type="url"
									/>
									{fieldState.invalid && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>
					)}
				</Field>

				{/* Collapsible social media section */}
				<div className="space-y-2">
					<Button
						type="button"
						variant="ghost"
						onClick={() => setSocialMediaExpanded(!socialMediaExpanded)}
						className="flex items-center space-x-2 font-medium p-0 h-auto hover:bg-transparent text-base"
					>
						<span>Social Media (Optional)</span>
						{socialMediaExpanded ? (
							<ChevronUp className="w-4 h-4" />
						) : (
							<ChevronDown className="w-4 h-4" />
						)}
					</Button>
					{socialMediaExpanded && (
						<div className="space-y-3 pl-4 border-l-2 border-gray-200">
							<Controller
								name="facebook"
								control={control}
								render={({ field, fieldState }) => (
									<Field className="space-y-2">
										<FieldLabel
											htmlFor="facebook"
											className="font-medium text-sm"
										>
											Facebook
										</FieldLabel>
										<Input
											id="facebook"
											{...field}
											placeholder="Facebook URL"
											className={cn(
												"h-12 text-base",
												fieldState.invalid && "border-red-500",
											)}
											type="url"
										/>
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
									<Field className="space-y-2">
										<FieldLabel
											htmlFor="instagram"
											className="font-medium text-sm"
										>
											Instagram
										</FieldLabel>
										<Input
											id="instagram"
											{...field}
											placeholder="Instagram URL"
											className={cn(
												"h-12 text-base",
												fieldState.invalid && "border-red-500",
											)}
											type="url"
										/>
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
									<Field className="space-y-2">
										<FieldLabel
											htmlFor="website"
											className="font-medium text-sm"
										>
											Website
										</FieldLabel>
										<Input
											id="website"
											{...field}
											placeholder="Website URL"
											className={cn(
												"h-12 text-base",
												fieldState.invalid && "border-red-500",
											)}
											type="url"
										/>
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>
						</div>
					)}
				</div>

				<SubmitButton
					isSubmitting={isSubmitting}
					qrExtracting={qrStatus.qrExtracting}
					qrExtractionFailed={qrStatus.qrExtractionFailed}
					hasFile={qrStatus.hasFile}
					isAuthenticated={!!user?.id}
				/>
			</fieldset>

			{errors.root?.general && (
				<div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-center">
					<p className="text-sm font-medium text-red-800">
						{errors.root.general.message}
					</p>
				</div>
			)}
		</form>
	);
}

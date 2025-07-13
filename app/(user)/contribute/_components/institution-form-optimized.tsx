"use client";

import {
	type InstitutionFormData,
	extendedInstitutionFormClientSchema,
} from "@/app/(user)/contribute/_lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/use-auth";
import {
	categories as CATEGORY_OPTIONS,
	states as STATE_OPTIONS,
} from "@/lib/institution-constants";
import { zodResolver } from "@hookform/resolvers/zod";
import { Turnstile } from "@marsidev/react-turnstile";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
	Suspense,
	lazy,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { submitInstitution } from "../_lib/submit-institution";

// Lazy load heavy features for better mobile performance
const QRExtractionFeature = lazy(() => import("./qr-extraction-feature"));
const LocationServicesFeature = lazy(
	() => import("./location-services-feature"),
);

function SubmitButton({
	isSubmitting,
	qrExtracting,
	qrExtractionFailed,
	hasAttemptedExtraction,
	qrContent,
	turnstileToken,
}: {
	isSubmitting: boolean;
	qrExtracting: boolean;
	qrExtractionFailed: boolean;
	hasAttemptedExtraction: boolean;
	qrContent: string | null;
	turnstileToken: string;
}) {
	const isDisabled =
		isSubmitting ||
		qrExtracting ||
		(hasAttemptedExtraction && !qrContent) ||
		!turnstileToken;

	return (
		<Button
			type="submit"
			className="w-full h-12 text-base" // Larger touch target for mobile
			disabled={isDisabled}
		>
			{isSubmitting ? (
				<>
					<Spinner size="small" className="mr-2" />
					{qrExtracting ? "Mengekstrak kandungan QR" : "Menghantar..."}
				</>
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
	});
	const clearQrContentRef = useRef<(() => void) | null>(null);
	const setClearQrContent = useCallback((fn: (() => void) | null) => {
		clearQrContentRef.current = fn;
	}, []);

	const [socialMediaExpanded, setSocialMediaExpanded] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [enableAdvancedFeatures, setEnableAdvancedFeatures] = useState(false);
	const [turnstileToken, setTurnstileToken] = useState<string>(
		process.env.NODE_ENV === "development" ? "dev-bypass-token" : "",
	);

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
			qrExtractionSuccess: false,
			turnstileToken:
				process.env.NODE_ENV === "development" ? "dev-bypass-token" : "",
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

	/* Progressive Enhancement: Enable advanced features after initial load */
	useEffect(() => {
		const handle = requestIdleCallback(() => {
			setEnableAdvancedFeatures(true);
		});
		return () => cancelIdleCallback(handle);
	}, []);

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

	/* Update Turnstile token */
	useEffect(() => {
		setValue("turnstileToken", turnstileToken);
	}, [turnstileToken, setValue]);

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
				toast.success("Jazakallahu khair. Terima kasih!", {
					description: "Sumbangan anda sedang disemak.",
				});
				reset();
				if (clearQrContentRef.current) {
					clearQrContentRef.current();
				}
			} else if (result.status === "error") {
				toast.error("Ralat", {
					description:
						"Sila semak borang anda. Terdapat ralat dalam data yang dihantar.",
				});
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
				<input type="hidden" {...register("lat")} />
				<input type="hidden" {...register("lon")} />
				<input type="hidden" {...register("qrExtractionSuccess")} />
				<input type="hidden" {...register("turnstileToken")} />

				{/* Progressive location services */}
				{enableAdvancedFeatures ? (
					<Suspense fallback={<BasicLocationInput />}>
						<LocationServicesFeature setValue={setValue} />
					</Suspense>
				) : (
					<BasicLocationInput />
				)}

				{/* Progressive QR extraction */}
				{enableAdvancedFeatures ? (
					<Suspense fallback={<QRUploadSkeleton />}>
						<QRExtractionFeature
							errors={errors}
							isSubmitting={isSubmitting}
							onQrContentChange={setQrContent}
							onStatusChange={setQrStatus}
							onClearQrContent={setClearQrContent}
						/>
					</Suspense>
				) : (
					<QRUploadSkeleton />
				)}

				{/* Institution name - mobile optimized */}
				<div className="space-y-2">
					<label htmlFor="name" className="font-medium text-base">
						Nama Institusi <span className="text-red-500">*</span>
					</label>
					<Input
						id="name"
						{...register("name")}
						placeholder="Contoh: Masjid Al-Falah"
						className={`h-12 text-base ${errors.name ? "border-red-500" : ""}`}
						autoComplete="organization"
					/>
					{errors.name && (
						<p className="text-sm text-red-500">{errors.name.message}</p>
					)}
				</div>

				{/* Category - mobile optimized */}
				<div className="space-y-2">
					<label htmlFor="category" className="font-medium text-base">
						Kategori <span className="text-red-500">*</span>
					</label>
					<select
						id="category"
						{...register("category")}
						className={`w-full h-12 px-3 text-base border rounded-md bg-background ${errors.category ? "border-red-500" : ""}`}
						defaultValue=""
					>
						<option value="" disabled>
							Pilih kategori
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

				{/* Location - mobile optimized grid */}
				<div className="grid grid-cols-1 gap-4">
					<div className="space-y-2">
						<label htmlFor="state" className="font-medium text-base">
							Negeri <span className="text-red-500">*</span>
						</label>
						<select
							id="state"
							{...register("state")}
							className={`w-full h-12 px-3 text-base border rounded-md bg-background ${errors.state ? "border-red-500" : ""}`}
							defaultValue=""
						>
							<option value="" disabled>
								Pilih negeri
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
						<label htmlFor="city" className="font-medium text-base">
							Bandar <span className="text-red-500">*</span>
						</label>
						<Input
							id="city"
							{...register("city")}
							placeholder="Contoh: Shah Alam"
							className={`h-12 text-base ${errors.city ? "border-red-500" : ""}`}
							autoComplete="address-level2"
						/>
						{errors.city && (
							<p className="text-sm text-red-500">{errors.city.message}</p>
						)}
					</div>
				</div>

				{/* Additional info */}
				<div className="space-y-2">
					<label htmlFor="contributorRemarks" className="font-medium text-base">
						Info Tambahan
					</label>
					<textarea
						id="contributorRemarks"
						{...register("contributorRemarks")}
						placeholder="Info tambahan berkenaan institusi ini"
						className={`w-full min-h-[100px] px-3 py-2 text-base border rounded-md bg-background resize-vertical ${errors.contributorRemarks ? "border-red-500" : ""}`}
					/>
					{errors.contributorRemarks && (
						<p className="text-sm text-red-500">
							{errors.contributorRemarks.message}
						</p>
					)}
				</div>

				{/* Social media source */}
				<div className="space-y-2">
					<div className="flex items-center space-x-3">
						<input
							type="checkbox"
							id="fromSocialMedia"
							{...register("fromSocialMedia")}
							className="rounded w-4 h-4"
						/>
						<label htmlFor="fromSocialMedia" className="font-medium text-base">
							Saya dapat maklumat QR ini dari media sosial
						</label>
					</div>
					{fromSocialMedia && (
						<div className="space-y-2 pl-6">
							<label htmlFor="sourceUrl" className="font-medium text-sm">
								Alamat Web
							</label>
							<Input
								id="sourceUrl"
								{...register("sourceUrl")}
								placeholder="https://facebook.com/post/123 atau URL Instagram"
								className={`h-12 text-base ${errors.sourceUrl ? "border-red-500" : ""}`}
								type="url"
							/>
							{errors.sourceUrl && (
								<p className="text-sm text-red-500">
									{errors.sourceUrl.message}
								</p>
							)}
						</div>
					)}
				</div>

				{/* Collapsible social media section */}
				<div className="space-y-2">
					<Button
						type="button"
						variant="ghost"
						onClick={() => setSocialMediaExpanded(!socialMediaExpanded)}
						className="flex items-center space-x-2 font-medium p-0 h-auto hover:bg-transparent text-base"
					>
						<span>Social Media (Pilihan)</span>
						{socialMediaExpanded ? (
							<ChevronUp className="w-4 h-4" />
						) : (
							<ChevronDown className="w-4 h-4" />
						)}
					</Button>
					{socialMediaExpanded && (
						<div className="space-y-3 pl-4 border-l-2 border-gray-200">
							<Input
								id="facebook"
								{...register("facebook")}
								placeholder="Facebook URL"
								className={`h-12 text-base ${errors.facebook ? "border-red-500" : ""}`}
								type="url"
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
								className={`h-12 text-base ${errors.instagram ? "border-red-500" : ""}`}
								type="url"
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
								className={`h-12 text-base ${errors.website ? "border-red-500" : ""}`}
								type="url"
							/>
							{errors.website && (
								<p className="text-sm text-red-500">{errors.website.message}</p>
							)}
						</div>
					)}
				</div>

				{/* Turnstile Security Verification - Only in Production */}
				{process.env.NODE_ENV !== "development" && (
					<div className="space-y-2">
						<p className="font-medium text-base">
							Pengesahan Keselamatan <span className="text-red-500">*</span>
						</p>
						<div className="flex justify-center">
							{(() => {
								console.log(
									"Turnstile siteKey:",
									process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY,
								);
								return null;
							})()}
							<Turnstile
								siteKey={
									process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY || ""
								}
								onSuccess={setTurnstileToken}
								onError={() => setTurnstileToken("")}
								onExpire={() => setTurnstileToken("")}
								options={{
									theme: "auto",
									size: "normal",
									language: "ms",
								}}
							/>
						</div>
						{errors.turnstileToken && (
							<p className="text-sm text-red-500 text-center">
								{errors.turnstileToken.message}
							</p>
						)}
					</div>
				)}

				{/* Development Mode Notice */}
				{process.env.NODE_ENV === "development" && (
					<div className="space-y-2">
						<div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
							<p className="text-sm text-yellow-800">
								🚧 <strong>Development Mode:</strong> Turnstile verification
								bypassed
							</p>
						</div>
					</div>
				)}

				<SubmitButton
					isSubmitting={isSubmitting}
					qrExtracting={qrStatus.qrExtracting}
					qrExtractionFailed={qrStatus.qrExtractionFailed}
					hasAttemptedExtraction={qrStatus.hasAttemptedExtraction}
					qrContent={qrContent}
					turnstileToken={turnstileToken}
				/>
			</fieldset>
		</form>
	);
}

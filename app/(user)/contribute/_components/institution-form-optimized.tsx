"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
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
import {
	findSimilarInstitutions,
	getContributionCooldown,
	type SimilarInstitution,
	submitInstitution,
} from "../_lib/submit-institution";
import { CooldownTimer } from "./cooldown-timer";

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
	isInCooldown,
}: {
	isSubmitting: boolean;
	qrExtracting: boolean;
	qrExtractionFailed: boolean;
	hasFile: boolean;
	isAuthenticated: boolean;
	isInCooldown: boolean;
}) {
	const isDisabled =
		isSubmitting ||
		qrExtracting ||
		!hasFile ||
		!isAuthenticated ||
		isInCooldown;

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
			<p className="text-sm text-muted-foreground">
				Memuatkan perkhidmatan lokasi...
			</p>
		</div>
	);
}

export default function InstitutionFormOptimized() {
	const router = useRouter();
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

	const [additionalInfoExpanded, setAdditionalInfoExpanded] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [enableAdvancedFeatures, setEnableAdvancedFeatures] = useState(false);
	const [cooldownEndsAt, setCooldownEndsAt] = useState<string | null>(null);

	/* Similar institutions duplicate warning */
	const [similarInstitutions, setSimilarInstitutions] = useState<
		SimilarInstitution[]
	>([]);
	const [showDuplicateModal, setShowDuplicateModal] = useState(false);
	const [pendingFormData, setPendingFormData] =
		useState<InstitutionFormData | null>(null);

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

	/* Proactive cooldown check on mount */
	useEffect(() => {
		if (!user?.id) return;

		getContributionCooldown().then((result) => {
			if (result?.inCooldown && result.cooldownEndsAt) {
				setCooldownEndsAt(result.cooldownEndsAt);
			}
		});
	}, [user?.id]);

	/* Build FormData and submit to server. Returns true on success, false on error. */
	const performSubmit = useCallback(
		async (data: InstitutionFormData): Promise<boolean> => {
			const formData = new FormData();
			for (const [key, value] of Object.entries(data)) {
				if (value !== undefined && value !== null) {
					formData.append(key, value.toString());
				}
			}
			if (qrContent) formData.append("qrContent", qrContent);
			const qrImageInput = document.getElementById(
				"qrImage",
			) as HTMLInputElement | null;
			const qrImageGalleryInput = document.getElementById(
				"qrImage-gallery",
			) as HTMLInputElement | null;
			const qrFile =
				qrImageInput?.files?.[0] ?? qrImageGalleryInput?.files?.[0];
			if (qrFile) formData.append("qrImage", qrFile);

			const result = await submitInstitution(undefined, formData);

			if (result.status === "success") {
				toast.success("Jazakallahu khair!", {
					description: "Sumbangan anda sedang disemak.",
				});
				router.replace("/my-contributions");
				return true;
			}
			if (result.status === "error") {
				if (result.cooldownEndsAt) {
					setCooldownEndsAt(result.cooldownEndsAt);
					return false;
				}
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
				return false;
			}
			return false;
		},
		[qrContent, form, router],
	);

	/* Form submission handler */
	const onSubmit = async (data: InstitutionFormData) => {
		if (!user?.id) {
			toast.error("Ralat", {
				description:
					"Anda mesti log masuk untuk menyumbang. Sila log masuk dan cuba lagi.",
			});
			return;
		}

		setIsSubmitting(true);
		form.clearErrors("root.general");

		try {
			// Step 1: Check for similar institutions
			const similar = await findSimilarInstitutions(
				data.name,
				data.state,
				data.category,
				data.city,
			);
			if (similar.length > 0) {
				setSimilarInstitutions(similar);
				setPendingFormData(data);
				setShowDuplicateModal(true);
				return;
			}

			// Step 2: No matches, proceed with submit
			await performSubmit(data);
		} catch (error) {
			console.error("Form submission error:", error);
			toast.error("Ralat", {
				description: "Sesuatu yang tidak kena berlaku. Sila cuba lagi.",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	/* Modal confirm: user confirmed institution is different, proceed with submit */
	const handleDuplicateModalConfirm = async () => {
		if (!pendingFormData) return;
		setIsSubmitting(true);
		try {
			const success = await performSubmit(pendingFormData);
			if (success) {
				setShowDuplicateModal(false);
				setPendingFormData(null);
				setSimilarInstitutions([]);
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

	const handleDuplicateModalCancel = () => {
		setShowDuplicateModal(false);
		setPendingFormData(null);
		setSimilarInstitutions([]);
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
				<Controller
					name="lat"
					control={control}
					render={({ field }) => <input type="hidden" {...field} />}
				/>
				<Controller
					name="lon"
					control={control}
					render={({ field }) => <input type="hidden" {...field} />}
				/>

				{/* 1. QR upload */}
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

				{/* 2. Maklumat institusi utama */}
				<div className="space-y-4">
					<h3 className="text-sm font-semibold text-foreground">
						Maklumat Institusi
					</h3>
					{/* Institution name - mobile optimized */}
					<Controller
						control={control}
						name="name"
						render={({ field, fieldState }) => (
							<Field className="space-y-2">
								<FieldLabel htmlFor="name" className="font-medium text-base">
									Nama Institusi <span className="text-red-500">*</span>
								</FieldLabel>
								<Input
									id="name"
									{...field}
									placeholder="Contoh: Masjid Al-Falah"
									className={`h-12 text-base ${fieldState.invalid ? "border-red-500" : ""}`}
									autoComplete="organization"
								/>
								{fieldState.error && <FieldError errors={[fieldState.error]} />}
							</Field>
						)}
					/>

					{/* Category - mobile optimized */}
					<Controller
						name="category"
						control={control}
						render={({ field, fieldState }) => (
							<Field className="space-y-2">
								<FieldLabel className="font-medium text-base">
									Kategori <span className="text-red-500">*</span>
								</FieldLabel>
								<Select
									value={field.value ?? ""}
									onValueChange={field.onChange}
								>
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
				</div>

				{/* 3. Lokasi */}
				<div className="space-y-4">
					<h3 className="text-sm font-semibold text-foreground">Lokasi</h3>
					{enableAdvancedFeatures ? (
						<Suspense fallback={<BasicLocationInput />}>
							<LocationServicesFeature setValue={setValue} />
						</Suspense>
					) : (
						<BasicLocationInput />
					)}
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
				</div>

				{/* 4. Maklumat tambahan (optional) */}
				<div className="space-y-2">
					<Button
						type="button"
						variant="ghost"
						onClick={() => setAdditionalInfoExpanded(!additionalInfoExpanded)}
						className="flex items-center space-x-2 font-medium p-0 h-auto hover:bg-transparent text-base"
					>
						<span>Maklumat Tambahan (Opsional)</span>
						{additionalInfoExpanded ? (
							<ChevronUp className="w-4 h-4" />
						) : (
							<ChevronDown className="w-4 h-4" />
						)}
					</Button>
					{additionalInfoExpanded && (
						<div className="space-y-4 pl-4 border-l-2 border-muted">
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
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>

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

							<div className="space-y-3">
								<p className="text-sm font-medium">Media Sosial</p>
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
												placeholder="Pautan Facebook"
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
												placeholder="Pautan Instagram"
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
												placeholder="Pautan laman web"
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
						</div>
					)}
				</div>

				<div data-tour="contribute-submit">
					<SubmitButton
						isSubmitting={isSubmitting}
						qrExtracting={qrStatus.qrExtracting}
						qrExtractionFailed={qrStatus.qrExtractionFailed}
						hasFile={qrStatus.hasFile}
						isAuthenticated={!!user?.id}
						isInCooldown={!!cooldownEndsAt}
					/>
				</div>
			</fieldset>

			{cooldownEndsAt ? (
				<CooldownTimer
					cooldownEndsAt={cooldownEndsAt}
					onCooldownEnd={() => setCooldownEndsAt(null)}
				/>
			) : (
				errors.root?.general && (
					<div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-center">
						<p className="text-sm font-medium text-red-800">
							{errors.root.general.message}
						</p>
					</div>
				)
			)}

			{/* Similar institutions duplicate warning modal */}
			<Dialog
				open={showDuplicateModal}
				onOpenChange={(open) => !open && handleDuplicateModalCancel()}
			>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>Institusi serupa dijumpai</DialogTitle>
						<DialogDescription>
							Kami menjumpai institusi berikut yang mungkin sama. Adakah ini
							institusi yang berbeza?
						</DialogDescription>
					</DialogHeader>
					<ul className="space-y-3 py-2">
						{similarInstitutions.map((inst) => (
							<li
								key={inst.id}
								className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/50 p-3 text-sm"
							>
								<span className="font-medium">{inst.name}</span>
								<Badge variant="secondary" className="text-xs capitalize">
									{toTitleCase(inst.category)}
								</Badge>
								<span className="text-muted-foreground">
									{inst.city}, {inst.state}
								</span>
							</li>
						))}
					</ul>
					<DialogFooter className="gap-2 sm:gap-0">
						<Button
							type="button"
							variant="outline"
							onClick={handleDuplicateModalCancel}
							disabled={isSubmitting}
						>
							Batal
						</Button>
						<Button
							type="button"
							onClick={handleDuplicateModalConfirm}
							disabled={isSubmitting}
						>
							{isSubmitting ? (
								<>
									<Spinner size="small" className="mr-2" />
									Menghantar...
								</>
							) : (
								"Ini institusi berbeza, saya mahu teruskan"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</form>
	);
}

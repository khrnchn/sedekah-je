"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
	CheckCircle2,
	ChevronDown,
	ChevronUp,
	ClipboardCheck,
} from "lucide-react";
import Link from "next/link";
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
import { Field, FieldError, FieldLabel } from "@/components/shared/field";
import { Button } from "@/components/ui/button";
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
import { validateAndCompressImage } from "@/lib/image-utils";
import {
	categories as CATEGORY_OPTIONS,
	states as STATE_OPTIONS,
} from "@/lib/institution-constants";
import { cn, toTitleCase } from "@/lib/utils";
import {
	checkQrDuplicate,
	getContributionCooldown,
	type SubmitInstitutionFormState,
	submitInstitution,
} from "../_lib/submit-institution";
import { CooldownTimer } from "./cooldown-timer";
import { SubmissionNotice } from "./submission-notice";

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
	qrExtractionFailed,
	isDuplicateQr,
}: {
	isSubmitting: boolean;
	qrExtracting: boolean;
	qrExtractionFailed: boolean;
	hasFile: boolean;
	isAuthenticated: boolean;
	isInCooldown: boolean;
	isDuplicateQr: boolean;
}) {
	const isDisabled =
		isSubmitting ||
		qrExtracting ||
		!hasFile ||
		!isAuthenticated ||
		isInCooldown ||
		isDuplicateQr;

	const helperText = !isAuthenticated
		? "Log masuk diperlukan sebelum submission boleh dihantar."
		: isInCooldown
			? "Tunggu tempoh cooldown tamat sebelum menghantar submission baharu."
			: qrExtracting
				? "Tunggu sehingga QR selesai diproses."
				: !hasFile
					? "Muat naik gambar QR dahulu untuk aktifkan butang hantar."
					: isDuplicateQr
						? "QR ini sudah ada dalam sistem. Tukar gambar QR untuk teruskan."
						: qrExtractionFailed
							? "QR akan disemak secara manual selepas dihantar."
							: "Submission akan masuk ke semakan komuniti sebelum dipaparkan.";

	return (
		<div className="space-y-2">
			<Button
				type="submit"
				className="h-12 w-full text-base"
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
					"Hantar untuk semakan"
				)}
			</Button>
			<p
				className={cn(
					"text-center text-xs leading-relaxed text-muted-foreground",
					!hasFile && isAuthenticated && !isInCooldown && "text-primary",
				)}
			>
				{helperText}
			</p>
		</div>
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

function RequiredMark() {
	return <span className="text-destructive">*</span>;
}

function ContributionBrief() {
	return (
		<div className="rounded-lg border border-border/70 bg-card/70 p-3.5 text-sm shadow-sm sm:p-4">
			<div className="flex items-center gap-2">
				<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
					<ClipboardCheck className="h-3.5 w-3.5" />
				</span>
				<p className="font-semibold text-foreground">Sebelum dihantar</p>
			</div>
			<p className="mt-2 max-w-prose text-muted-foreground">
				QR akan disemak sebelum dipaparkan di direktori.
			</p>
			<div className="mt-3 flex flex-wrap gap-1.5">
				{["Gambar QR", "Nama institusi", "Lokasi"].map((item) => (
					<div
						key={item}
						className="inline-flex items-center gap-1.5 rounded-full bg-muted/50 px-2.5 py-1 text-xs font-medium text-muted-foreground"
					>
						<CheckCircle2 className="h-3.5 w-3.5 text-primary" />
						{item}
					</div>
				))}
			</div>
		</div>
	);
}

function FormSection({
	title,
	children,
	description,
}: {
	title: string;
	children: React.ReactNode;
	description?: string;
}) {
	return (
		<section className="space-y-4">
			<div className="space-y-1">
				<h2 className="text-sm font-semibold text-foreground">{title}</h2>
				{description && (
					<p className="text-xs leading-relaxed text-muted-foreground">
						{description}
					</p>
				)}
			</div>
			{children}
		</section>
	);
}

function SubmissionSuccess({ onAddAnother }: { onAddAnother: () => void }) {
	const headingRef = useRef<HTMLHeadingElement>(null);
	useEffect(() => {
		window.scrollTo({ top: 0 });
		headingRef.current?.focus();
	}, []);

	return (
		<div className="mx-auto max-w-xl px-4 pb-20 md:px-0 md:pb-6">
			<div className="space-y-4 rounded-lg border border-border/70 bg-card/70 p-6 text-center shadow-sm">
				<CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
				<div className="space-y-1">
					<h2
						ref={headingRef}
						tabIndex={-1}
						className="text-lg font-semibold outline-none"
					>
						Jazakallahu khair!
					</h2>
					<p className="text-sm text-muted-foreground">
						Submission anda sedang disemak dan akan dipaparkan di direktori
						selepas diluluskan.
					</p>
				</div>
				<div className="flex flex-col gap-2 sm:flex-row">
					<Button asChild className="h-12 flex-1 text-base">
						<Link href="/my-contributions">Lihat sumbangan saya</Link>
					</Button>
					<Button
						type="button"
						variant="outline"
						className="h-12 flex-1 text-base"
						onClick={onAddAnother}
					>
						Tambah institusi lain
					</Button>
				</div>
			</div>
		</div>
	);
}

// Unmounting the form on success means "Tambah institusi lain" gets a fresh
// form, including the QR upload state that lives in child components.
export default function InstitutionFormOptimized() {
	const [submitted, setSubmitted] = useState(false);
	if (submitted) {
		return <SubmissionSuccess onAddAnother={() => setSubmitted(false)} />;
	}
	return <InstitutionForm onSuccess={() => setSubmitted(true)} />;
}

function InstitutionForm({ onSuccess }: { onSuccess: () => void }) {
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

	const [duplicateFeedback, setDuplicateFeedback] = useState<Extract<
		SubmitInstitutionFormState,
		{ status: "error" }
	> | null>(null);
	const latestQrContentRef = useRef<string | null>(null);
	const handleQrContentChange = useCallback((content: string | null) => {
		setQrContent(content);
		setDuplicateFeedback(null);
		latestQrContentRef.current = content;
		if (!content) return;
		// Submit re-checks on the server, so a failed lookup here is harmless.
		checkQrDuplicate(content)
			.then((result) => {
				if (result && latestQrContentRef.current === content) {
					setDuplicateFeedback(result);
				}
			})
			.catch(() => {});
	}, []);

	const [additionalInfoExpanded, setAdditionalInfoExpanded] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [enableAdvancedFeatures, setEnableAdvancedFeatures] = useState(false);
	const [cooldownEndsAt, setCooldownEndsAt] = useState<string | null>(null);

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

	/* Form submission handler */
	const onSubmit = async (data: InstitutionFormData) => {
		// Authentication check
		if (!user?.id) {
			toast.error("Ralat", {
				description:
					"Anda mesti log masuk untuk menghantar submission. Sila log masuk dan cuba lagi.",
			});
			return;
		}

		setIsSubmitting(true);
		setDuplicateFeedback(null);
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

			// Add QR image file (from camera or gallery input)
			const qrImageInput = document.getElementById(
				"qrImage",
			) as HTMLInputElement | null;
			const qrImageGalleryInput = document.getElementById(
				"qrImage-gallery",
			) as HTMLInputElement | null;
			const qrFile =
				qrImageInput?.files?.[0] ?? qrImageGalleryInput?.files?.[0];
			if (qrFile) {
				// Keep QR extraction on the original file, then shrink the upload payload
				// only at submit time if the browser can produce a smaller image.
				let uploadFile = qrFile;
				try {
					const result = await validateAndCompressImage(qrFile, {
						maxWidth: 1600,
						maxHeight: 1600,
						quality: 0.88,
						maxFileSizeMB: 5,
					});

					if (
						result.isValid &&
						result.compressedFile &&
						result.compressedFile.size < qrFile.size
					) {
						uploadFile = result.compressedFile;
					}
				} catch (compressionError) {
					console.warn("QR compression skipped:", compressionError);
				}

				formData.append("qrImage", uploadFile);
			}

			const result = await submitInstitution(undefined, formData);

			if (result.status === "success") {
				onSuccess();
				return;
			} else if (result.status === "error") {
				// Handle rate limit with cooldown: show timer, don't set form error
				if (result.cooldownEndsAt) {
					setCooldownEndsAt(result.cooldownEndsAt);
					return;
				}

				if (result.code === "duplicate_qr") {
					setDuplicateFeedback(result);
					return;
				}

				// Errors for keys the form doesn't render (e.g. qrImage) would be
				// invisible as field errors, so show them in the general notice.
				const generalMessages: string[] = [];
				for (const [key, messages] of Object.entries(result.errors ?? {})) {
					if (key in extendedInstitutionFormClientSchema.shape) {
						form.setError(key as keyof InstitutionFormData, {
							type: "manual",
							message: messages.join(", "),
						});
					} else {
						generalMessages.push(...messages);
					}
				}
				if (generalMessages.length > 0) {
					form.setError("root.general", {
						type: "manual",
						message: generalMessages.join(" "),
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
			onSubmit={(event) => {
				setDuplicateFeedback(null);
				void handleSubmit(onSubmit)(event);
			}}
			onChangeCapture={(event) => {
				if (
					event.target instanceof HTMLInputElement &&
					event.target.type === "file"
				) {
					setDuplicateFeedback(null);
				}
			}}
			encType="multipart/form-data"
			className="mx-auto max-w-xl space-y-6 px-4 pb-20 md:px-0 md:pb-6"
		>
			<ContributionBrief />
			<fieldset disabled={isSubmitting} className="space-y-6 sm:space-y-7">
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

				<FormSection
					title="1. Gambar QR"
					description="Ambil gambar terus dari kamera atau pilih imej yang jelas dari galeri."
				>
					<Suspense fallback={<QRUploadSkeleton />}>
						<QRExtractionFeature
							isSubmitting={isSubmitting}
							onQrContentChange={handleQrContentChange}
							onStatusChange={setQrStatus}
							onClearQrContent={setClearQrContent}
						/>
					</Suspense>
					<div aria-live="polite" aria-atomic="true">
						{duplicateFeedback && (
							<SubmissionNotice
								message={
									duplicateFeedback.errors.general?.[0] ??
									"QR code ini telah pun wujud dalam sistem. Sila semak semula."
								}
								existingInstitution={duplicateFeedback.existingInstitution}
							/>
						)}
					</div>
				</FormSection>

				<FormSection title="2. Maklumat institusi">
					<Controller
						control={control}
						name="name"
						render={({ field, fieldState }) => (
							<Field className="space-y-2">
								<FieldLabel htmlFor="name" className="font-medium text-base">
									Nama institusi <RequiredMark />
								</FieldLabel>
								<Input
									id="name"
									{...field}
									placeholder="Contoh: Masjid Al-Falah"
									className={cn(
										"h-12 text-base",
										fieldState.invalid && "border-destructive",
									)}
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
									Kategori <RequiredMark />
								</FieldLabel>
								<Select
									value={field.value ?? ""}
									onValueChange={field.onChange}
								>
									<SelectTrigger
										ref={field.ref}
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
				</FormSection>

				<FormSection
					title="3. Lokasi"
					description="Lokasi membantu penyumbang lain cari institusi yang betul."
				>
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
										Negeri <RequiredMark />
									</FieldLabel>
									<Select
										value={field.value ?? ""}
										onValueChange={field.onChange}
									>
										<SelectTrigger
											ref={field.ref}
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
										Bandar <RequiredMark />
									</FieldLabel>
									<Input
										id="city"
										{...field}
										placeholder="Contoh: Shah Alam"
										className={cn(
											"h-12 text-base",
											fieldState.invalid && "border-destructive",
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
				</FormSection>

				<div className="space-y-3">
					<Button
						type="button"
						variant="ghost"
						onClick={() => setAdditionalInfoExpanded(!additionalInfoExpanded)}
						className="h-auto justify-start gap-2 p-0 text-base font-medium hover:bg-transparent"
						aria-expanded={additionalInfoExpanded}
					>
						<span>Maklumat Tambahan (Opsional)</span>
						{additionalInfoExpanded ? (
							<ChevronUp className="w-4 h-4" />
						) : (
							<ChevronDown className="w-4 h-4" />
						)}
					</Button>
					{additionalInfoExpanded && (
						<div className="space-y-4 rounded-lg border border-border/70 bg-card/60 p-4">
							<Controller
								name="contributorRemarks"
								control={control}
								render={({ field, fieldState }) => (
									<Field className="space-y-2">
										<FieldLabel
											htmlFor="contributorRemarks"
											className="font-medium text-base"
										>
											Info tambahan
										</FieldLabel>
										<textarea
											id="contributorRemarks"
											{...field}
											placeholder="Info tambahan berkenaan institusi ini"
											className={cn(
												"w-full min-h-[100px] px-3 py-2 text-base border rounded-md bg-background resize-vertical",
												fieldState.invalid && "border-destructive",
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
													Alamat web
												</FieldLabel>
												<Input
													id="sourceUrl"
													{...field}
													placeholder="https://facebook.com/post/123 atau URL Instagram"
													className={cn(
														"h-12 text-base",
														fieldState.invalid && "border-destructive",
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
								<p className="text-sm font-medium">Media sosial</p>
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
													fieldState.invalid && "border-destructive",
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
													fieldState.invalid && "border-destructive",
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
													fieldState.invalid && "border-destructive",
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
						isDuplicateQr={!!duplicateFeedback}
					/>
				</div>
			</fieldset>

			<output className="block" aria-live="polite" aria-atomic="true">
				{cooldownEndsAt ? (
					<CooldownTimer
						cooldownEndsAt={cooldownEndsAt}
						onCooldownEnd={() => setCooldownEndsAt(null)}
					/>
				) : errors.root?.general?.message ? (
					<SubmissionNotice message={errors.root.general.message} />
				) : null}
			</output>
		</form>
	);
}

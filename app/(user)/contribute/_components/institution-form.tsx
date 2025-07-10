"use client";

import {
	type SubmitInstitutionFormState,
	submitInstitution,
} from "@/app/(user)/contribute/_lib/submit-institution";
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
import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const initialState: SubmitInstitutionFormState = { status: "idle" };

function FormFields({
	children,
	qrExtracting,
}: {
	children: React.ReactNode;
	qrExtracting: boolean;
}) {
	const { pending } = useFormStatus();
	const isSubmitting = pending || qrExtracting;

	return (
		<fieldset disabled={isSubmitting} className="space-y-6">
			{children}
			<Button type="submit" className="w-full" disabled={isSubmitting}>
				{isSubmitting ? (
					<>
						<Spinner size="small" className="mr-2" />
						{qrExtracting ? "Mengekstrak kandungan QR" : "Hantar"}
					</>
				) : (
					"Hantar"
				)}
			</Button>
		</fieldset>
	);
}

export default function InstitutionForm() {
	const { user } = useAuth();
	const [state, formAction] = useFormState(submitInstitution, initialState);

	/* QR extraction and social media */
	const { qrContent, qrExtracting, handleQrImageChange, clearQrContent } =
		useQrExtraction();
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
			lat: "",
			lon: "",
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

	/* Step + location management via custom hook */
	const {
		step,
		setStep,
		loadingLocation,
		fetchLocation,
		prefilledCity,
		prefilledState,
	} = useLocationPrefill(setValue);

	/* Toast feedback – make sure we act once per status change */
	const lastStatusRef = useRef<SubmitInstitutionFormState["status"]>("idle");
	useEffect(() => {
		if (state.status === lastStatusRef.current) return; // no change
		lastStatusRef.current = state.status;

		if (state.status === "success") {
			console.log("Success state detected, showing toast");
			toast.success("Jazakallahu khair. Terima kasih!", {
				description: "Sumbangan anda sedang disemak.",
			});
			form.reset();
			const fileInput = document.getElementById(
				"qrImage",
			) as HTMLInputElement | null;
			if (fileInput) fileInput.value = "";
			clearQrContent();
		} else if (state.status === "error") {
			console.log("Server validation errors:", state.errors);
			toast.error("Ralat", {
				description:
					"Sila semak semula borang anda. Terdapat ralat dalam data yang dihantar.",
			});
		}
	}, [state, clearQrContent, form]);

	/* onSubmit just toggles loading & lets native submission proceed */
	async function onClientSubmit(e: React.FormEvent<HTMLFormElement>) {
		const isValid = await form.trigger();
		if (!isValid) {
			e.preventDefault();
			toast.error("Ralat", {
				description: "Sila semak borang anda. Terdapat ralat.",
			});
			return;
		}
	}

	if (step === "question") {
		return (
			<div className="max-w-lg mx-auto space-y-6 text-center">
				<h2 className="text-xl font-semibold">
					Adakah anda sedang berada di lokasi institusi?
				</h2>
				<div className="flex justify-center gap-4">
					<Button onClick={fetchLocation} disabled={loadingLocation}>
						Ya
					</Button>
					<Button variant="secondary" onClick={() => setStep("form")}>
						Tidak
					</Button>
				</div>
				{loadingLocation && <p>Mengesan lokasi...</p>}
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
			<FormFields qrExtracting={qrExtracting}>
				{/* Hidden contributorId */}
				<input
					type="hidden"
					{...register("contributorId")}
					value={user?.id ?? ""}
				/>
				<input type="hidden" {...register("lat")} />
				<input type="hidden" {...register("lon")} />

				<div className="space-y-2">
					<label htmlFor="qrImage" className="font-medium">
						Gambar Kod QR <span className="text-red-500">*</span>
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
						<p className="text-sm text-blue-600">Mengekstrak kandungan QR...</p>
					)}
					{qrContent && (
						<div className="p-3 bg-green-50 border border-green-200 rounded-md">
							<p className="text-sm font-medium text-green-800">
								Kandungan QR:
							</p>
							<p className="text-sm text-green-700 break-all">{qrContent}</p>
						</div>
					)}
				</div>

				<div className="space-y-2">
					<label htmlFor="name" className="font-medium">
						Nama Institusi <span className="text-red-500">*</span>
					</label>
					<Input
						id="name"
						{...register("name")}
						placeholder="Contoh: Masjid Al-Falah"
						className={errors.name ? "border-red-500" : ""}
					/>
					{errors.name && (
						<p className="text-sm text-red-500">{errors.name.message}</p>
					)}
				</div>

				<div className="space-y-2">
					<label htmlFor="category" className="font-medium">
						Kategori <span className="text-red-500">*</span>
					</label>
					<select
						id="category"
						{...register("category")}
						className={`w-full h-10 px-3 border rounded-md bg-background ${errors.category ? "border-red-500" : ""}`}
						defaultValue=""
					>
						<option value="" disabled>
							Pilih kategori
						</option>
						{CATEGORY_OPTIONS.map((c) => (
							<option key={c} value={c} className="capitalize">
								{c.charAt(0).toUpperCase() + c.slice(1)}
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
							Negeri <span className="text-red-500">*</span>
						</label>
						<select
							id="state"
							{...register("state")}
							className={`w-full h-10 px-3 border rounded-md bg-background ${errors.state ? "border-red-500" : ""}`}
							defaultValue={prefilledState || ""}
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
						<label htmlFor="city" className="font-medium">
							Bandar/Daerah <span className="text-red-500">*</span>
						</label>
						<Input
							id="city"
							{...register("city")}
							placeholder="Contoh: Shah Alam"
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
						Info Tambahan
					</label>
					<textarea
						id="contributorRemarks"
						{...register("contributorRemarks")}
						placeholder="Info tambahan berkenaan intitusi ini"
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
							Saya dapat informasi ini dari media sosial
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
						<span>Media sosial</span>
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
								placeholder="Facebook"
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
								placeholder="Instagram"
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
								placeholder="Laman Web"
								className={errors.website ? "border-red-500" : ""}
							/>
							{errors.website && (
								<p className="text-sm text-red-500">{errors.website.message}</p>
							)}
						</div>
					)}
				</div>
			</FormFields>
		</form>
	);
}

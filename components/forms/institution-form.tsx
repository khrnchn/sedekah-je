"use client";

import {
	type SubmitInstitutionFormState,
	submitInstitution,
} from "@/app/_actions/submit-institution";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import type { states } from "@/db/institutions";
import { useAuth } from "@/hooks/use-auth";
import {
	categories as CATEGORY_OPTIONS,
	type InstitutionFormData,
	states as STATE_OPTIONS,
	institutionFormSchema,
} from "@/lib/validations/institution";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import { useForm } from "react-hook-form";

const initialState: SubmitInstitutionFormState = { status: "success" };

export default function InstitutionForm() {
	const { user } = useAuth();
	const [state, formAction] = useFormState(submitInstitution, initialState);

	/* Step management */
	const [step, setStep] = useState<"question" | "form">("question");
	const [loadingLocation, setLoadingLocation] = useState(false);
	const [prefilledCity, setPrefilledCity] = useState("");
	const [prefilledState, setPrefilledState] = useState("");
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
			contributorId: user?.id ?? "",
		},
	});

	const {
		register,
		handleSubmit,
		formState: { errors },
		setValue,
		reset,
	} = form;

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
							setValue("state", state as (typeof states)[number]);
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

	/* Toast feedback */
	useEffect(() => {
		if (state.status === "success") {
			toast({
				title: "Terima kasih!",
				description: "Sumbangan anda sedang disemak.",
			});
			reset();
			setIsSubmitting(false);
		} else if (state.status === "error") {
			console.log("Server validation errors:", state.errors);
			toast({
				title: "Ralat",
				description:
					"Sila semak borang anda. Terdapat ralat dalam data yang dihantar.",
			});
			setIsSubmitting(false);
		}
	}, [state, reset]);

	/* Form submission */
	const onSubmit = async (data: InstitutionFormData) => {
		console.log("Form submitted with data:", data);
		setIsSubmitting(true);

		// Check if QR image is selected
		const fileInput = document.querySelector(
			'input[name="qrImage"]',
		) as HTMLInputElement;
		if (!fileInput?.files?.[0]) {
			toast({
				title: "Ralat",
				description: "Sila pilih gambar QR kod",
			});
			setIsSubmitting(false);
			return;
		}

		const formData = new FormData();
		for (const [key, value] of Object.entries(data)) {
			if (value !== undefined && value !== "") {
				formData.append(key, value as string);
			} else if (
				key === "facebook" ||
				key === "instagram" ||
				key === "website"
			) {
				// For social media fields, append empty string to maintain consistency
				formData.append(key, "");
			}
		}

		// Add the QR image file
		formData.append("qrImage", fileInput.files[0]);

		console.log("Submitting form data:", Array.from(formData.entries()));
		formAction(formData);
	};

	if (step === "question") {
		return (
			<div className="max-w-lg mx-auto space-y-6 text-center">
				<h2 className="text-xl font-semibold">
					Adakah anda berada di lokasi institusi sekarang?
				</h2>
				<div className="flex justify-center gap-4">
					<Button onClick={fetchLocation} disabled={loadingLocation}>
						Ya
					</Button>
					<Button variant="secondary" onClick={() => setStep("form")}>
						Tidak
					</Button>
				</div>
				{loadingLocation && <p>Mengesan lokasi…</p>}
			</div>
		);
	}

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			encType="multipart/form-data"
			className="space-y-6 max-w-lg mx-auto"
		>
			{/* Hidden contributorId */}
			<input
				type="hidden"
				{...register("contributorId")}
				value={user?.id ?? ""}
			/>

			<div className="space-y-2">
				<label htmlFor="qrImage" className="font-medium">
					Gambar Kod QR (wajib)
				</label>
				<Input
					id="qrImage"
					type="file"
					name="qrImage"
					accept="image/*"
					required
					capture="environment"
				/>
			</div>

			<div className="space-y-2">
				<label htmlFor="name" className="font-medium">
					Nama Institusi
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
					Kategori
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
						Negeri
					</label>
					<select
						id="state"
						{...register("state")}
						className={`w-full h-10 px-3 border rounded-md bg-background ${errors.state ? "border-red-500" : ""}`}
						defaultValue={prefilledState || ""}
					>
						<option value="" disabled>
							Negeri
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
						Bandar
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
				<label htmlFor="facebook" className="font-medium">
					Media Sosial (pilihan)
				</label>
				<Input
					id="facebook"
					{...register("facebook")}
					placeholder="Facebook URL"
					className={`mb-2 ${errors.facebook ? "border-red-500" : ""}`}
				/>
				{errors.facebook && (
					<p className="text-sm text-red-500">{errors.facebook.message}</p>
				)}
				<Input
					id="instagram"
					{...register("instagram")}
					placeholder="Instagram URL"
					className={`mb-2 ${errors.instagram ? "border-red-500" : ""}`}
				/>
				{errors.instagram && (
					<p className="text-sm text-red-500">{errors.instagram.message}</p>
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

			<Button type="submit" className="w-full" disabled={isSubmitting}>
				{isSubmitting ? "Menghantar..." : "Hantar"}
			</Button>
		</form>
	);
}

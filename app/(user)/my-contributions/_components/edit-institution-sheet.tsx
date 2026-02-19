"use client";

import { updateRejectedInstitution } from "@/app/(user)/my-contributions/_lib/actions";
import type { InstitutionForEdit } from "@/app/(user)/my-contributions/_lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import {
	Suspense,
	lazy,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { toast } from "sonner";

const QRExtractionFeature = lazy(
	() => import("@/app/(user)/contribute/_components/qr-extraction-feature"),
);

interface EditInstitutionSheetProps {
	institution: InstitutionForEdit | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
	isLoading?: boolean;
}

export function EditInstitutionSheet({
	institution,
	open,
	onOpenChange,
	onSuccess,
	isLoading = false,
}: EditInstitutionSheetProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [name, setName] = useState(institution?.name ?? "");
	const [qrContent, setQrContent] = useState<string | null>(
		institution?.qrContent ?? null,
	);
	const [qrStatus, setQrStatus] = useState({
		qrExtracting: false,
		qrExtractionFailed: false,
		hasAttemptedExtraction: false,
		hasFile: false,
	});
	const clearQrContentRef = useRef<(() => void) | null>(null);
	const handleClearQrContent = useCallback((fn: (() => void) | null) => {
		clearQrContentRef.current = fn;
	}, []);

	useEffect(() => {
		if (institution) {
			setName(institution.name);
			setQrContent(institution.qrContent);
		}
	}, [institution]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!institution) return;

		if (!name.trim()) {
			toast.error("Ralat", {
				description: "Nama institusi diperlukan.",
			});
			return;
		}

		setIsSubmitting(true);

		try {
			const formData = new FormData();
			formData.append("name", name.trim());
			formData.append("institutionId", institution.id);

			const qrImageInput = document.getElementById(
				"edit-institution-qrImage",
			) as HTMLInputElement;
			if (qrImageInput?.files?.[0]) {
				formData.append("qrImage", qrImageInput.files[0]);
			}
			if (qrContent) {
				formData.append("qrContent", qrContent);
			}

			const result = await updateRejectedInstitution(
				Number.parseInt(institution.id, 10),
				formData,
			);

			if (result.status === "success") {
				toast.success("Berjaya dikemaskini!", {
					description: "Sumbangan anda telah dihantar semula untuk disemak.",
				});
				onOpenChange(false);
				onSuccess?.();
			} else {
				const generalError = result.errors?.general?.[0];
				const nameError = result.errors?.name?.[0];
				const qrError = result.errors?.qrImage?.[0];
				toast.error("Ralat", {
					description:
						generalError || nameError || qrError || "Gagal mengemaskini.",
				});
			}
		} catch (error) {
			console.error("Edit submission error:", error);
			toast.error("Ralat", {
				description: "Sesuatu telah berlaku. Sila cuba lagi.",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto">
				<SheetHeader>
					<SheetTitle>Edit Sumbangan Ditolak</SheetTitle>
					<SheetDescription>
						{isLoading
							? "Memuatkan maklumat institusi..."
							: !institution
								? "Institusi tidak dijumpai atau anda tidak dibenarkan mengubahnya."
								: "Kemaskini maklumat dan hantar semula untuk disemak."}
					</SheetDescription>
				</SheetHeader>

				{isLoading ? (
					<div className="flex items-center justify-center py-12">
						<Spinner size="medium" />
					</div>
				) : !institution ? (
					<div className="py-6" />
				) : (
					<form onSubmit={handleSubmit} className="space-y-6 py-6">
						<div className="space-y-2">
							<label htmlFor="edit-institution-name" className="font-medium">
								Nama Institusi <span className="text-red-500">*</span>
							</label>
							<Input
								id="edit-institution-name"
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="Contoh: Masjid Al-Falah"
								disabled={isSubmitting}
								className="h-12"
								autoComplete="organization"
							/>
						</div>

						<div className="space-y-2">
							<Suspense
								fallback={
									<div className="p-3 bg-muted rounded-md animate-pulse h-24" />
								}
							>
								<QRExtractionFeature
									isSubmitting={isSubmitting}
									onQrContentChange={setQrContent}
									onStatusChange={setQrStatus}
									onClearQrContent={handleClearQrContent}
									optional={!!institution.qrImage}
									initialImageUrl={institution.qrImage}
									inputId="edit-institution-qrImage"
								/>
							</Suspense>
						</div>

						<SheetFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
								disabled={isSubmitting}
							>
								Batal
							</Button>
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting ? (
									<>
										<Spinner size="small" className="mr-2" />
										Menghantar...
									</>
								) : (
									"Hantar Semula"
								)}
							</Button>
						</SheetFooter>
					</form>
				)}
			</SheetContent>
		</Sheet>
	);
}

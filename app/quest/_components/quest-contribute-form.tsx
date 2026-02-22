"use client";

import { CheckCircle2, ImagePlus, Loader2, XCircle } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { submitQuestContribution } from "@/app/quest/_lib/actions";
import type { QuestMosqueWithStatus } from "@/app/quest/_lib/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { GoogleIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQrExtractionLazy } from "@/hooks/use-qr-extraction-lazy";
import { signInWithGoogle } from "@/lib/auth-client";

type QuestContributeFormProps = {
	mosque: QuestMosqueWithStatus;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

function isValidUrl(s: string): boolean {
	try {
		const u = new URL(s);
		return u.protocol === "http:" || u.protocol === "https:";
	} catch {
		return false;
	}
}

function ContributeFormContent({
	mosque,
	onSuccess,
}: {
	mosque: QuestMosqueWithStatus;
	onSuccess: () => void;
}) {
	const { isAuthenticated, isLoading: authLoading } = useAuth();
	const {
		qrContent,
		qrExtracting,
		qrExtractionFailed,
		hasAttemptedExtraction,
		handleQrImageChange,
	} = useQrExtractionLazy();
	const [submitting, setSubmitting] = useState(false);
	const [fromOnline, setFromOnline] = useState(false);
	const [sourceUrl, setSourceUrl] = useState("");
	const [submitAttempted, setSubmitAttempted] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const sourceUrlError =
		submitAttempted && fromOnline && sourceUrl.trim() && !isValidUrl(sourceUrl);

	const handleSubmit = useCallback(async () => {
		if (!fileInputRef.current?.files?.[0]) return;

		setSubmitAttempted(true);

		if (fromOnline && sourceUrl.trim() && !isValidUrl(sourceUrl)) {
			toast("URL tidak sah.");
			return;
		}

		setSubmitting(true);
		try {
			const formData = new FormData();
			formData.set("questMosqueId", mosque.id.toString());
			formData.set("qrImage", fileInputRef.current.files[0]);
			if (qrContent) {
				formData.set("qrContent", qrContent);
			}
			if (sourceUrl.trim()) {
				formData.set("sourceUrl", sourceUrl.trim());
			}

			const result = await submitQuestContribution(formData);

			if (result.status === "success") {
				toast("QR berjaya dihantar untuk semakan!");
				onSuccess();
			} else if (result.status === "error") {
				toast(result.message);
			}
		} catch {
			toast("Berlaku ralat. Sila cuba lagi.");
		} finally {
			setSubmitting(false);
		}
	}, [mosque.id, qrContent, onSuccess, fromOnline, sourceUrl]);

	if (authLoading) {
		return (
			<div className="flex items-center justify-center py-8">
				<Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
			</div>
		);
	}

	if (!isAuthenticated) {
		return (
			<div className="space-y-3 p-4">
				<p className="text-center text-sm text-zinc-400">
					Log masuk untuk sumbang QR kod
				</p>
				<Button
					type="button"
					variant="outline"
					className="w-full"
					onClick={() => signInWithGoogle("/quest")}
				>
					<GoogleIcon className="mr-2 h-5 w-5" />
					Log Masuk dengan Google
				</Button>
			</div>
		);
	}

	const hasFile = !!fileInputRef.current?.files?.[0];
	const canSubmit = hasFile && !qrExtracting && !submitting;

	return (
		<div className="space-y-4 p-4">
			<div className="rounded-md bg-zinc-900 px-3 py-2">
				<p className="text-xs text-zinc-500">Masjid</p>
				<p className="text-sm font-medium text-zinc-200">{mosque.name}</p>
			</div>

			<div>
				<label
					htmlFor="quest-qr-upload"
					className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-zinc-700 p-6 transition-colors hover:border-zinc-500"
				>
					<ImagePlus className="h-8 w-8 text-zinc-500" />
					<span className="text-sm text-zinc-400">
						{hasAttemptedExtraction
							? "Tukar gambar QR"
							: "Muat naik gambar kod QR"}
					</span>
					<input
						ref={fileInputRef}
						id="quest-qr-upload"
						type="file"
						accept="image/*"
						className="hidden"
						onChange={handleQrImageChange}
					/>
				</label>
			</div>

			{qrExtracting && (
				<div className="flex items-center gap-2 text-sm text-zinc-400">
					<Loader2 className="h-4 w-4 animate-spin" />
					<span>Mengekstrak kod QR...</span>
				</div>
			)}

			{hasAttemptedExtraction && !qrExtracting && qrContent && (
				<div className="flex items-center gap-2 text-sm text-green-400">
					<CheckCircle2 className="h-4 w-4" />
					<span>Kod QR berjaya dikesan</span>
				</div>
			)}

			{qrExtractionFailed && !qrExtracting && (
				<div className="flex items-center gap-2 text-sm text-amber-400">
					<XCircle className="h-4 w-4" />
					<span>QR tidak dikesan - admin akan semak secara manual</span>
				</div>
			)}

			<div className="flex items-center gap-2">
				<Checkbox
					id="quest-from-online"
					checked={fromOnline}
					onCheckedChange={(c) => setFromOnline(c === true)}
				/>
				<label
					htmlFor="quest-from-online"
					className="cursor-pointer text-sm text-zinc-400"
				>
					Saya jumpa QR ini dari online
				</label>
			</div>

			{fromOnline && (
				<div className="space-y-1.5">
					<label htmlFor="quest-source-url" className="text-sm text-zinc-400">
						Sumber URL (pilihan)
					</label>
					<Input
						id="quest-source-url"
						type="text"
						placeholder="https://facebook.com/post/..."
						value={sourceUrl}
						onChange={(e) => setSourceUrl(e.target.value)}
						className={
							sourceUrlError
								? "border-amber-500 focus-visible:ring-amber-500"
								: ""
						}
					/>
					<p className="text-xs text-zinc-500">Bantu admin sahkan sumber QR.</p>
					{sourceUrlError && (
						<p className="text-xs text-amber-400">URL tidak sah.</p>
					)}
				</div>
			)}

			<Button
				type="button"
				className="w-full"
				disabled={!canSubmit}
				onClick={handleSubmit}
			>
				{submitting ? (
					<>
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						Menghantar...
					</>
				) : (
					"Hantar QR"
				)}
			</Button>
		</div>
	);
}

export default function QuestContributeForm({
	mosque,
	open,
	onOpenChange,
}: QuestContributeFormProps) {
	const isMobile = useIsMobile();

	const handleSuccess = useCallback(() => {
		onOpenChange(false);
	}, [onOpenChange]);

	if (isMobile) {
		return (
			<Drawer open={open} onOpenChange={onOpenChange}>
				<DrawerContent>
					<DrawerHeader>
						<DrawerTitle>Sumbang QR</DrawerTitle>
					</DrawerHeader>
					<ContributeFormContent mosque={mosque} onSuccess={handleSuccess} />
				</DrawerContent>
			</Drawer>
		);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Sumbang QR</DialogTitle>
				</DialogHeader>
				<ContributeFormContent mosque={mosque} onSuccess={handleSuccess} />
			</DialogContent>
		</Dialog>
	);
}

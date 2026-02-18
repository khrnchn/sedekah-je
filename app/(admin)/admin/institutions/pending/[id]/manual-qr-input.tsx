"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import QrCodeDisplay from "@/components/ui/qrCodeDisplay";
import { Textarea } from "@/components/ui/textarea";
import type { supportedPayments } from "@/lib/institution-constants";
import { Check, Loader2, Pencil } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveManualQrContent } from "../../_lib/save-manual-qr";

type Props = {
	institutionId: number;
	supportedPayment: (typeof supportedPayments)[number][] | null;
	onSuccess?: () => void;
};

export default function ManualQrInput({
	institutionId,
	supportedPayment,
	onSuccess,
}: Props) {
	const [qrString, setQrString] = useState("");
	const [isSaving, startSaving] = useTransition();

	const trimmed = qrString.trim();

	const handleSave = () => {
		if (!trimmed) {
			toast.error("Sila masukkan kandungan QR string");
			return;
		}

		startSaving(async () => {
			try {
				const result = await saveManualQrContent(institutionId, trimmed);

				if (result.success) {
					toast.success(result.message);
					onSuccess?.();
				} else {
					toast.error(result.message);
				}
			} catch (error) {
				console.error("Save failed:", error);
				toast.error("Failed to save QR content");
			}
		});
	};

	return (
		<Card className="w-full">
			<CardHeader className="pb-3">
				<CardTitle className="text-base font-semibold flex items-center gap-2">
					<Pencil className="h-4 w-4" />
					Manual QR String Input
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="manual-qr-string">QR Content String</Label>
					<Textarea
						id="manual-qr-string"
						placeholder="Paste the QR string here (e.g. 00020101021126620...)"
						value={qrString}
						onChange={(e) => setQrString(e.target.value)}
						rows={4}
						className="font-mono text-xs"
						disabled={isSaving}
					/>
				</div>

				{/* Live QR Preview */}
				{trimmed && (
					<div className="space-y-2">
						<Label className="text-sm font-medium">Preview</Label>
						<div className="flex justify-center rounded-lg border bg-muted/30 p-4">
							<QrCodeDisplay
								qrContent={trimmed}
								supportedPayment={
									(supportedPayment ??
										[]) as (typeof supportedPayments)[number][]
								}
								size={220}
							/>
						</div>
						<p className="text-xs text-muted-foreground text-center">
							Scan to verify the QR code is correct
						</p>
					</div>
				)}

				<Button
					onClick={handleSave}
					disabled={!trimmed || isSaving}
					className="w-full"
				>
					{isSaving ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							Saving...
						</>
					) : (
						<>
							<Check className="mr-2 h-4 w-4" />
							Save QR Content
						</>
					)}
				</Button>
			</CardContent>
		</Card>
	);
}

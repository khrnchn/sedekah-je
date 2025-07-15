"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitClaimRequest } from "@/lib/actions/claim-request";
import { useState } from "react";
import { toast } from "sonner";

interface ClaimModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	institutionId: number;
	institutionName: string;
}

export function ClaimModal({
	open,
	onOpenChange,
	institutionId,
	institutionName,
}: ClaimModalProps) {
	const [sourceUrl, setSourceUrl] = useState("");
	const [description, setDescription] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			const formData = new FormData();
			formData.append("institutionId", institutionId.toString());
			formData.append("sourceUrl", sourceUrl);
			formData.append("description", description);

			const result = await submitClaimRequest(formData);

			if (result.success) {
				toast.success(result.message);
				onOpenChange(false);
				setSourceUrl("");
				setDescription("");
			} else {
				toast.error(result.error);
			}
		} catch (error) {
			console.error("Error submitting claim:", error);
			toast.error("Gagal menghantar permohonan tuntutan.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Tuntut Institusi</DialogTitle>
					<DialogDescription>
						Anda ingin menuntut "{institutionName}" sebagai milik anda? Sila
						berikan maklumat tambahan untuk membantu admin mengesahkan tuntutan
						anda.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit}>
					<div className="grid gap-4 py-4">
						<div className="grid gap-2">
							<Label htmlFor="sourceUrl">URL Sumber (Pilihan)</Label>
							<Input
								id="sourceUrl"
								type="url"
								placeholder="https://example.com/bukti-pemilikan"
								value={sourceUrl}
								onChange={(e) => setSourceUrl(e.target.value)}
							/>
							<p className="text-sm text-muted-foreground">
								Pautan ke laman web rasmi, media sosial, atau dokumen yang
								membuktikan pemilikan.
							</p>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="description">Keterangan (Pilihan)</Label>
							<Textarea
								id="description"
								placeholder="Sila berikan keterangan tambahan mengenai tuntutan anda..."
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								rows={3}
							/>
							<p className="text-sm text-muted-foreground">
								Berikan butiran tambahan yang boleh membantu admin mengesahkan
								tuntutan anda.
							</p>
						</div>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isSubmitting}
						>
							Batal
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? "Menghantar..." : "Hantar Tuntutan"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
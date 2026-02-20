"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	approveClaimRequest,
	rejectClaimRequest,
} from "@/lib/features/claim-institution/admin-actions";
import { format } from "date-fns";
import { CheckCircle, ExternalLink, User, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type ClaimRequest = {
	id: number;
	institutionId: number;
	institutionName: string;
	institutionCategory: string;
	userId: string;
	userName: string | null;
	userEmail: string;
	sourceUrl: string | null;
	description: string | null;
	status: string;
	createdAt: Date;
};

interface ClaimRequestsTableProps {
	data: ClaimRequest[];
}

export function ClaimRequestsTable({ data }: ClaimRequestsTableProps) {
	const [selectedClaim, setSelectedClaim] = useState<ClaimRequest | null>(null);
	const [actionType, setActionType] = useState<"approve" | "reject" | null>(
		null,
	);
	const [adminNotes, setAdminNotes] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const router = useRouter();

	const handleAction = async () => {
		if (!selectedClaim || !actionType) return;

		setIsSubmitting(true);
		try {
			const formData = new FormData();
			formData.append("claimId", selectedClaim.id.toString());
			formData.append("adminNotes", adminNotes);

			const result =
				actionType === "approve"
					? await approveClaimRequest(formData)
					: await rejectClaimRequest(formData);

			if (result.success) {
				toast.success(result.message);
				setSelectedClaim(null);
				setActionType(null);
				setAdminNotes("");
				// Refresh the page to show updated data
				router.refresh();
			} else {
				toast.error(result.error);
			}
		} catch (error) {
			console.error("Error processing claim:", error);
			toast.error("Gagal memproses tuntutan");
		} finally {
			setIsSubmitting(false);
		}
	};

	const openDialog = (claim: ClaimRequest, type: "approve" | "reject") => {
		setSelectedClaim(claim);
		setActionType(type);
		setAdminNotes("");
	};

	const closeDialog = () => {
		setSelectedClaim(null);
		setActionType(null);
		setAdminNotes("");
	};

	if (data.length === 0) {
		return (
			<Card>
				<CardContent className="flex flex-col items-center justify-center py-12">
					<User className="h-12 w-12 text-muted-foreground mb-4" />
					<h3 className="text-lg font-semibold mb-2">Tiada Tuntutan Pending</h3>
					<p className="text-muted-foreground text-center">
						Semua tuntutan institusi telah diproses.
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<>
			<div className="space-y-4">
				{data.map((claim) => (
					<Card key={claim.id}>
						<CardHeader>
							<div className="flex items-start justify-between">
								<div className="space-y-1">
									<CardTitle className="text-lg">
										{claim.institutionName}
									</CardTitle>
									<div className="flex items-center gap-2">
										<Badge variant="outline">{claim.institutionCategory}</Badge>
										<Badge variant="secondary">Pending</Badge>
									</div>
								</div>
								<div className="flex gap-2">
									<Button
										size="sm"
										variant="outline"
										className="text-green-600 hover:text-green-700"
										onClick={() => openDialog(claim, "approve")}
									>
										<CheckCircle className="h-4 w-4 mr-1" />
										Luluskan
									</Button>
									<Button
										size="sm"
										variant="outline"
										className="text-red-600 hover:text-red-700"
										onClick={() => openDialog(claim, "reject")}
									>
										<XCircle className="h-4 w-4 mr-1" />
										Tolak
									</Button>
								</div>
							</div>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<h4 className="font-medium text-sm text-muted-foreground mb-1">
										Pemohon
									</h4>
									<p className="font-medium">
										{claim.userName || "Nama tidak tersedia"}
									</p>
									<p className="text-sm text-muted-foreground">
										{claim.userEmail}
									</p>
								</div>
								<div>
									<h4 className="font-medium text-sm text-muted-foreground mb-1">
										Tarikh Permohonan
									</h4>
									<p>{format(claim.createdAt, "dd/MM/yyyy HH:mm")}</p>
								</div>
							</div>

							{claim.sourceUrl && (
								<div>
									<h4 className="font-medium text-sm text-muted-foreground mb-1">
										URL Sumber
									</h4>
									<Link
										href={claim.sourceUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
									>
										{claim.sourceUrl}
										<ExternalLink className="h-3 w-3" />
									</Link>
								</div>
							)}

							{claim.description && (
								<div>
									<h4 className="font-medium text-sm text-muted-foreground mb-1">
										Keterangan
									</h4>
									<p className="text-sm bg-muted p-3 rounded-md">
										{claim.description}
									</p>
								</div>
							)}
						</CardContent>
					</Card>
				))}
			</div>

			{/* Action Dialog */}
			<Dialog open={!!selectedClaim} onOpenChange={closeDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{actionType === "approve" ? "Luluskan" : "Tolak"} Tuntutan
						</DialogTitle>
						<DialogDescription>
							{actionType === "approve"
								? `Anda akan meluluskan tuntutan untuk "${selectedClaim?.institutionName}". Institusi ini akan diberikan kepada ${selectedClaim?.userName || selectedClaim?.userEmail}.`
								: `Anda akan menolak tuntutan untuk "${selectedClaim?.institutionName}". Sila berikan sebab penolakan.`}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						<div>
							<Label htmlFor="adminNotes">
								{actionType === "approve"
									? "Nota Admin (Optional)"
									: "Sebab Penolakan"}
							</Label>
							<Textarea
								id="adminNotes"
								placeholder={
									actionType === "approve"
										? "Tambah nota jika perlu..."
										: "Sila nyatakan sebab penolakan..."
								}
								value={adminNotes}
								onChange={(e) => setAdminNotes(e.target.value)}
								rows={3}
							/>
						</div>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={closeDialog}
							disabled={isSubmitting}
						>
							Batal
						</Button>
						<Button
							onClick={handleAction}
							disabled={
								isSubmitting || (actionType === "reject" && !adminNotes.trim())
							}
							variant={actionType === "approve" ? "default" : "destructive"}
						>
							{isSubmitting
								? "Memproses..."
								: actionType === "approve"
									? "Luluskan"
									: "Tolak"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

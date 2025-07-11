"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { Check, Crown, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { processClaim } from "./actions/claims";

interface Claim {
	id: number;
	institutionId: number;
	claimantId: string;
	claimReason: string | null;
	status: "pending" | "approved" | "rejected";
	reviewedBy: string | null;
	reviewedAt: Date | string | null;
	adminNotes: string | null;
	createdAt: Date | string;
	updatedAt: Date | string | null;
	institution: {
		id: number;
		name: string;
		category: string;
		state: string;
		city: string;
		contributorId: string | null;
	} | null;
	claimant: {
		id: string;
		name: string | null;
		email: string;
		username: string | null;
		avatarUrl: string | null;
	} | null;
}

interface ClaimsTableProps {
	initialData: Claim[];
	status: "pending" | "approved" | "rejected";
	showActions: boolean;
}

export default function ClaimsTable({
	initialData,
	status,
	showActions,
}: ClaimsTableProps) {
	const { user, isAuthenticated } = useAuth();
	const router = useRouter();
	const [claims, setClaims] = useState(initialData);
	const [reviewDialog, setReviewDialog] = useState<{
		isOpen: boolean;
		claim: Claim | null;
		action: "approved" | "rejected" | null;
	}>({
		isOpen: false,
		claim: null,
		action: null,
	});
	const [adminNotes, setAdminNotes] = useState("");
	const [submitting, setSubmitting] = useState(false);

	// Update claims when initialData changes (e.g., on navigation)
	useEffect(() => {
		setClaims(initialData);
	}, [initialData]);

	const handleReview = async () => {
		if (!reviewDialog.claim || !reviewDialog.action) return;

		setSubmitting(true);
		try {
			const result = await processClaim(
				reviewDialog.claim.id.toString(),
				reviewDialog.action,
				adminNotes.trim() || undefined,
			);

			if (result.success) {
				toast.success(
					`Claim ${reviewDialog.action === "approved" ? "approved" : "rejected"} successfully`,
				);
				setReviewDialog({ isOpen: false, claim: null, action: null });
				setAdminNotes("");
				router.refresh();
			} else {
				toast.error(result.error || "Failed to process claim");
			}
		} catch (error) {
			console.error("Error processing claim:", error);
			toast.error("System error");
		} finally {
			setSubmitting(false);
		}
	};

	const openReviewDialog = (claim: Claim, action: "approved" | "rejected") => {
		setReviewDialog({ isOpen: true, claim, action });
		setAdminNotes("");
	};

	if (!isAuthenticated || user?.role !== "admin") {
		return (
			<div className="flex items-center justify-center min-h-[200px]">
				<p>Access denied</p>
			</div>
		);
	}

	if (claims.length === 0) {
		return (
			<div className="text-center py-12">
				<Crown className="h-12 w-12 mx-auto text-gray-400 mb-4" />
				<p className="text-gray-500">No {status} claims to display</p>
			</div>
		);
	}

	return (
		<>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{claims.map((claim) => (
					<Card key={claim.id} className="hover:shadow-lg transition-shadow">
						<CardHeader className="pb-3">
							<div className="flex items-start justify-between">
								<div className="flex-1">
									<CardTitle className="text-lg line-clamp-2">
										{claim.institution?.name || "Unknown Institution"}
									</CardTitle>
									<p className="text-sm text-gray-500 mt-1">
										{claim.institution?.city}, {claim.institution?.state}
									</p>
								</div>
								<Badge
									variant={
										claim.status === "approved"
											? "default"
											: claim.status === "rejected"
												? "destructive"
												: "secondary"
									}
									className="ml-2"
								>
									{claim.status === "pending"
										? "Pending"
										: claim.status === "approved"
											? "Approved"
											: "Rejected"}
								</Badge>
							</div>
						</CardHeader>
						<CardContent className="pt-0">
							<div className="space-y-3">
								<div>
									<p className="text-sm font-medium text-gray-700">Claimant:</p>
									<p className="text-sm text-gray-900">
										{claim.claimant?.name || "Unknown User"}
									</p>
									<p className="text-sm text-gray-500">
										{claim.claimant?.email || "No email"}
									</p>
								</div>

								{claim.claimReason && (
									<div>
										<p className="text-sm font-medium text-gray-700">Reason:</p>
										<p className="text-sm text-gray-900 line-clamp-3">
											{claim.claimReason}
										</p>
									</div>
								)}

								<div>
									<p className="text-sm font-medium text-gray-700">Date:</p>
									<p className="text-sm text-gray-500">
										{new Date(claim.createdAt).toLocaleDateString("en-US")}
									</p>
								</div>

								{claim.adminNotes && (
									<div>
										<p className="text-sm font-medium text-gray-700">
											Admin Notes:
										</p>
										<p className="text-sm text-gray-900 line-clamp-3">
											{claim.adminNotes}
										</p>
									</div>
								)}

								{showActions && (
									<div className="flex gap-2 pt-2">
										<Button
											size="sm"
											onClick={() => openReviewDialog(claim, "approved")}
											className="flex-1"
										>
											<Check className="h-4 w-4 mr-2" />
											Approve
										</Button>
										<Button
											size="sm"
											variant="destructive"
											onClick={() => openReviewDialog(claim, "rejected")}
											className="flex-1"
										>
											<X className="h-4 w-4 mr-2" />
											Reject
										</Button>
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Review Dialog */}
			<Dialog
				open={reviewDialog.isOpen}
				onOpenChange={(open) => {
					if (!open) {
						setReviewDialog({ isOpen: false, claim: null, action: null });
						setAdminNotes("");
					}
				}}
			>
				<DialogContent className="sm:max-w-[500px]">
					<DialogHeader>
						<DialogTitle>
							{reviewDialog.action === "approved" ? "Approve" : "Reject"} Claim
						</DialogTitle>
						<DialogDescription>
							{reviewDialog.action === "approved"
								? "Approve this claim and set the user as the institution contributor?"
								: "Reject this claim?"}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="adminNotes">
								Admin Notes{" "}
								<span className="text-sm text-gray-500">(optional)</span>
							</Label>
							<Textarea
								id="adminNotes"
								placeholder="Notes for admin..."
								value={adminNotes}
								onChange={(e) => setAdminNotes(e.target.value)}
								rows={3}
								maxLength={500}
							/>
						</div>
					</div>
					<div className="flex justify-end space-x-2">
						<Button
							variant="outline"
							onClick={() => {
								setReviewDialog({ isOpen: false, claim: null, action: null });
								setAdminNotes("");
							}}
							disabled={submitting}
						>
							Cancel
						</Button>
						<Button
							onClick={handleReview}
							disabled={submitting}
							variant={
								reviewDialog.action === "approved" ? "default" : "destructive"
							}
						>
							{submitting
								? "Processing..."
								: reviewDialog.action === "approved"
									? "Approve"
									: "Reject"}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}

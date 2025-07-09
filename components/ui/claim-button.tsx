"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { Crown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ClaimButtonProps {
	institutionId: string;
	institutionName: string;
	hasContributor: boolean;
	className?: string;
}

export default function ClaimButton({
	institutionId,
	institutionName,
	hasContributor,
	className,
}: ClaimButtonProps) {
	const { user, isAuthenticated } = useAuth();
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [claimReason, setClaimReason] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [hasPendingClaim, setHasPendingClaim] = useState(false);

	// Check if user has a pending claim when dialog opens
	const checkPendingClaim = async () => {
		if (!isAuthenticated) return;

		try {
			const response = await fetch(
				`/api/claims?institutionId=${institutionId}`,
			);
			const data = await response.json();

			if (data.hasPendingClaim) {
				setHasPendingClaim(true);
				toast.info("You already have a pending claim for this institution");
			}
		} catch (error) {
			console.error("Error checking pending claim:", error);
		}
	};

	const handleSubmitClaim = async () => {
		if (!isAuthenticated) {
			toast.error("Please log in first");
			return;
		}

		setIsSubmitting(true);

		try {
			const response = await fetch("/api/claims", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					institutionId,
					claimReason: claimReason.trim() || null,
				}),
			});

			const data = await response.json();

			if (response.ok) {
				toast.success("Claim submitted successfully! Please wait for admin approval.");
				setIsDialogOpen(false);
				setClaimReason("");
				setHasPendingClaim(true);
			} else {
				toast.error(data.error || "Failed to submit claim");
			}
		} catch (error) {
			console.error("Error submitting claim:", error);
			toast.error("System error. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	// Don't show button if institution already has a contributor
	if (hasContributor) {
		return null;
	}

	// Don't show button if user is not authenticated
	if (!isAuthenticated) {
		return null;
	}

	return (
		<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
			<DialogTrigger asChild>
				<Button
					size="sm"
					variant="outline"
					className={className}
					disabled={hasPendingClaim}
					onClick={checkPendingClaim}
				>
					<Crown className="h-4 w-4 mr-2" />
					{hasPendingClaim ? "Claim Pending" : "Claim Institution"}
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Claim Institution</DialogTitle>
					<DialogDescription>
						Do you want to claim the institution "{institutionName}" as yours?
						This claim will be reviewed by admin.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4 py-4">
					<div className="space-y-2">
						<Label htmlFor="claimReason">
							Claim Reason <span className="text-sm text-gray-500">(optional)</span>
						</Label>
						<Textarea
							id="claimReason"
							placeholder="Example: I am the manager of this institution, I manage the QR code, etc."
							value={claimReason}
							onChange={(e) => setClaimReason(e.target.value)}
							rows={3}
							maxLength={500}
						/>
						<p className="text-sm text-gray-500">
							{claimReason.length}/500 characters
						</p>
					</div>
				</div>
				<div className="flex justify-end space-x-2">
					<Button
						variant="outline"
						onClick={() => setIsDialogOpen(false)}
						disabled={isSubmitting}
					>
						Cancel
					</Button>
					<Button onClick={handleSubmitClaim} disabled={isSubmitting}>
						{isSubmitting ? "Submitting..." : "Submit Claim"}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
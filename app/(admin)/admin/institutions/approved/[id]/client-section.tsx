"use client";

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
import QrCodeDisplay from "@/components/ui/qrCodeDisplay";
import { Textarea } from "@/components/ui/textarea";
import type { supportedPayments } from "@/lib/institution-constants";
import { Loader2, PencilIcon, Undo2Icon, XIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { undoApproval } from "../../_lib/queries";
import ApprovedInstitutionForm from "./institution-form";

type Props = {
	institution: {
		id: number;
		name: string;
		qrContent: string | null;
		supportedPayment: (typeof supportedPayments)[number][] | null;
		qrImage: string | null;
		contributorName?: string | null;
		contributorId?: string | null;
		contributorRemarks?: string | null;
		sourceUrl?: string | null;
		createdAt?: Date;
		reviewedAt?: Date | null;
		reviewedBy?: string | null;
		adminNotes?: string | null;
		[key: string]: unknown;
	};
};

export default function ClientSection({ institution }: Props) {
	const [isEditing, setIsEditing] = useState(false);
	const [showUndoDialog, setShowUndoDialog] = useState(false);
	const [undoNotes, setUndoNotes] = useState("Duplicate entry");
	const [isPending, startTransition] = useTransition();
	const router = useRouter();

	const handleEditToggle = () => {
		setIsEditing(!isEditing);
	};

	function handleUndoApproval() {
		setShowUndoDialog(false);
		startTransition(async () => {
			const promise = undoApproval(institution.id, undoNotes);
			toast.promise(promise, {
				loading: "Undoing approval...",
				success: () => {
					router.push("/admin/institutions/approved");
					return `${institution.name} approval has been undone.`;
				},
				error: (err) => `Failed to undo approval: ${err.message}`,
			});
		});
	}

	return (
		<>
			{/* Sticky Action Bar */}
			<div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b py-4 mb-6">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<span className="text-sm text-muted-foreground">
							{isEditing ? "Edit Mode" : "View Mode"}
						</span>
					</div>
					<div className="flex items-center gap-2">
						<Button
							variant="destructive"
							size="sm"
							onClick={() => setShowUndoDialog(true)}
							disabled={isPending}
							className="gap-2"
						>
							{isPending ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<Undo2Icon className="h-4 w-4" />
							)}
							Undo Approval
						</Button>
						<Button
							variant={isEditing ? "outline" : "ghost"}
							size="sm"
							onClick={handleEditToggle}
							className="gap-2"
						>
							{isEditing ? (
								<>
									<XIcon className="h-4 w-4" />
									Cancel
								</>
							) : (
								<>
									<PencilIcon className="h-4 w-4" />
									Edit
								</>
							)}
						</Button>
					</div>
				</div>
			</div>

			{/* Undo Approval Dialog */}
			<Dialog
				open={showUndoDialog}
				onOpenChange={(open) => !isPending && setShowUndoDialog(open)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Undo Approval</DialogTitle>
						<DialogDescription>
							This will reject &ldquo;{institution.name}&rdquo; and remove it
							from the public directory. This is typically used for duplicate
							entries.
						</DialogDescription>
					</DialogHeader>
					<div className="py-4">
						<Textarea
							value={undoNotes}
							onChange={(e) => setUndoNotes(e.target.value)}
							placeholder="Reason for undoing approval (e.g. duplicate of #123)"
							className="min-h-[100px]"
						/>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowUndoDialog(false)}
							disabled={isPending}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleUndoApproval}
							disabled={isPending}
						>
							{isPending ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : null}
							Undo Approval
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<div className="grid lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2">
					<ApprovedInstitutionForm
						institution={{
							...institution,
							sourceUrl: institution.sourceUrl ?? undefined,
							contributorRemarks: institution.contributorRemarks ?? undefined,
						}}
						isEditing={isEditing}
						onEditComplete={() => setIsEditing(false)}
					/>
				</div>
				<div className="lg:col-span-1">
					{/* DuitNow QR Section */}
					<Card className="p-4 rounded-lg shadow-sm sticky top-4">
						<CardHeader className="pb-4">
							<CardTitle className="text-xl font-semibold flex items-center gap-2">
								📱 DuitNow QR Code
							</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-col items-center gap-4">
							{institution.qrContent ? (
								<>
									<div className="flex justify-center">
										<QrCodeDisplay
											qrContent={institution.qrContent}
											supportedPayment={
												(institution.supportedPayment ??
													[]) as (typeof supportedPayments)[number][]
											}
											size={280}
										/>
									</div>
									<p className="text-sm text-muted-foreground text-center">
										Scan to verify recipient name
									</p>
									<div className="w-full bg-muted rounded-md p-3 break-all text-xs border">
										<div className="font-medium text-sm mb-1">QR Content:</div>
										{institution.qrContent}
									</div>

									{/* Original uploaded QR image */}
									{institution.qrImage && (
										<div className="w-full border-t pt-4">
											<div className="text-sm font-medium mb-2">
												Original Uploaded Image:
											</div>
											<div className="flex justify-center">
												<Image
													src={institution.qrImage}
													alt="Original QR Code Upload"
													width={200}
													height={200}
													className="rounded-lg border"
												/>
											</div>
										</div>
									)}
								</>
							) : (
								<div className="flex flex-col items-center gap-4 w-full">
									<div className="text-sm text-muted-foreground p-4 bg-amber-50 border border-amber-200 rounded-md text-center">
										No QR code content available
									</div>
									<div className="flex justify-center">
										<Image
											src={institution.qrImage ?? "/placeholder.svg"}
											alt="QR Code"
											width={280}
											height={280}
											className="rounded-lg border"
										/>
									</div>
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</>
	);
}

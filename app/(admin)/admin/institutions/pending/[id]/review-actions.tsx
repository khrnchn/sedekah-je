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
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { ChevronDown, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { approveInstitution, rejectInstitution } from "../../_lib/queries";
import type { ReviewFormHandle } from "./institution-review-form";

type Props = {
	institutionId: number;
	institutionName: string;
	formRef: React.RefObject<ReviewFormHandle>;
};

export default function ReviewActions({
	institutionId,
	institutionName,
	formRef,
}: Props) {
	const { user } = useAuth();
	const router = useRouter();
	const [dialog, setDialog] = useState<"approve" | "reject" | null>(null);
	const [notes, setNotes] = useState("");
	const [isPending, startTransition] = useTransition();
	const [isSaving, setIsSaving] = useState(false);

	async function handleAction(action: "approve" | "reject") {
		if (!user?.id) {
			toast.error("User not authenticated");
			return;
		}
		startTransition(async () => {
			const promise =
				action === "approve"
					? approveInstitution(institutionId, user.id, notes)
					: rejectInstitution(institutionId, user.id, notes);

			toast.promise(promise, {
				loading: "Submitting...",
				success: () => {
					router.push("/admin/institutions/pending");
					return `${institutionName} has been ${action}d.`;
				},
				error: (err) => `Action failed: ${err.message}`,
			});
		});
	}

	async function handleSaveAndApprove() {
		setIsSaving(true);
		const saved = await formRef.current?.save();
		setIsSaving(false);
		if (saved) {
			setDialog("approve"); // open approve dialog to capture notes, then approve
		}
	}

	return (
		<TooltipProvider>
			<div className="flex items-center gap-2">
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="destructive"
							onClick={() => setDialog("reject")}
							disabled={isPending || isSaving}
						>
							{isPending ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : null}
							Reject
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Reject this institution submission.</p>
					</TooltipContent>
				</Tooltip>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="outline"
							className="flex items-center gap-2"
							disabled={isPending || isSaving}
						>
							{isSaving ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : null}
							Save <ChevronDown className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start">
						<DropdownMenuItem
							disabled={isSaving}
							onSelect={async () => {
								setIsSaving(true);
								const ok = await formRef.current?.save();
								if (ok) toast.success("Changes saved");
								setIsSaving(false);
							}}
						>
							{isSaving ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : null}
							Save Changes
						</DropdownMenuItem>
						<DropdownMenuItem
							onSelect={handleSaveAndApprove}
							disabled={isSaving}
						>
							{isSaving ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : null}
							Save & Approve
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>

				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							onClick={() => setDialog("approve")}
							disabled={isPending || isSaving}
						>
							{isPending ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : null}
							Approve
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Approve this institution. Any unsaved changes will be lost.</p>
					</TooltipContent>
				</Tooltip>

				<Dialog
					open={dialog !== null}
					onOpenChange={(open) => !isPending && setDialog(open ? dialog : null)}
				>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>
								{dialog === "approve"
									? "Approve Institution"
									: "Reject Institution"}
							</DialogTitle>
							<DialogDescription>
								{dialog === "approve"
									? "Confirm approving"
									: "Confirm rejecting"}{" "}
								{institutionName}.
							</DialogDescription>
						</DialogHeader>
						<div className="py-4">
							<Textarea
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
								placeholder="Admin notes (optional)"
								className="min-h-[100px]"
							/>
						</div>
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => setDialog(null)}
								disabled={isPending}
							>
								Cancel
							</Button>
							<Button
								disabled={isPending}
								variant={dialog === "reject" ? "destructive" : "default"}
								onClick={() => dialog && handleAction(dialog)}
							>
								{isPending ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : null}
								{dialog === "approve" ? "Approve" : "Reject"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>
		</TooltipProvider>
	);
}

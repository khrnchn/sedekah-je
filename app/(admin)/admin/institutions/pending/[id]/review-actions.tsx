"use client";

import {
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	Loader2,
	Mail,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { REJECTION_TEMPLATES } from "@/lib/admin-templates";
import { approveInstitution, rejectInstitution } from "../../_lib/actions";
import { getNextPendingInstitutionId } from "../../_lib/navigation";
import type { ReviewFormHandle } from "./institution-review-form";

type Props = {
	institutionId: number;
	institutionName: string;
	contributorEmail?: string | null;
	formRef: React.RefObject<ReviewFormHandle | null>;
	prevId: number | null;
	nextId: number | null;
	position: number;
	total: number;
};

export default function ReviewActions({
	institutionId,
	institutionName,
	contributorEmail,
	formRef,
	prevId,
	nextId,
	position,
	total,
}: Props) {
	const { user } = useAuth();
	const router = useRouter();
	const [dialog, setDialog] = useState<"approve" | "reject" | "email" | null>(
		null,
	);
	const [notes, setNotes] = useState("");
	const [emailSubject, setEmailSubject] = useState("");
	const [emailBody, setEmailBody] = useState("");
	const [isPending, startTransition] = useTransition();
	const [isSaving, setIsSaving] = useState(false);

	async function handleAction(action: "approve" | "reject") {
		if (!user?.id) {
			toast.error("User not authenticated");
			return;
		}
		setDialog(null);
		startTransition(async () => {
			const promise =
				action === "approve"
					? approveInstitution(institutionId, user.id, notes)
					: rejectInstitution(institutionId, user.id, notes);

			toast.promise(promise, {
				loading: "Submitting...",
				success: () => {
					router.push("/admin/institutions/pending");
					return `${institutionName} has been ${action === "approve" ? "approved" : "rejected"}.`;
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

	const handleSaveApproveAndNext = useCallback(async () => {
		if (!user?.id) {
			toast.error("User not authenticated");
			return;
		}
		setIsSaving(true);
		const ok = await formRef.current?.save();
		if (!ok) {
			setIsSaving(false);
			return;
		}
		let nextId: number | null = null;
		try {
			nextId = await getNextPendingInstitutionId(institutionId);
		} catch (e) {
			console.error("[next-navigation]", e);
		}
		try {
			await approveInstitution(institutionId, user.id);
			if (nextId != null) {
				router.push(`/admin/institutions/pending/${nextId}`);
			} else {
				router.push("/admin/institutions/pending");
				toast.success("Approved. No more pending institutions");
			}
		} catch (e) {
			console.error("[approve-and-next]", e);
			toast.error("Failed to approve institution");
		} finally {
			setIsSaving(false);
		}
	}, [user?.id, institutionId, router, formRef]);

	useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (isPending || isSaving) return;
			const target = e.target as HTMLElement;
			const tag = target?.tagName?.toUpperCase();
			if (tag === "TEXTAREA" || tag === "INPUT" || tag === "SELECT") return;
			if (e.key === "Enter" && e.ctrlKey) {
				if (e.shiftKey) {
					e.preventDefault();
					handleSaveApproveAndNext();
				} else {
					e.preventDefault();
					setDialog("approve");
				}
			}
		};
		document.addEventListener("keydown", down);
		return () => document.removeEventListener("keydown", down);
	}, [isPending, isSaving, handleSaveApproveAndNext]);

	return (
		<TooltipProvider>
			<div className="flex items-center gap-2 flex-wrap">
				<div className="flex items-center gap-1 mr-2">
					<span className="text-sm text-muted-foreground tabular-nums">
						{position} of {total}
					</span>
					{prevId != null ? (
						<Button variant="outline" size="icon" asChild>
							<Link href={`/admin/institutions/pending/${prevId}`}>
								<ChevronLeft className="h-4 w-4" />
							</Link>
						</Button>
					) : (
						<Button variant="outline" size="icon" disabled>
							<ChevronLeft className="h-4 w-4" />
						</Button>
					)}
					{nextId != null ? (
						<Button variant="outline" size="icon" asChild>
							<Link href={`/admin/institutions/pending/${nextId}`}>
								<ChevronRight className="h-4 w-4" />
							</Link>
						</Button>
					) : (
						<Button variant="outline" size="icon" disabled>
							<ChevronRight className="h-4 w-4" />
						</Button>
					)}
				</div>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="outline"
							onClick={() => setDialog("email")}
							disabled={!contributorEmail || isPending || isSaving}
						>
							<Mail className="mr-2 h-4 w-4" />
							Email
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>
							{contributorEmail
								? "Email the contributor"
								: "No email available for this contributor"}
						</p>
					</TooltipContent>
				</Tooltip>

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
							disabled={isSaving}
							onSelect={handleSaveApproveAndNext}
						>
							{isSaving ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<ChevronRight className="mr-2 h-4 w-4" />
							)}
							Save, Approve & Next
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
						{dialog === "email" ? (
							<>
								<DialogHeader>
									<DialogTitle>Email Contributor</DialogTitle>
									<DialogDescription>
										Compose an email to the contributor. Clicking "Open Email
										Client" will open your default email client.
									</DialogDescription>
								</DialogHeader>
								<div className="space-y-4 py-4">
									<div className="space-y-2">
										<label htmlFor="email-to" className="text-sm font-medium">
											To
										</label>
										<div
											id="email-to"
											className="flex h-9 w-full rounded-md border border-input bg-muted px-3 py-1 text-sm"
										>
											{contributorEmail ?? "No email available"}
										</div>
									</div>
									<div className="space-y-2">
										<label
											htmlFor="email-subject"
											className="text-sm font-medium"
										>
											Subject
										</label>
										<Input
											id="email-subject"
											value={emailSubject}
											onChange={(e) => setEmailSubject(e.target.value)}
											placeholder={`Re: Your institution submission - ${institutionName}`}
										/>
									</div>
									<div className="space-y-2">
										<label htmlFor="email-body" className="text-sm font-medium">
											Message
										</label>
										<Textarea
											id="email-body"
											value={emailBody}
											onChange={(e) => setEmailBody(e.target.value)}
											placeholder="Enter your message..."
											className="min-h-[100px]"
										/>
									</div>
								</div>
								<DialogFooter>
									<Button variant="outline" onClick={() => setDialog(null)}>
										Cancel
									</Button>
									<Button
										onClick={() => {
											if (contributorEmail) {
												const url = `mailto:${contributorEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
												window.open(url);
												setDialog(null);
											}
										}}
										disabled={!contributorEmail}
									>
										<Mail className="mr-2 h-4 w-4" />
										Open Email Client
									</Button>
								</DialogFooter>
							</>
						) : (
							<>
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
								<div className="py-4 space-y-3">
									{dialog === "reject" && (
										<div className="flex flex-wrap gap-2">
											{REJECTION_TEMPLATES.map((template) => (
												<Button
													key={template.label}
													type="button"
													variant="outline"
													size="sm"
													onClick={() => setNotes(template.value)}
												>
													{template.label}
												</Button>
											))}
										</div>
									)}
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
							</>
						)}
					</DialogContent>
				</Dialog>
			</div>
		</TooltipProvider>
	);
}

"use client";

import {
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	CopyCheck,
	Keyboard,
	Loader2,
	Mail,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { toast } from "sonner";
import { Kbd } from "@/components/kbd";
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
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
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
import {
	getNextPendingInstitutionId,
	getNextToReviewAfterDecision,
} from "../../_lib/navigation";
import {
	getPendingListHref,
	getPendingReviewHref,
} from "../../_lib/pending-review-scope";
import type { ReviewFormHandle } from "./institution-review-form";

const SHORTCUTS = [
	["a", "Approve and open the next pending item"],
	["ctrl Enter", "Approve and next"],
	["r", "Reject"],
	["j", "Next pending item"],
	["k", "Previous pending item"],
	["?", "Show this list"],
] as const;

export type QrDuplicate = {
	id: number;
	name: string;
	slug: string;
	category: string;
	city: string;
	state: string;
	status: string;
};

type Props = {
	institutionId: number;
	institutionName: string;
	contributorEmail?: string | null;
	formRef: React.RefObject<ReviewFormHandle | null>;
	prevId: number | null;
	nextId: number | null;
	position: number;
	total: number;
	includeAutomated: boolean;
	duplicate?: QrDuplicate | null;
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
	includeAutomated,
	duplicate,
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
	const [showShortcuts, setShowShortcuts] = useState(false);

	const handleReject = useCallback(async () => {
		if (!user?.id) {
			toast.error("User not authenticated");
			return;
		}
		setDialog(null);
		startTransition(async () => {
			let nextPendingId: number | null = null;
			try {
				nextPendingId = await getNextPendingInstitutionId(
					institutionId,
					includeAutomated,
				);
			} catch (e) {
				console.error("[next-navigation]", e);
			}

			const promise = rejectInstitution(institutionId, user.id, notes);
			toast.promise(promise, {
				loading: "Submitting...",
				success: `${institutionName} has been rejected.`,
				error: (err) => `Action failed: ${err.message}`,
			});

			try {
				await promise;
				if (nextPendingId != null) {
					router.push(getPendingReviewHref(nextPendingId, includeAutomated));
					return;
				}

				const nextToReview = await getNextToReviewAfterDecision(
					institutionId,
					includeAutomated,
				);
				if (nextToReview != null) {
					router.push(getPendingReviewHref(nextToReview, includeAutomated));
					return;
				}

				router.push(getPendingListHref(includeAutomated));
			} catch {
				// toast.promise displays the action error.
			}
		});
	}, [
		user?.id,
		institutionId,
		includeAutomated,
		institutionName,
		notes,
		router,
	]);

	/**
	 * The only approve path. Saving first is what stops the form's unsaved edits
	 * from being silently dropped, and it runs the review schema validation
	 * before the record goes live.
	 */
	const approveAndNext = useCallback(
		async (approveNotes?: string) => {
			if (!user?.id) {
				toast.error("User not authenticated");
				return;
			}
			setDialog(null);
			setIsSaving(true);
			const ok = await formRef.current?.save();
			if (!ok) {
				setIsSaving(false);
				return;
			}
			let nextId: number | null = null;
			try {
				nextId = await getNextPendingInstitutionId(
					institutionId,
					includeAutomated,
				);
			} catch (e) {
				console.error("[next-navigation]", e);
			}
			try {
				await approveInstitution(institutionId, user.id, approveNotes);
				if (nextId != null) {
					router.push(getPendingReviewHref(nextId, includeAutomated));
				} else {
					const nextToReview = await getNextToReviewAfterDecision(
						institutionId,
						includeAutomated,
					);
					if (nextToReview != null) {
						router.push(getPendingReviewHref(nextToReview, includeAutomated));
					} else {
						router.push(getPendingListHref(includeAutomated));
						toast.success("Approved. No more pending institutions");
					}
				}
			} catch (e) {
				console.error("[approve-and-next]", e);
				toast.error("Failed to approve institution");
			} finally {
				setIsSaving(false);
			}
		},
		[user?.id, institutionId, includeAutomated, router, formRef],
	);

	const saveOnly = useCallback(async () => {
		setIsSaving(true);
		const ok = await formRef.current?.save();
		if (ok) toast.success("Changes saved");
		setIsSaving(false);
	}, [formRef]);

	const rejectAsDuplicate = () => {
		if (!duplicate) return;
		const template = REJECTION_TEMPLATES.find((t) => t.label === "Duplicate");
		setNotes(
			template?.value.replace(
				"https://sedekah.je/...",
				`https://sedekah.je/${duplicate.category}/${duplicate.slug}`,
			) ?? "",
		);
		setDialog("reject");
	};

	const isBusy = isPending || isSaving;
	const goTo = (id: number | null) => {
		if (id != null) router.push(getPendingReviewHref(id, includeAutomated));
	};

	// react-hotkeys-hook ignores form tags by default, which replaces the manual
	// input guard the old handler needed.
	useHotkeys("a", () => approveAndNext(), { enabled: !isBusy });
	useHotkeys("ctrl+enter", () => approveAndNext(), { enabled: !isBusy });
	useHotkeys("r", () => setDialog("reject"), { enabled: !isBusy });
	useHotkeys("j", () => goTo(nextId), { enabled: !isBusy });
	useHotkeys("k", () => goTo(prevId), { enabled: !isBusy });
	useHotkeys("shift+slash", () => setShowShortcuts(true));

	return (
		<TooltipProvider>
			<div className="flex items-center gap-2 flex-wrap">
				<div className="flex items-center gap-1 mr-2">
					<span className="text-sm text-muted-foreground tabular-nums">
						{position} of {total}
					</span>
					{prevId != null ? (
						<Button variant="outline" size="icon" asChild>
							<Link href={getPendingReviewHref(prevId, includeAutomated)}>
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
							<Link href={getPendingReviewHref(nextId, includeAutomated)}>
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
							disabled={isBusy}
						>
							{isPending ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : null}
							Reject
							<Kbd variant="outline" className="ml-2">
								r
							</Kbd>
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Reject this institution submission.</p>
					</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger asChild>
						<Button variant="outline" onClick={saveOnly} disabled={isBusy}>
							{isSaving ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : null}
							Save
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Save edits without deciding.</p>
					</TooltipContent>
				</Tooltip>

				<div className="flex items-center">
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								onClick={() => approveAndNext()}
								disabled={isBusy}
								className="rounded-r-none"
							>
								{isBusy ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : null}
								Approve &amp; Next
								<Kbd variant="outline" className="ml-2">
									a
								</Kbd>
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>
								Saves any edits, approves, then opens the next pending item.
							</p>
						</TooltipContent>
					</Tooltip>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								disabled={isBusy}
								className="rounded-l-none border-l border-primary-foreground/25 px-2"
							>
								<ChevronDown className="h-4 w-4" />
								<span className="sr-only">More approve options</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onSelect={() => setDialog("approve")}>
								Approve with notes...
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				<Button
					variant="ghost"
					size="icon"
					onClick={() => setShowShortcuts(true)}
					aria-label="Keyboard shortcuts"
				>
					<Keyboard className="h-4 w-4" />
				</Button>

				{/* w-full puts this on its own line inside the wrapping action row */}
				{duplicate && (
					<div className="flex w-full flex-wrap items-center gap-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm">
						<CopyCheck className="h-4 w-4 shrink-0 text-destructive" />
						<span>
							Same QR content as{" "}
							<Link
								href={
									duplicate.status === "pending"
										? getPendingReviewHref(duplicate.id, includeAutomated)
										: `/admin/institutions/approved/${duplicate.id}`
								}
								className="font-medium underline"
							>
								#{duplicate.id} {duplicate.name}
							</Link>{" "}
							<span className="text-muted-foreground">
								({duplicate.city}, {duplicate.state}, {duplicate.status})
							</span>
						</span>
						<Button
							variant="destructive"
							size="sm"
							className="ml-auto"
							onClick={rejectAsDuplicate}
							disabled={isBusy}
						>
							Reject as duplicate
						</Button>
					</div>
				)}

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
										disabled={isBusy}
										variant={dialog === "reject" ? "destructive" : "default"}
										onClick={() =>
											dialog === "approve"
												? approveAndNext(notes)
												: handleReject()
										}
									>
										{isBusy ? (
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										) : null}
										{dialog === "approve" ? "Approve & Next" : "Reject"}
									</Button>
								</DialogFooter>
							</>
						)}
					</DialogContent>
				</Dialog>

				<Sheet open={showShortcuts} onOpenChange={setShowShortcuts}>
					<SheetContent>
						<SheetHeader>
							<SheetTitle>Keyboard shortcuts</SheetTitle>
							<SheetDescription>
								Available while reviewing, except when typing in a field.
							</SheetDescription>
						</SheetHeader>
						<dl className="mt-6 space-y-3 text-sm">
							{SHORTCUTS.map(([keys, description]) => (
								<div key={keys} className="flex items-center justify-between">
									<dt className="text-muted-foreground">{description}</dt>
									<dd className="flex gap-1">
										{keys.split(" ").map((key) => (
											<Kbd key={key}>{key}</Kbd>
										))}
									</dd>
								</div>
							))}
						</dl>
					</SheetContent>
				</Sheet>
			</div>
		</TooltipProvider>
	);
}

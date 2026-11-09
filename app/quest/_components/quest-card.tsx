"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { QuestMosqueView } from "@/app/quest/_lib/types";
import { directionsUrl, type QuestView } from "@/app/quest/_lib/url-state";
import QrCodeDisplay from "@/components/institution/qr-code-display";
import { Button } from "@/components/ui/button";
import { normalizeInstitutionCategory } from "@/lib/institution-categories";
import { cn } from "@/lib/utils";
import QuestContributeForm from "./quest-contribute-form";

const STATUS_PILL = {
	has_qr: {
		label: "Has QR",
		className:
			"border-transparent bg-emerald-600/10 text-emerald-700 dark:text-emerald-400",
	},
	in_review: {
		label: "In review",
		className:
			"border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400",
	},
	missing: {
		label: "Missing QR",
		className: "border-border text-foreground",
	},
} as const;

type QuestCardProps = {
	mosque: QuestMosqueView;
	view: QuestView;
	onClose: () => void;
};

export default function QuestCard({ mosque, view, onClose }: QuestCardProps) {
	const [contributeOpen, setContributeOpen] = useState(false);
	const pill = STATUS_PILL[mosque.status];
	const listingHref =
		mosque.institutionCategory && mosque.institutionSlug
			? `/${normalizeInstitutionCategory(mosque.institutionCategory)}/${mosque.institutionSlug}`
			: null;

	return (
		<section
			aria-label={mosque.name}
			className="fixed inset-x-0 bottom-0 z-20 max-h-[40dvh] overflow-y-auto rounded-t-2xl border-t border-border bg-background px-4 pb-6 pt-4 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] md:static md:z-auto md:max-h-none md:w-[360px] md:shrink-0 md:rounded-none md:border-l md:border-t-0 md:shadow-none"
		>
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0 flex-1">
					<h2 className="text-base font-semibold leading-snug text-foreground">
						{mosque.name}
					</h2>
					{mosque.address && (
						<p className="mt-0.5 text-xs text-muted-foreground">
							{mosque.address}
						</p>
					)}
					{!mosque.coords && (
						<p className="mt-0.5 text-xs text-muted-foreground">
							No map location
						</p>
					)}
				</div>
				<div className="flex shrink-0 items-center gap-1">
					<span
						className={cn(
							"rounded-full border px-2 py-0.5 text-[11px] font-medium",
							pill.className,
						)}
					>
						{pill.label}
					</span>
					<button
						type="button"
						onClick={onClose}
						aria-label="Close"
						className="inline-flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
					>
						<X className="h-4 w-4" />
					</button>
				</div>
			</div>

			{mosque.status === "has_qr" ? (
				<div className="mt-4 space-y-3">
					{mosque.qrContent && (
						<QrCodeDisplay
							qrContent={mosque.qrContent}
							supportedPayment={mosque.supportedPayment ?? undefined}
							size={140}
						/>
					)}
					{mosque.contributorName && (
						<p className="text-xs text-muted-foreground">
							Added by {mosque.contributorName}
						</p>
					)}
					{listingHref && (
						<Link
							href={listingHref}
							className="inline-block text-sm font-medium text-foreground underline underline-offset-4"
						>
							View listing
						</Link>
					)}
				</div>
			) : (
				<>
					{mosque.pendingAttempts > 0 && (
						<p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
							<span className="tabular-nums">{mosque.pendingAttempts}</span>{" "}
							{mosque.pendingAttempts === 1 ? "submission" : "submissions"} in
							review. You can still submit.
						</p>
					)}
					<div className="mt-3 flex gap-2">
						<Button
							type="button"
							className="h-11 flex-1 bg-foreground text-background hover:bg-foreground/90"
							onClick={() => setContributeOpen(true)}
						>
							Submit QR
						</Button>
						<Button asChild variant="outline" className="h-11">
							<a href={directionsUrl(mosque)} target="_blank" rel="noreferrer">
								Directions
							</a>
						</Button>
					</div>
					<QuestContributeForm
						mosque={mosque}
						view={view}
						open={contributeOpen}
						onOpenChange={setContributeOpen}
					/>
				</>
			)}
		</section>
	);
}

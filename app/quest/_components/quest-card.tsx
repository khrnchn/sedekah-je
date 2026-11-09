"use client";

import {
	ArrowUpRight,
	ChevronLeft,
	ChevronRight,
	CircleCheck,
	CircleHelp,
	Clock3,
	Maximize2,
	Navigation,
	ScanLine,
	X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { QuestMosqueView } from "@/app/quest/_lib/types";
import { directionsUrl, type QuestView } from "@/app/quest/_lib/url-state";
import QrCodeDisplay from "@/components/institution/qr-code-display";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { normalizeInstitutionCategory } from "@/lib/institution-categories";
import { paymentBrands } from "@/lib/payment-brands";
import QuestContributeForm from "./quest-contribute-form";

const STATUS = {
	has_qr: { label: "Has QR", icon: CircleCheck },
	in_review: { label: "In review", icon: Clock3 },
	missing: { label: "Missing QR", icon: CircleHelp },
} as const;

type QuestCardProps = {
	mosque: QuestMosqueView;
	view: QuestView;
	districtSlug: string;
	onClose: () => void;
	step?: {
		index: number;
		total: number;
		onPrev: () => void;
		onNext: () => void;
	};
};

export default function QuestCard({
	mosque,
	view,
	districtSlug,
	onClose,
	step,
}: QuestCardProps) {
	const [contributeOpen, setContributeOpen] = useState(false);
	const [qrOpen, setQrOpen] = useState(false);
	const closeRef = useRef<HTMLButtonElement>(null);
	useEffect(() => {
		closeRef.current?.focus({ preventScroll: true });
	}, []);
	useEffect(() => {
		const closeOnEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape" && !contributeOpen && !qrOpen) onClose();
		};
		window.addEventListener("keydown", closeOnEscape);
		return () => window.removeEventListener("keydown", closeOnEscape);
	}, [contributeOpen, qrOpen, onClose]);
	const { label, icon: StatusIcon } = STATUS[mosque.status];
	const listingHref =
		mosque.institutionCategory && mosque.institutionSlug
			? `/${normalizeInstitutionCategory(mosque.institutionCategory)}/${mosque.institutionSlug}`
			: null;
	const payments = mosque.supportedPayment
		?.map((payment) => paymentBrands[payment]?.label)
		.filter(Boolean)
		.join(" · ");

	return (
		<section
			aria-label={mosque.name}
			className="quest-detail"
			data-status={mosque.status}
		>
			<button
				ref={closeRef}
				type="button"
				onClick={onClose}
				aria-label="Close mosque details"
				className="quest-detail-close"
			>
				<X size={18} />
			</button>
			<div className="quest-detail-scroll">
				<div className="quest-detail-status">
					<StatusIcon size={14} />
					<span>{label}</span>
				</div>
				<h2>{mosque.name}</h2>
				{mosque.address && (
					<p className="quest-detail-address">{mosque.address}</p>
				)}
				{!mosque.coords && (
					<p className="mt-2 text-xs text-muted-foreground">No map location</p>
				)}

				{mosque.status === "has_qr" ? (
					mosque.qrContent && (
						<div className="quest-qr-row">
							<QrCodeDisplay
								qrContent={mosque.qrContent}
								supportedPayment={mosque.supportedPayment ?? undefined}
								size={132}
								aria-label={`Enlarge donation QR for ${mosque.name}`}
								onClick={() => setQrOpen(true)}
							/>
							<div className="quest-qr-meta">
								<p className="quest-qr-label">Donation QR</p>
								{payments && <p className="quest-qr-payment">{payments}</p>}
								{mosque.contributorName && (
									<p className="quest-qr-credit">
										Added by <span>{mosque.contributorName}</span>
									</p>
								)}
								<button
									type="button"
									onClick={() => setQrOpen(true)}
									className="quest-enlarge-qr"
								>
									<Maximize2 size={13} /> Enlarge QR
								</button>
							</div>
						</div>
					)
				) : (
					<p className="quest-attempt-notice">
						{mosque.pendingAttempts > 0 ? (
							<>
								<span className="tabular-nums">{mosque.pendingAttempts}</span>{" "}
								{mosque.pendingAttempts === 1 ? "submission" : "submissions"} in
								review. You can still submit.
							</>
						) : (
							"Help add this mosque’s donation QR."
						)}
					</p>
				)}
			</div>
			<div className="quest-detail-actions">
				{mosque.status === "has_qr" ? (
					listingHref && (
						<Button asChild className="quest-detail-primary h-11 flex-1">
							<Link href={listingHref}>
								View listing <ArrowUpRight size={15} className="ml-2" />
							</Link>
						</Button>
					)
				) : (
					<Button
						type="button"
						className="quest-detail-primary h-11 flex-1"
						onClick={() => setContributeOpen(true)}
					>
						<ScanLine size={15} className="mr-2" /> Submit QR
					</Button>
				)}
				<Button asChild variant="outline" className="h-11 flex-1">
					<a href={directionsUrl(mosque)} target="_blank" rel="noreferrer">
						<Navigation size={14} className="mr-2" /> Directions
					</a>
				</Button>
			</div>
			{step && step.total > 1 && (
				<nav aria-label="Browse mosques" className="quest-detail-step">
					<button type="button" onClick={step.onPrev}>
						<ChevronLeft size={16} aria-hidden /> Previous
					</button>
					<span className="tabular-nums">
						{step.index + 1} of {step.total}
					</span>
					<button type="button" onClick={step.onNext}>
						Next <ChevronRight size={16} aria-hidden />
					</button>
				</nav>
			)}
			<QuestContributeForm
				mosque={mosque}
				view={view}
				districtSlug={districtSlug}
				open={contributeOpen}
				onOpenChange={setContributeOpen}
			/>
			{mosque.qrContent && (
				<Dialog open={qrOpen} onOpenChange={setQrOpen}>
					<DialogContent className="quest-portal quest-submit-dialog quest-qr-dialog sm:max-w-sm">
						<DialogHeader>
							<DialogTitle className="pr-8 text-left">Donation QR</DialogTitle>
							<DialogDescription className="text-left">
								{mosque.name}
							</DialogDescription>
						</DialogHeader>
						<div className="flex justify-center py-4">
							<QrCodeDisplay
								qrContent={mosque.qrContent}
								supportedPayment={mosque.supportedPayment ?? undefined}
								size={240}
								aria-label={`Donation QR for ${mosque.name}`}
							/>
						</div>
					</DialogContent>
				</Dialog>
			)}
		</section>
	);
}

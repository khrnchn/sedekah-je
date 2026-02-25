"use client";

import { Compass } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { TourSnapshot } from "@/lib/onboarding-tour/types";

async function fetchSnapshot(): Promise<TourSnapshot | null> {
	try {
		const res = await fetch("/api/onboarding-tour");
		if (!res.ok) return null;
		return (await res.json()) as TourSnapshot;
	} catch {
		return null;
	}
}

async function resumeTour(): Promise<TourSnapshot | null> {
	try {
		const res = await fetch("/api/onboarding-tour", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ action: "resume" }),
		});
		if (!res.ok) return null;
		return (await res.json()) as TourSnapshot;
	} catch {
		return null;
	}
}

const ELIGIBLE_STATES = new Set(["not_started", "in_progress", "skipped"]);

export function OnboardingSambungButton({
	variant = "outline",
	size = "sm",
	className,
}: {
	variant?: "outline" | "default" | "ghost";
	size?: "sm" | "default" | "icon";
	className?: string;
}) {
	const [snapshot, setSnapshot] = useState<TourSnapshot | null>(null);
	const [isResuming, setIsResuming] = useState(false);

	useEffect(() => {
		fetchSnapshot().then(setSnapshot);
	}, []);

	if (
		!snapshot ||
		!snapshot.isEligible ||
		!ELIGIBLE_STATES.has(snapshot.state)
	) {
		return null;
	}

	const fallbackHref = snapshot.currentRoute ?? "/contribute";

	const handleResume = async () => {
		if (isResuming) return;
		setIsResuming(true);

		try {
			const resumed = await resumeTour();
			const target = resumed?.currentRoute ?? fallbackHref;
			window.location.href = target;
		} finally {
			setIsResuming(false);
		}
	};

	return (
		<Button
			variant={variant}
			size={size}
			className={className}
			onClick={handleResume}
			disabled={isResuming}
		>
			<Compass className="h-4 w-4 mr-2" />
			Sambung Tour
		</Button>
	);
}

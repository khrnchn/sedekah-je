"use client";

import { type Driver, driver } from "driver.js";
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
	buildStepsForRoute,
	TOUR_ROUTES,
	type TourRoute,
} from "@/lib/onboarding-tour/steps";
import type { TourSnapshot } from "@/lib/onboarding-tour/types";
import "driver.js/dist/driver.css";
import "./onboarding-tour.css";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const ELIGIBLE_PATHS = new Set<string>(TOUR_ROUTES);

async function fetchSnapshot(): Promise<TourSnapshot | null> {
	try {
		const res = await fetch("/api/onboarding-tour");
		if (!res.ok) return null;
		return (await res.json()) as TourSnapshot;
	} catch {
		return null;
	}
}

async function patchTour(
	action: "start" | "advance" | "skip" | "complete" | "resume",
	route?: TourRoute,
	step?: number,
): Promise<TourSnapshot | null> {
	try {
		const res = await fetch("/api/onboarding-tour", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ action, route, step }),
		});
		if (!res.ok) return null;
		return (await res.json()) as TourSnapshot;
	} catch {
		return null;
	}
}

export function UserOnboardingTour() {
	const pathname = usePathname();
	const router = useRouter();
	const [snapshot, setSnapshot] = useState<TourSnapshot | null>(null);
	const [showPrompt, setShowPrompt] = useState(false);
	const [promptHandled, setPromptHandled] = useState(false);
	const driverRef = useRef<Driver | null>(null);
	const hasStartedRef = useRef(false);

	const isEligiblePath = ELIGIBLE_PATHS.has(pathname);
	const pathAsRoute = isEligiblePath ? (pathname as TourRoute) : null;

	const startDriver = useCallback(
		async (route: TourRoute, stepIndex: number) => {
			if (driverRef.current) {
				driverRef.current.destroy();
				driverRef.current = null;
			}

			const steps = buildStepsForRoute(route, stepIndex);
			if (steps.length === 0) return;

			const isLastPage = route === "/leaderboard";

			const driverObj = driver({
				showProgress: true,
				popoverClass: "sedekah-tour",
				stagePadding: 8,
				stageRadius: 8,
				steps,
				nextBtnText: "Seterusnya",
				prevBtnText: "Kembali",
				doneBtnText: "Selesai",
				progressText: "{{current}} daripada {{total}}",
				allowClose: true,
				onCloseClick: async () => {
					await patchTour("skip");
					setSnapshot((s) => (s ? { ...s, state: "skipped" } : null));
					driverObj.destroy();
					driverRef.current = null;
				},
				onNextClick: async (_el, _step, { driver: d }) => {
					const activeIndex = d.getState().activeIndex ?? 0;
					const isLastStepOfPage = activeIndex >= steps.length - 1;
					const currentStepInRoute = stepIndex + activeIndex;

					if (isLastPage && isLastStepOfPage) {
						await patchTour("complete");
						setSnapshot((s) => (s ? { ...s, state: "completed" } : null));
						d.destroy();
						driverRef.current = null;
						return;
					}

					if (isLastStepOfPage) {
						const result = await patchTour(
							"advance",
							route,
							currentStepInRoute,
						);
						d.destroy();
						driverRef.current = null;
						if (result?.currentRoute && result.currentRoute !== pathname) {
							router.push(result.currentRoute);
						}
						return;
					}

					const result = await patchTour(
						"advance",
						route,
						stepIndex + activeIndex,
					);
					if (result) setSnapshot(result);
					d.moveNext();
				},
				onPrevClick: (_el, _step, { driver: d }) => {
					d.movePrevious();
				},
			});

			driverRef.current = driverObj;
			driverObj.drive(0);
		},
		[pathname, router],
	);

	// Reset hasStarted when pathname changes (e.g. after auto-navigate to next page)
	// biome-ignore lint/correctness/useExhaustiveDependencies: pathname triggers reset on route change
	useEffect(() => {
		hasStartedRef.current = false;
	}, [pathname]);

	// Fetch snapshot on mount and when pathname changes
	// biome-ignore lint/correctness/useExhaustiveDependencies: pathname triggers refetch on route change
	useEffect(() => {
		if (!isEligiblePath) return;
		fetchSnapshot().then((s) => {
			if (s) setSnapshot(s);
		});
	}, [pathname, isEligiblePath]);

	// Show prompt for not_started, auto-resume for in_progress on matching route
	useEffect(() => {
		if (!isEligiblePath || !pathAsRoute || !snapshot) return;
		if (!snapshot.isEligible) return;
		if (hasStartedRef.current) return;

		if (snapshot.state === "not_started" && !promptHandled) {
			setShowPrompt(true);
			return;
		}

		if (
			snapshot.state === "in_progress" &&
			snapshot.currentRoute === pathAsRoute
		) {
			hasStartedRef.current = true;
			const step = snapshot.currentStep ?? 0;
			// Short delay for DOM to be ready (Suspense/lazy)
			const t = setTimeout(() => {
				startDriver(pathAsRoute, step);
			}, 500);
			return () => clearTimeout(t);
		}
	}, [snapshot, pathAsRoute, isEligiblePath, promptHandled, startDriver]);

	const handleMulakan = useCallback(async () => {
		if (!pathAsRoute) return;
		setShowPrompt(false);
		setPromptHandled(true);
		const result = await patchTour("start", pathAsRoute, 0);
		if (result) setSnapshot(result);
		hasStartedRef.current = true;
		setTimeout(() => startDriver(pathAsRoute, 0), 100);
	}, [pathAsRoute, startDriver]);

	const handleLepas = useCallback(async () => {
		setShowPrompt(false);
		setPromptHandled(true);
		await patchTour("skip");
		setSnapshot((s) => (s ? { ...s, state: "skipped" } : null));
	}, []);

	return (
		<Dialog open={showPrompt} onOpenChange={setShowPrompt}>
			<DialogContent
				className="sm:max-w-md"
				onPointerDownOutside={(e) => e.preventDefault()}
				onEscapeKeyDown={(e) => e.preventDefault()}
			>
				<DialogHeader>
					<DialogTitle>Mulakan tour?</DialogTitle>
					<DialogDescription>
						Ikuti panduan ringkas untuk mengenali ciri-ciri utama platform
						sedekah.je.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter className="gap-2 sm:gap-0">
					<Button variant="outline" onClick={handleLepas}>
						Lepas dulu
					</Button>
					<Button onClick={handleMulakan}>Mulakan</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

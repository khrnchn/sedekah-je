import type { onboardingTourRoutes, onboardingTourStates } from "@/db/users";

export type TourState = (typeof onboardingTourStates)[number];
export type TourRoute = (typeof onboardingTourRoutes)[number];

export interface TourSnapshot {
	state: TourState;
	currentRoute: TourRoute | null;
	currentStep: number | null;
	isEligible: boolean;
}

export type TourAction = "start" | "advance" | "skip" | "complete" | "resume";

export interface TourActionPayload {
	action: TourAction;
	route?: TourRoute;
	step?: number;
}

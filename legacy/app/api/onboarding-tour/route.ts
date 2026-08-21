import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { onboardingTourRoutes, type onboardingTourStates } from "@/db/users";
import type {
	TourActionPayload,
	TourSnapshot,
} from "@/lib/onboarding-tour/types";

const STEPS_PER_ROUTE: Record<string, number> = {
	"/contribute": 4,
	"/my-contributions": 3,
	"/leaderboard": 3,
};

const ROUTE_ORDER: string[] = [
	"/contribute",
	"/my-contributions",
	"/leaderboard",
];

function getNextRoute(currentRoute: string): string | null {
	const idx = ROUTE_ORDER.indexOf(currentRoute);
	if (idx < 0 || idx >= ROUTE_ORDER.length - 1) return null;
	return ROUTE_ORDER[idx + 1];
}

function clampStep(route: string, step: number): number {
	const max = STEPS_PER_ROUTE[route] ?? 3;
	return Math.max(0, Math.min(step, max - 1));
}

function isValidRoute(
	route: string,
): route is (typeof onboardingTourRoutes)[number] {
	return onboardingTourRoutes.includes(
		route as (typeof onboardingTourRoutes)[number],
	);
}

function buildSnapshot(
	state: (typeof onboardingTourStates)[number],
	currentRoute: string | null,
	currentStep: number | null,
): TourSnapshot {
	const isEligible =
		state !== "completed" &&
		(state === "not_started" || state === "in_progress" || state === "skipped");

	return {
		state,
		currentRoute:
			currentRoute && isValidRoute(currentRoute)
				? (currentRoute as (typeof onboardingTourRoutes)[number])
				: null,
		currentStep,
		isEligible,
	};
}

export async function GET() {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const [user] = await db
			.select({
				onboardingTourState: users.onboardingTourState,
				onboardingTourCurrentRoute: users.onboardingTourCurrentRoute,
				onboardingTourCurrentStep: users.onboardingTourCurrentStep,
			})
			.from(users)
			.where(eq(users.id, session.user.id))
			.limit(1);

		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		const snapshot = buildSnapshot(
			user.onboardingTourState as (typeof onboardingTourStates)[number],
			user.onboardingTourCurrentRoute,
			user.onboardingTourCurrentStep,
		);

		return NextResponse.json(snapshot);
	} catch {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export async function PATCH(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = (await request.json()) as TourActionPayload;
		const { action, route, step } = body;

		if (
			!action ||
			!["start", "advance", "skip", "complete", "resume"].includes(action)
		) {
			return NextResponse.json({ error: "Invalid action" }, { status: 400 });
		}

		const [user] = await db
			.select({
				onboardingTourState: users.onboardingTourState,
				onboardingTourCurrentRoute: users.onboardingTourCurrentRoute,
				onboardingTourCurrentStep: users.onboardingTourCurrentStep,
			})
			.from(users)
			.where(eq(users.id, session.user.id))
			.limit(1);

		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		const now = new Date();
		let newState =
			user.onboardingTourState as (typeof onboardingTourStates)[number];
		let newRoute = user.onboardingTourCurrentRoute;
		let newStep = user.onboardingTourCurrentStep;

		switch (action) {
			case "start":
				if (!route || !isValidRoute(route)) {
					return NextResponse.json(
						{ error: "Invalid route for start" },
						{ status: 400 },
					);
				}
				newState = "in_progress";
				newRoute = route;
				newStep = 0;
				await db
					.update(users)
					.set({
						onboardingTourState: newState,
						onboardingTourCurrentRoute: newRoute,
						onboardingTourCurrentStep: newStep,
						onboardingTourStartedAt: now,
						onboardingTourCompletedAt: null,
						onboardingTourSkippedAt: null,
					})
					.where(eq(users.id, session.user.id));
				break;

			case "advance": {
				if (!route || !isValidRoute(route)) {
					return NextResponse.json(
						{ error: "Invalid route for advance" },
						{ status: 400 },
					);
				}
				const rawStep = step ?? 0;
				const clampedStep = clampStep(route, rawStep);
				const maxStep = (STEPS_PER_ROUTE[route] ?? 3) - 1;

				if (clampedStep >= maxStep) {
					const nextRoute = getNextRoute(route);
					if (nextRoute) {
						newRoute = nextRoute;
						newStep = 0;
					} else {
						newState = "completed";
						newRoute = route;
						newStep = clampedStep;
						await db
							.update(users)
							.set({
								onboardingTourState: newState,
								onboardingTourCurrentRoute: newRoute,
								onboardingTourCurrentStep: newStep,
								onboardingTourCompletedAt: now,
							})
							.where(eq(users.id, session.user.id));
						return NextResponse.json(
							buildSnapshot(newState, newRoute, newStep),
						);
					}
				} else {
					newRoute = route;
					newStep = clampedStep + 1;
				}
				await db
					.update(users)
					.set({
						onboardingTourState: "in_progress",
						onboardingTourCurrentRoute: newRoute,
						onboardingTourCurrentStep: newStep,
					})
					.where(eq(users.id, session.user.id));
				break;
			}

			case "skip":
				newState = "skipped";
				await db
					.update(users)
					.set({
						onboardingTourState: newState,
						onboardingTourSkippedAt: now,
					})
					.where(eq(users.id, session.user.id));
				break;

			case "complete":
				newState = "completed";
				await db
					.update(users)
					.set({
						onboardingTourState: newState,
						onboardingTourCompletedAt: now,
					})
					.where(eq(users.id, session.user.id));
				break;

			case "resume":
				if (
					user.onboardingTourState === "in_progress" &&
					user.onboardingTourCurrentRoute
				) {
					newRoute = user.onboardingTourCurrentRoute;
					newStep = user.onboardingTourCurrentStep ?? 0;
				} else {
					newRoute = "/contribute";
					newStep = 0;
					await db
						.update(users)
						.set({
							onboardingTourState: "in_progress",
							onboardingTourCurrentRoute: newRoute,
							onboardingTourCurrentStep: newStep,
							onboardingTourStartedAt:
								user.onboardingTourState === "not_started" ? now : undefined,
						})
						.where(eq(users.id, session.user.id));
				}
				break;
		}

		const [updated] = await db
			.select({
				onboardingTourState: users.onboardingTourState,
				onboardingTourCurrentRoute: users.onboardingTourCurrentRoute,
				onboardingTourCurrentStep: users.onboardingTourCurrentStep,
			})
			.from(users)
			.where(eq(users.id, session.user.id))
			.limit(1);

		if (!updated) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		return NextResponse.json(
			buildSnapshot(
				updated.onboardingTourState as (typeof onboardingTourStates)[number],
				updated.onboardingTourCurrentRoute,
				updated.onboardingTourCurrentStep,
			),
		);
	} catch {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

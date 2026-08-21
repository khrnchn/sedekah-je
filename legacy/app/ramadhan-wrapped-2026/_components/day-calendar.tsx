"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type FeaturedDay = {
	dayNumber: number;
	institutionName: string;
	institutionSlug: string;
	institutionCategory: string;
	institutionState: string | null;
	caption: string | null;
};

type DayCalendarProps = {
	featuredDays: FeaturedDay[];
	className?: string;
};

const CATEGORY_LABELS: Record<string, string> = {
	masjid: "Masjid",
	surau: "Surau",
	tahfiz: "Tahfiz",
	kebajikan: "Kebajikan",
	"lain-lain": "Lain-lain",
};

const CATEGORY_DOT: Record<string, string> = {
	masjid: "bg-blue-500",
	surau: "bg-emerald-500",
	tahfiz: "bg-yellow-500",
	kebajikan: "bg-orange-500",
	"lain-lain": "bg-purple-500",
};

export function DayCalendar({ featuredDays, className }: DayCalendarProps) {
	const prefersReducedMotion = useReducedMotion();
	const safeFeaturedDays = featuredDays ?? [];

	if (safeFeaturedDays.length === 0) return null;

	return (
		<div className={cn("space-y-0", className)}>
			<div className="columns-1 gap-3 sm:columns-2 lg:columns-3">
				{safeFeaturedDays.map((featured, index) => {
					const categoryLabel =
						CATEGORY_LABELS[featured.institutionCategory] ??
						featured.institutionCategory;
					const dotColor =
						CATEGORY_DOT[featured.institutionCategory] ?? "bg-muted-foreground";

					const card = (
						<Link
							href={`/${featured.institutionCategory}/${featured.institutionSlug}`}
							className="group flex items-start gap-3 rounded-xl border border-border/60 bg-card p-3.5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md sm:p-4 dark:border-border/80 dark:shadow-none"
						>
							<span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold tabular-nums text-primary-foreground sm:size-11">
								{featured.dayNumber}
							</span>
							<div className="flex min-h-11 flex-1 flex-col justify-center">
								<p className="text-sm font-semibold text-foreground group-hover:text-primary sm:text-base">
									{featured.institutionName}
								</p>
								<div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
									{featured.institutionState && (
										<span>{featured.institutionState}</span>
									)}
									{categoryLabel && (
										<span className="inline-flex items-center gap-1">
											<span className={cn("size-1.5 rounded-full", dotColor)} />
											{categoryLabel}
										</span>
									)}
								</div>
							</div>
						</Link>
					);

					if (prefersReducedMotion) {
						return (
							<div key={featured.dayNumber} className="mb-3 break-inside-avoid">
								{card}
							</div>
						);
					}

					return (
						<motion.div
							key={featured.dayNumber}
							className="mb-3 break-inside-avoid"
							initial={{ opacity: 0, y: 12 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{
								duration: 0.35,
								delay: index * 0.02,
								ease: [0.16, 1, 0.3, 1],
							}}
						>
							{card}
						</motion.div>
					);
				})}
			</div>
		</div>
	);
}

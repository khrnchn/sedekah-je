"use client";

import type { LucideIcon } from "lucide-react";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Card, CardContent } from "@/components/ui/card";

interface AnimatedStatCardProps {
	icon?: LucideIcon;
	value: number;
	label: string;
	suffix?: string;
	className?: string;
}

export function AnimatedStatCard({
	icon: Icon,
	value,
	label,
	suffix,
	className,
}: AnimatedStatCardProps) {
	return (
		<Card className={className}>
			<CardContent className="p-3 md:p-4 text-center">
				{Icon && (
					<Icon className="h-6 w-6 md:h-8 md:w-8 text-primary mx-auto mb-2" />
				)}
				<div className="text-xl md:text-2xl font-bold">
					<AnimatedNumber value={value} />
					{suffix}
				</div>
				<p className="text-xs md:text-sm text-muted-foreground">{label}</p>
			</CardContent>
		</Card>
	);
}

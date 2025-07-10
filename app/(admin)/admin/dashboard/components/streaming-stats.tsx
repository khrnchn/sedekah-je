"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Globe, Loader2, TrendingUp, Users, Zap } from "lucide-react";
import { useEffect, useState } from "react";

interface StreamingStatsProps {
	stats: {
		total: number;
		pending: number;
		approved: number;
		rejected: number;
	};
	stateData: Array<{
		state: string;
		count: number;
	}>;
}

interface AnimatedCounterProps {
	finalValue: number;
	delay?: number;
	duration?: number;
}

function AnimatedCounter({
	finalValue,
	delay = 0,
	duration = 1000,
}: AnimatedCounterProps) {
	const [currentValue, setCurrentValue] = useState(0);
	const [isAnimating, setIsAnimating] = useState(true);

	useEffect(() => {
		const timer = setTimeout(() => {
			const startTime = Date.now();
			const startValue = 0;

			const animate = () => {
				const elapsed = Date.now() - startTime;
				const progress = Math.min(elapsed / duration, 1);

				// Easing function for smooth animation
				const easeOut = 1 - (1 - progress) ** 3;
				const value = Math.floor(
					startValue + (finalValue - startValue) * easeOut,
				);

				setCurrentValue(value);

				if (progress < 1) {
					requestAnimationFrame(animate);
				} else {
					setCurrentValue(finalValue);
					setIsAnimating(false);
				}
			};

			animate();
		}, delay);

		return () => clearTimeout(timer);
	}, [finalValue, delay, duration]);

	return (
		<div className="flex items-center gap-2">
			<span className="text-2xl font-bold">{currentValue}</span>
			{isAnimating && (
				<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
			)}
		</div>
	);
}

interface StreamingCardProps {
	title: string;
	value: number;
	icon: React.ComponentType<{ className?: string }>;
	description: string;
	badgeText: string;
	badgeVariant: "default" | "success" | "warning" | "destructive";
	delay: number;
}

function StreamingCard({
	title,
	value,
	icon: Icon,
	description,
	badgeText,
	badgeVariant,
	delay,
}: StreamingCardProps) {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => {
			setIsVisible(true);
		}, delay);

		return () => clearTimeout(timer);
	}, [delay]);

	return (
		<Card
			className={`transition-all duration-500 ${
				isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
			}`}
		>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="text-sm font-medium">{title}</CardTitle>
				<Icon className="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				{isVisible ? (
					<AnimatedCounter finalValue={value} delay={200} duration={800} />
				) : (
					<div className="h-8 bg-muted rounded animate-pulse" />
				)}
				<p className="text-xs text-muted-foreground mt-1">{description}</p>
				<div className="mt-2">
					{isVisible ? (
						<Badge
							variant={badgeVariant}
							className="text-xs transition-all duration-300 animate-in fade-in-50"
						>
							<Zap className="h-3 w-3 mr-1" />
							{badgeText}
						</Badge>
					) : (
						<div className="h-5 w-16 bg-muted rounded animate-pulse" />
					)}
				</div>
			</CardContent>
		</Card>
	);
}

// Enhanced streaming component with progressive loading and animations
function StreamingStatsComponent({ stats, stateData }: StreamingStatsProps) {
	const [isStreaming, setIsStreaming] = useState(true);

	const activeStat = stateData.filter((s) => s.count > 0).length;
	const topState = stateData[0];
	const approvalRate =
		stats.total > 0
			? Number(((stats.approved / stats.total) * 100).toFixed(1))
			: 0;

	// Stop streaming animation after all cards are loaded
	useEffect(() => {
		const timer = setTimeout(() => {
			setIsStreaming(false);
		}, 2500); // All cards + animations complete

		return () => clearTimeout(timer);
	}, []);

	const cards = [
		{
			title: "Active States",
			value: activeStat,
			icon: Globe,
			description: "States with institutions",
			badgeText: topState ? `${topState.state} leads` : "No data",
			badgeVariant: "success" as const,
			delay: 0,
		},
		{
			title: "Approval Rate",
			value: approvalRate,
			icon: TrendingUp,
			description: "Institutions approved (%)",
			badgeText: approvalRate > 70 ? "Excellent" : "Good",
			badgeVariant:
				approvalRate > 70 ? ("success" as const) : ("warning" as const),
			delay: 300,
		},
		{
			title: "Top State",
			value: topState?.count || 0,
			icon: Users,
			description: topState?.state || "No data",
			badgeText: "Leading",
			badgeVariant: "default" as const,
			delay: 600,
		},
		{
			title: "Platform Health",
			value: 98,
			icon: Activity,
			description: "System operational (%)",
			badgeText: "Healthy",
			badgeVariant: "success" as const,
			delay: 900,
		},
	];

	return (
		<div className="space-y-4">
			{/* Streaming Header */}
			<div className="flex items-center justify-between">
				<h3 className="text-lg font-semibold">Live Streaming Stats</h3>
				<Badge
					variant={isStreaming ? "default" : "success"}
					className="text-xs transition-all duration-300"
				>
					{isStreaming ? (
						<>
							<Loader2 className="h-3 w-3 mr-1 animate-spin" />
							Streaming...
						</>
					) : (
						<>
							<Zap className="h-3 w-3 mr-1" />
							Complete
						</>
					)}
				</Badge>
			</div>

			{/* Streaming Cards */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{cards.map((card, index) => (
					<StreamingCard key={card.title} {...card} />
				))}
			</div>

			{/* Progress Indicator */}
			{isStreaming && (
				<div className="w-full bg-muted rounded-full h-1 overflow-hidden">
					<div
						className="h-full bg-primary transition-all duration-2500 ease-out"
						style={{
							width: "100%",
							animation: "progress 2.5s ease-out forwards",
						}}
					/>
				</div>
			)}

			<style jsx>{`
				@keyframes progress {
					from {
						width: 0%;
					}
					to {
						width: 100%;
					}
				}
			`}</style>
		</div>
	);
}

export { StreamingStatsComponent };

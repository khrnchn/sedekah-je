"use client";

import { useEffect, useState } from "react";

// Touch feedback component for better mobile interactions
interface TouchFeedbackProps {
	children: React.ReactNode;
	className?: string;
	onTap?: () => void;
	hapticFeedback?: boolean;
}

export function TouchFeedback({
	children,
	className = "",
	onTap,
	hapticFeedback = true,
}: TouchFeedbackProps) {
	const [isPressed, setIsPressed] = useState(false);

	const handleTouchStart = () => {
		setIsPressed(true);
		if (hapticFeedback && navigator.vibrate) {
			navigator.vibrate(10); // Light haptic feedback
		}
	};

	const handleTouchEnd = () => {
		setIsPressed(false);
		if (onTap) onTap();
	};

	return (
		<div
			className={`transition-transform duration-75 ${
				isPressed ? "scale-95" : "scale-100"
			} ${className}`}
			onTouchStart={handleTouchStart}
			onTouchEnd={handleTouchEnd}
			onMouseDown={handleTouchStart}
			onMouseUp={handleTouchEnd}
			onMouseLeave={() => setIsPressed(false)}
		>
			{children}
		</div>
	);
}

// Pull-to-refresh component for mobile
interface PullToRefreshProps {
	onRefresh: () => Promise<void>;
	children: React.ReactNode;
	threshold?: number;
}

export function PullToRefresh({
	onRefresh,
	children,
	threshold = 80,
}: PullToRefreshProps) {
	const [pullDistance, setPullDistance] = useState(0);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [startY, setStartY] = useState(0);

	useEffect(() => {
		let touchStartY = 0;

		const handleTouchStart = (e: TouchEvent) => {
			if (window.scrollY === 0) {
				touchStartY = e.touches[0].clientY;
				setStartY(touchStartY);
			}
		};

		const handleTouchMove = (e: TouchEvent) => {
			if (window.scrollY === 0 && touchStartY > 0) {
				const currentY = e.touches[0].clientY;
				const distance = currentY - touchStartY;

				if (distance > 0) {
					setPullDistance(Math.min(distance, threshold * 1.5));
					if (distance > 10) {
						e.preventDefault(); // Prevent default scroll
					}
				}
			}
		};

		const handleTouchEnd = async () => {
			if (pullDistance > threshold && !isRefreshing) {
				setIsRefreshing(true);
				try {
					await onRefresh();
				} finally {
					setIsRefreshing(false);
				}
			}
			setPullDistance(0);
			setStartY(0);
		};

		document.addEventListener("touchstart", handleTouchStart);
		document.addEventListener("touchmove", handleTouchMove, { passive: false });
		document.addEventListener("touchend", handleTouchEnd);

		return () => {
			document.removeEventListener("touchstart", handleTouchStart);
			document.removeEventListener("touchmove", handleTouchMove);
			document.removeEventListener("touchend", handleTouchEnd);
		};
	}, [pullDistance, threshold, onRefresh, isRefreshing]);

	return (
		<div className="relative">
			{pullDistance > 0 && (
				<div
					className="absolute top-0 left-0 right-0 flex items-center justify-center bg-primary/10 transition-all duration-300"
					style={{
						height: `${Math.min(pullDistance, threshold)}px`,
						transform: `translateY(-${Math.min(pullDistance, threshold)}px)`,
					}}
				>
					<div
						className={`transition-transform ${pullDistance > threshold ? "rotate-180" : ""}`}
					>
						{isRefreshing ? (
							<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
						) : (
							<span className="text-primary">↓ Pull to refresh</span>
						)}
					</div>
				</div>
			)}
			<div
				style={{
					transform: `translateY(${Math.min(pullDistance, threshold)}px)`,
					transition: pullDistance === 0 ? "transform 0.3s ease" : "none",
				}}
			>
				{children}
			</div>
		</div>
	);
}

// Swipe gesture handler
interface SwipeGestureProps {
	onSwipeLeft?: () => void;
	onSwipeRight?: () => void;
	onSwipeUp?: () => void;
	onSwipeDown?: () => void;
	children: React.ReactNode;
	threshold?: number;
}

export function SwipeGesture({
	onSwipeLeft,
	onSwipeRight,
	onSwipeUp,
	onSwipeDown,
	children,
	threshold = 50,
}: SwipeGestureProps) {
	const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });

	const handleTouchStart = (e: React.TouchEvent) => {
		setTouchStart({
			x: e.touches[0].clientX,
			y: e.touches[0].clientY,
		});
	};

	const handleTouchEnd = (e: React.TouchEvent) => {
		if (!touchStart.x || !touchStart.y) return;

		const touchEnd = {
			x: e.changedTouches[0].clientX,
			y: e.changedTouches[0].clientY,
		};

		const diffX = touchStart.x - touchEnd.x;
		const diffY = touchStart.y - touchEnd.y;

		const absDiffX = Math.abs(diffX);
		const absDiffY = Math.abs(diffY);

		// Determine swipe direction
		if (Math.max(absDiffX, absDiffY) > threshold) {
			if (absDiffX > absDiffY) {
				// Horizontal swipe
				if (diffX > 0 && onSwipeLeft) {
					onSwipeLeft();
				} else if (diffX < 0 && onSwipeRight) {
					onSwipeRight();
				}
			} else {
				// Vertical swipe
				if (diffY > 0 && onSwipeUp) {
					onSwipeUp();
				} else if (diffY < 0 && onSwipeDown) {
					onSwipeDown();
				}
			}
		}

		setTouchStart({ x: 0, y: 0 });
	};

	return (
		<div
			onTouchStart={handleTouchStart}
			onTouchEnd={handleTouchEnd}
			className="touch-pan-y"
		>
			{children}
		</div>
	);
}

// PWA install prompt
export function PWAInstallPrompt() {
	const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
	const [showPrompt, setShowPrompt] = useState(false);

	useEffect(() => {
		const handler = (e: Event) => {
			e.preventDefault();
			setInstallPrompt(e);
			setShowPrompt(true);
		};

		window.addEventListener("beforeinstallprompt", handler);

		return () => window.removeEventListener("beforeinstallprompt", handler);
	}, []);

	const handleInstall = async () => {
		if (!installPrompt) return;

		const result = await installPrompt.prompt();
		console.log("Install prompt result:", result);
		setInstallPrompt(null);
		setShowPrompt(false);
	};

	if (!showPrompt) return null;

	return (
		<div className="fixed bottom-4 left-4 right-4 bg-primary text-primary-foreground p-4 rounded-lg shadow-lg z-50 md:max-w-sm md:left-auto md:right-4">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="font-semibold">Install SedekahJe</h3>
					<p className="text-sm opacity-90">
						Add to home screen for better experience
					</p>
				</div>
				<div className="flex gap-2">
					<button
						type="button"
						onClick={() => setShowPrompt(false)}
						className="px-3 py-1 text-sm rounded bg-primary-foreground/20"
					>
						Later
					</button>
					<button
						type="button"
						onClick={handleInstall}
						className="px-3 py-1 text-sm rounded bg-primary-foreground text-primary font-medium"
					>
						Install
					</button>
				</div>
			</div>
		</div>
	);
}

"use client";

import { useEffect, useState } from "react";

function formatRemaining(ms: number): string {
	if (ms <= 0) return "";
	const totalSeconds = Math.ceil(ms / 1000);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);

	if (hours > 0) {
		return `${hours} jam ${minutes} minit`;
	}
	if (minutes > 0) {
		return `${minutes} minit`;
	}
	return "kurang dari 1 minit";
}

export function CooldownTimer({
	cooldownEndsAt,
	onCooldownEnd,
}: {
	cooldownEndsAt: string;
	onCooldownEnd?: () => void;
}) {
	const [remaining, setRemaining] = useState<number>(() => {
		const end = new Date(cooldownEndsAt).getTime();
		return Math.max(0, end - Date.now());
	});

	useEffect(() => {
		const end = new Date(cooldownEndsAt).getTime();

		const update = () => {
			const ms = Math.max(0, end - Date.now());
			setRemaining(ms);
			if (ms <= 0) {
				onCooldownEnd?.();
			}
		};

		update();
		const interval = setInterval(update, 1000);
		return () => clearInterval(interval);
	}, [cooldownEndsAt, onCooldownEnd]);

	if (remaining <= 0) {
		return (
			<div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md text-center">
				<p className="text-sm font-medium text-green-800">
					Anda boleh cuba hantar semula.
				</p>
			</div>
		);
	}

	return (
		<div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-center">
			<p className="text-sm font-medium text-amber-800">
				Anda telah mencapai had 3 sumbangan sehari. Anda boleh menyumbang semula
				dalam <strong>{formatRemaining(remaining)}</strong>.
			</p>
		</div>
	);
}

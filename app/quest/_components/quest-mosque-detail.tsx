"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, QrCode, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { QuestMosqueWithStatus } from "@/app/quest/_lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import QrCodeDisplay from "@/components/ui/qrCodeDisplay";
import QuestContributeForm from "./quest-contribute-form";

type QuestMosqueDetailProps = {
	mosque: QuestMosqueWithStatus | null;
	onClose: () => void;
	variant?: "floating" | "sheet";
};

export default function QuestMosqueDetail({
	mosque,
	onClose,
	variant = "floating",
}: QuestMosqueDetailProps) {
	const [contributeOpen, setContributeOpen] = useState(false);

	if (variant === "sheet") {
		if (!mosque) return null;
		return (
			<div className="space-y-3">
				<div className="rounded-lg border border-zinc-800 bg-zinc-950/95 p-4 shadow-xl backdrop-blur-sm">
					<div className="flex items-start justify-between gap-2">
						<div className="min-w-0 flex-1">
							<h3 className="font-semibold text-zinc-100">{mosque.name}</h3>
							{mosque.address && (
								<p className="mt-1 text-xs text-zinc-400">{mosque.address}</p>
							)}
						</div>
						<button
							type="button"
							onClick={onClose}
							className="shrink-0 rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
						>
							<X className="h-4 w-4" />
						</button>
					</div>
					<div className="mt-3 flex items-center gap-2">
						{mosque.isUnlocked ? (
							<>
								<Badge className="bg-green-500/10 text-green-400 hover:bg-green-500/20">
									Tersedia
								</Badge>
								{mosque.institutionCategory && mosque.institutionSlug && (
									<Link
										href={`/${mosque.institutionCategory}/${mosque.institutionSlug}`}
										target="_blank"
										rel="noreferrer"
										className="inline-flex items-center gap-1 text-sm font-medium text-green-400 underline-offset-4 hover:underline"
									>
										<span className="sr-only">Buka halaman institusi</span>
										<ExternalLink className="h-4 w-4" />
									</Link>
								)}
							</>
						) : (
							<>
								<Badge
									variant="outline"
									className="border-zinc-700 text-zinc-400"
								>
									Belum tersedia
								</Badge>
								<Button
									variant="outline"
									size="sm"
									className="h-7 gap-1 border-zinc-700 text-xs text-zinc-300 hover:bg-zinc-800"
									onClick={() => setContributeOpen(true)}
								>
									<QrCode className="h-3 w-3" />
									Sumbang QR
								</Button>
							</>
						)}
					</div>
					{mosque.isUnlocked && mosque.qrContent && (
						<div className="mt-4 flex">
							<QrCodeDisplay
								qrContent={mosque.qrContent}
								supportedPayment={mosque.supportedPayment ?? undefined}
								size={120}
							/>
						</div>
					)}
				</div>
				{!mosque.isUnlocked && (
					<QuestContributeForm
						mosque={mosque}
						open={contributeOpen}
						onOpenChange={setContributeOpen}
					/>
				)}
			</div>
		);
	}

	return (
		<AnimatePresence>
			{mosque && (
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: 20 }}
					transition={{ duration: 0.2 }}
					className="absolute bottom-4 left-4 right-4 z-20 md:left-auto md:right-4 md:w-80"
				>
					<div className="rounded-lg border border-zinc-800 bg-zinc-950/95 p-4 shadow-xl backdrop-blur-sm">
						<div className="flex items-start justify-between gap-2">
							<div className="min-w-0 flex-1">
								<h3 className="font-semibold text-zinc-100">{mosque.name}</h3>
								{mosque.address && (
									<p className="mt-1 text-xs text-zinc-400">{mosque.address}</p>
								)}
							</div>
							<button
								type="button"
								onClick={onClose}
								className="shrink-0 rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
							>
								<X className="h-4 w-4" />
							</button>
						</div>
						<div className="mt-3 flex items-center gap-2">
							{mosque.isUnlocked ? (
								<>
									<Badge className="bg-green-500/10 text-green-400 hover:bg-green-500/20">
										Tersedia
									</Badge>
									{mosque.institutionCategory && mosque.institutionSlug && (
										<Link
											href={`/${mosque.institutionCategory}/${mosque.institutionSlug}`}
											target="_blank"
											rel="noreferrer"
											className="inline-flex items-center gap-1 text-sm font-medium text-green-400 underline-offset-4 hover:underline"
										>
											<span className="sr-only">Buka halaman institusi</span>
											<ExternalLink className="h-4 w-4" />
										</Link>
									)}
								</>
							) : (
								<>
									<Badge
										variant="outline"
										className="border-zinc-700 text-zinc-400"
									>
										Belum tersedia
									</Badge>
									<Button
										variant="outline"
										size="sm"
										className="h-7 gap-1 border-zinc-700 text-xs text-zinc-300 hover:bg-zinc-800"
										onClick={() => setContributeOpen(true)}
									>
										<QrCode className="h-3 w-3" />
										Sumbang QR
									</Button>
								</>
							)}
						</div>
						{mosque.isUnlocked && mosque.qrContent && (
							<div className="mt-4 flex">
								<QrCodeDisplay
									qrContent={mosque.qrContent}
									supportedPayment={mosque.supportedPayment ?? undefined}
									size={120}
								/>
							</div>
						)}
					</div>
					{!mosque.isUnlocked && (
						<QuestContributeForm
							mosque={mosque}
							open={contributeOpen}
							onOpenChange={setContributeOpen}
						/>
					)}
				</motion.div>
			)}
		</AnimatePresence>
	);
}

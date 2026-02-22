"use client";

import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { useMemo, useState } from "react";
import type { QuestLeaderboardEntry } from "@/app/quest/_lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

type QuestLeaderboardProps = {
	leaderboard: QuestLeaderboardEntry[];
};

function getInitial(name: string | null, userId: string) {
	if (name && name.trim().length > 0) {
		return name.trim().charAt(0).toUpperCase();
	}
	return userId.charAt(0).toUpperCase();
}

function rankBadgeClass(rank: number) {
	if (rank === 1) return "border-amber-400/40 bg-amber-500/15 text-amber-300";
	if (rank === 2) return "border-zinc-400/40 bg-zinc-500/15 text-zinc-200";
	if (rank === 3)
		return "border-orange-400/40 bg-orange-500/15 text-orange-300";
	return "border-zinc-700 bg-zinc-900 text-zinc-400";
}

function LeaderboardRow({
	entry,
	index,
	highlighted = false,
}: {
	entry: QuestLeaderboardEntry;
	index: number;
	highlighted?: boolean;
}) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 6 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.18) }}
			className={cn(
				"flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
				highlighted
					? "border border-zinc-700/80 bg-zinc-900/90"
					: "border border-transparent hover:bg-zinc-900/65",
			)}
		>
			<Badge
				variant="outline"
				className={cn(
					"min-w-9 justify-center px-2 py-0.5 text-[11px] font-semibold",
					rankBadgeClass(entry.rank),
				)}
			>
				#{entry.rank}
			</Badge>
			<Avatar className={cn("h-8 w-8", highlighted && "h-9 w-9")}>
				<AvatarImage
					src={entry.image ?? undefined}
					alt={entry.name ?? "Pengguna"}
				/>
				<AvatarFallback className="bg-zinc-800 text-xs text-zinc-200">
					{getInitial(entry.name, entry.userId)}
				</AvatarFallback>
			</Avatar>
			<div className="min-w-0 flex-1">
				<p
					className={cn(
						"truncate text-sm text-zinc-100",
						highlighted && "font-medium",
					)}
				>
					{entry.name ?? "Tanpa nama"}
				</p>
			</div>
			<Badge
				variant="outline"
				className="border-zinc-700 bg-zinc-950 text-xs text-zinc-300"
			>
				{entry.count} masjid
			</Badge>
		</motion.div>
	);
}

function LeaderboardContent({
	leaderboard,
	currentUserId,
}: {
	leaderboard: QuestLeaderboardEntry[];
	currentUserId?: string;
}) {
	const topThree = useMemo(() => leaderboard.slice(0, 3), [leaderboard]);
	const others = useMemo(() => leaderboard.slice(3), [leaderboard]);
	const currentUserEntry = useMemo(
		() =>
			currentUserId
				? (leaderboard.find((entry) => entry.userId === currentUserId) ?? null)
				: null,
		[leaderboard, currentUserId],
	);

	return (
		<div className="space-y-4 px-4 pb-5">
			{leaderboard.length === 0 ? (
				<div className="rounded-lg border border-dashed border-zinc-800 bg-zinc-900/40 px-4 py-6 text-center">
					<p className="text-sm text-zinc-300">Belum ada sumbangan</p>
					<p className="mt-1 text-xs text-zinc-500">
						Jadi penyumbang pertama untuk quest ini.
					</p>
				</div>
			) : (
				<>
					{currentUserEntry && (
						<div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2">
							<p className="text-[11px] uppercase tracking-wide text-emerald-300/80">
								Kedudukan Anda
							</p>
							<p className="mt-0.5 text-sm font-medium text-emerald-200">
								#{currentUserEntry.rank} · {currentUserEntry.count} masjid
							</p>
						</div>
					)}
					<div className="sticky top-0 z-10 -mx-4 border-b border-zinc-800/70 bg-zinc-950/95 px-4 pb-2 pt-1 backdrop-blur">
						<div className="space-y-2">
							{topThree.map((entry, index) => (
								<LeaderboardRow
									key={entry.userId}
									entry={entry}
									index={index}
									highlighted
								/>
							))}
						</div>
					</div>
					{others.length > 0 && (
						<div className="space-y-1">
							{others.map((entry, index) => (
								<LeaderboardRow
									key={entry.userId}
									entry={entry}
									index={index + topThree.length}
								/>
							))}
						</div>
					)}
				</>
			)}
		</div>
	);
}

export default function QuestLeaderboard({
	leaderboard,
}: QuestLeaderboardProps) {
	const { user } = useAuth();
	const isMobile = useIsMobile();
	const [open, setOpen] = useState(false);
	const entriesCount = leaderboard.length;

	const trigger = (
		<Button
			type="button"
			variant="outline"
			size="sm"
			aria-label="Lihat leaderboard"
			onClick={() => setOpen(true)}
			className="gap-1.5 border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
		>
			<Trophy className="h-4 w-4" />
			<span className="hidden sm:inline">Leaderboard</span>
			{entriesCount > 0 && (
				<span className="hidden text-xs text-zinc-400 lg:inline">
					Top {entriesCount}
				</span>
			)}
		</Button>
	);

	if (isMobile) {
		return (
			<>
				{trigger}
				<Drawer open={open} onOpenChange={setOpen}>
					<DrawerContent className="border-zinc-800 bg-zinc-950">
						<DrawerHeader>
							<DrawerTitle className="flex items-center gap-2 text-zinc-100">
								<Trophy className="h-4 w-4 text-amber-400" />
								Leaderboard
							</DrawerTitle>
						</DrawerHeader>
						<ScrollArea className="max-h-[70dvh]">
							<LeaderboardContent
								leaderboard={leaderboard}
								currentUserId={user?.id}
							/>
						</ScrollArea>
					</DrawerContent>
				</Drawer>
			</>
		);
	}

	return (
		<>
			{trigger}
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="border-zinc-800 bg-zinc-950 sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-zinc-100">
							<Trophy className="h-4 w-4 text-amber-400" />
							Leaderboard
						</DialogTitle>
					</DialogHeader>
					<ScrollArea className="max-h-[70dvh]">
						<LeaderboardContent
							leaderboard={leaderboard}
							currentUserId={user?.id}
						/>
					</ScrollArea>
				</DialogContent>
			</Dialog>
		</>
	);
}

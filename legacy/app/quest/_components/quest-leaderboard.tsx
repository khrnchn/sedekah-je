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
	if (rank === 1)
		return "border-amber-400/40 bg-amber-500/15 text-amber-500 dark:text-amber-300";
	if (rank === 2)
		return "border-zinc-400/40 bg-zinc-500/15 text-zinc-600 dark:text-zinc-200";
	if (rank === 3)
		return "border-orange-400/40 bg-orange-500/15 text-orange-500 dark:text-orange-300";
	return "border-border bg-muted text-muted-foreground";
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
					? "border border-border bg-muted/90"
					: "border border-transparent hover:bg-muted/65",
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
				<AvatarFallback className="bg-muted text-xs text-foreground">
					{getInitial(entry.name, entry.userId)}
				</AvatarFallback>
			</Avatar>
			<div className="min-w-0 flex-1">
				<p
					className={cn(
						"truncate text-sm text-foreground",
						highlighted && "font-medium",
					)}
				>
					{entry.name ?? "Tanpa nama"}
				</p>
			</div>
			<Badge
				variant="outline"
				className="border-border bg-background text-xs text-foreground/80"
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
				<div className="rounded-lg border border-dashed border-border bg-muted/40 px-4 py-6 text-center">
					<p className="text-sm text-foreground/80">Belum ada sumbangan</p>
					<p className="mt-1 text-xs text-muted-foreground">
						Jadi penyumbang pertama untuk quest ini.
					</p>
				</div>
			) : (
				<>
					{currentUserEntry && (
						<div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2">
							<p className="text-[11px] uppercase tracking-wide text-emerald-600/80 dark:text-emerald-300/80">
								Kedudukan Anda
							</p>
							<p className="mt-0.5 text-sm font-medium text-emerald-700 dark:text-emerald-200">
								#{currentUserEntry.rank} · {currentUserEntry.count} masjid
							</p>
						</div>
					)}
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
					{others.length > 0 && (
						<div className="space-y-1 border-t border-border pt-3">
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
			className="gap-1.5 border-border bg-muted text-foreground/80 hover:bg-accent hover:text-foreground"
		>
			<Trophy className="h-4 w-4" />
			<span className="hidden sm:inline">Leaderboard</span>
			{entriesCount > 0 && (
				<span className="hidden text-xs text-muted-foreground lg:inline">
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
					<DrawerContent className="border-border bg-background">
						<DrawerHeader>
							<DrawerTitle className="flex items-center gap-2 text-foreground">
								<Trophy className="h-4 w-4 text-amber-500 dark:text-amber-400" />
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
				<DialogContent className="border-border bg-card sm:max-w-md [&>button]:text-muted-foreground [&>button]:hover:text-foreground">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-foreground">
							<Trophy className="h-4 w-4 text-amber-500 dark:text-amber-400" />
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

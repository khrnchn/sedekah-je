"use client";

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
import { useIsMobile } from "@/hooks/use-mobile";

type QuestLeaderboardProps = {
	leaderboard: QuestLeaderboardEntry[];
};

function getInitial(name: string | null, userId: string) {
	if (name && name.trim().length > 0) {
		return name.trim().charAt(0).toUpperCase();
	}
	return userId.charAt(0).toUpperCase();
}

function LeaderboardContent({
	leaderboard,
}: {
	leaderboard: QuestLeaderboardEntry[];
}) {
	const topThree = useMemo(() => leaderboard.slice(0, 3), [leaderboard]);
	const others = useMemo(() => leaderboard.slice(3), [leaderboard]);
	const medals = ["🥇", "🥈", "🥉"];

	return (
		<div className="space-y-4 px-4 pb-4">
			{leaderboard.length === 0 ? (
				<p className="py-6 text-center text-sm text-zinc-400">
					Belum ada sumbangan
				</p>
			) : (
				<>
					<div className="space-y-2">
						{topThree.map((entry, index) => (
							<div
								key={entry.userId}
								className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3"
							>
								<div className="w-8 text-center text-lg">{medals[index]}</div>
								<Avatar className="h-10 w-10">
									<AvatarImage
										src={entry.image ?? undefined}
										alt={entry.name ?? "Pengguna"}
									/>
									<AvatarFallback className="bg-zinc-800 text-zinc-200">
										{getInitial(entry.name, entry.userId)}
									</AvatarFallback>
								</Avatar>
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-semibold text-zinc-100">
										{entry.name ?? "Tanpa nama"}
									</p>
								</div>
								<Badge
									variant="outline"
									className="border-zinc-700 bg-zinc-900 text-zinc-200"
								>
									{entry.count} masjid
								</Badge>
							</div>
						))}
					</div>
					{others.length > 0 && (
						<div className="space-y-1">
							{others.map((entry) => (
								<div
									key={entry.userId}
									className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-zinc-900/70"
								>
									<div className="w-6 text-xs font-medium text-zinc-400">
										#{entry.rank}
									</div>
									<Avatar className="h-8 w-8">
										<AvatarImage
											src={entry.image ?? undefined}
											alt={entry.name ?? "Pengguna"}
										/>
										<AvatarFallback className="bg-zinc-800 text-xs text-zinc-200">
											{getInitial(entry.name, entry.userId)}
										</AvatarFallback>
									</Avatar>
									<p className="min-w-0 flex-1 truncate text-sm text-zinc-200">
										{entry.name ?? "Tanpa nama"}
									</p>
									<Badge
										variant="outline"
										className="border-zinc-700 bg-zinc-900 text-xs text-zinc-300"
									>
										{entry.count} masjid
									</Badge>
								</div>
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
	const isMobile = useIsMobile();
	const [open, setOpen] = useState(false);

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
							<LeaderboardContent leaderboard={leaderboard} />
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
					<ScrollArea className="max-h-[65dvh]">
						<LeaderboardContent leaderboard={leaderboard} />
					</ScrollArea>
				</DialogContent>
			</Dialog>
		</>
	);
}

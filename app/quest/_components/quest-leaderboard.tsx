"use client";

import { useState } from "react";
import type { QuestLeaderboardEntry } from "@/app/quest/_lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

type QuestLeaderboardProps = {
	leaderboard: QuestLeaderboardEntry[];
};

export default function QuestLeaderboard({
	leaderboard,
}: QuestLeaderboardProps) {
	const { user } = useAuth();
	const [open, setOpen] = useState(false);
	const currentUserEntry = user?.id
		? (leaderboard.find((entry) => entry.userId === user.id) ?? null)
		: null;

	return (
		<>
			<Button
				type="button"
				variant="outline"
				size="sm"
				className="h-11 shrink-0 px-3"
				onClick={() => setOpen(true)}
			>
				Leaderboard
			</Button>
			<Sheet open={open} onOpenChange={setOpen}>
				<SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-sm">
					<SheetHeader className="border-b border-border px-5 py-4 text-left">
						<SheetTitle>Leaderboard</SheetTitle>
						<SheetDescription>
							Most QR codes added through the quest.
						</SheetDescription>
					</SheetHeader>
					<div className="flex-1 overflow-y-auto px-5 py-4">
						{leaderboard.length === 0 ? (
							<p className="py-6 text-center text-sm text-muted-foreground">
								No contributions yet. Be the first.
							</p>
						) : (
							<>
								{currentUserEntry && (
									<p className="mb-3 rounded-lg border border-border bg-muted px-3 py-2 text-sm">
										Your rank{" "}
										<span className="font-semibold tabular-nums">
											#{currentUserEntry.rank}
										</span>
									</p>
								)}
								<ol className="divide-y divide-border">
									{leaderboard.map((entry) => (
										<li
											key={entry.userId}
											className={cn(
												"flex items-center gap-3 py-2.5",
												entry.userId === user?.id && "font-medium",
											)}
										>
											<span className="w-6 text-right text-sm tabular-nums text-muted-foreground">
												{entry.rank}
											</span>
											<Avatar className="h-7 w-7">
												<AvatarImage
													src={entry.image ?? undefined}
													alt={entry.name ?? "User"}
												/>
												<AvatarFallback className="bg-muted text-xs">
													{(entry.name?.trim() || entry.userId)
														.charAt(0)
														.toUpperCase()}
												</AvatarFallback>
											</Avatar>
											<span className="min-w-0 flex-1 truncate text-sm text-foreground">
												{entry.name ?? "Anonymous"}
											</span>
											<span className="text-sm tabular-nums text-muted-foreground">
												{entry.count}
											</span>
										</li>
									))}
								</ol>
							</>
						)}
					</div>
				</SheetContent>
			</Sheet>
		</>
	);
}

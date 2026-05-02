import { Award, Medal, Trophy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { getTopContributors } from "../_lib/queries";

function getRankIcon(rank: number) {
	switch (rank) {
		case 1:
			return <Trophy className="h-6 w-6 text-primary" />;
		case 2:
			return <Medal className="h-6 w-6 text-muted-foreground" />;
		case 3:
			return <Award className="h-6 w-6 text-accent-foreground" />;
		default:
			return (
				<span className="text-sm font-bold text-muted-foreground">#{rank}</span>
			);
	}
}

export async function AsyncTopContributors() {
	const topContributors = await getTopContributors();

	if (topContributors.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Belum Ada Penghantar QR</CardTitle>
					<CardDescription>
						Jadilah yang pertama hantar QR institusi dan muncul di papan
						pendahulu!
					</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	return (
		<div className="space-y-8" data-tour="leaderboard-top20">
			<div className="flex items-end justify-center gap-2 md:gap-4">
				{/* Second Place */}
				{topContributors[1] && (
					<div className="flex flex-col items-center w-1/3">
						<Avatar className="w-12 h-12 md:w-20 md:h-20 border-2 border-border">
							<AvatarImage src={topContributors[1].avatar ?? undefined} />
							<AvatarFallback>
								{topContributors[1].name.charAt(0)}
							</AvatarFallback>
						</Avatar>
						<div className="text-center mt-2">
							<div className="font-semibold text-sm md:text-base truncate max-w-[120px] md:max-w-none">
								{topContributors[1].name}
							</div>
							<div className="text-xs md:text-sm text-muted-foreground">
								{topContributors[1].contributions} submission
							</div>
						</div>
						<div className="mt-2 flex h-16 w-full items-center justify-center rounded-t-lg border bg-muted/50 md:h-24">
							<span className="text-2xl font-bold text-muted-foreground md:text-4xl">
								2
							</span>
						</div>
					</div>
				)}

				{/* First Place */}
				{topContributors[0] && (
					<div className="flex flex-col items-center w-1/3">
						<Avatar className="w-16 h-16 md:w-24 md:h-24 border-2 border-primary">
							<AvatarImage src={topContributors[0].avatar ?? undefined} />
							<AvatarFallback>
								{topContributors[0].name.charAt(0)}
							</AvatarFallback>
						</Avatar>
						<div className="text-center mt-2">
							<div className="font-semibold text-base md:text-lg truncate max-w-[120px] md:max-w-none">
								{topContributors[0].name}
							</div>
							<div className="text-xs md:text-sm text-muted-foreground">
								{topContributors[0].contributions} submission
							</div>
						</div>
						<div className="mt-2 flex h-20 w-full items-center justify-center rounded-t-lg border border-primary/30 bg-primary/10 md:h-32">
							<span className="text-3xl font-bold text-primary md:text-5xl">
								1
							</span>
						</div>
					</div>
				)}

				{/* Third Place */}
				{topContributors[2] && (
					<div className="flex flex-col items-center w-1/3">
						<Avatar className="w-12 h-12 md:w-20 md:h-20 border-2 border-accent">
							<AvatarImage src={topContributors[2].avatar ?? undefined} />
							<AvatarFallback>
								{topContributors[2].name.charAt(0)}
							</AvatarFallback>
						</Avatar>
						<div className="text-center mt-2">
							<div className="font-semibold text-sm md:text-base truncate max-w-[120px] md:max-w-none">
								{topContributors[2].name}
							</div>
							<div className="text-xs md:text-sm text-muted-foreground">
								{topContributors[2].contributions} submission
							</div>
						</div>
						<div className="mt-2 flex h-12 w-full items-center justify-center rounded-t-lg border bg-accent/60 md:h-20">
							<span className="text-xl font-bold text-accent-foreground md:text-3xl">
								3
							</span>
						</div>
					</div>
				)}
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Top 20 Penghantar QR</CardTitle>
					<CardDescription>
						20 pengguna paling aktif menghantar QR institusi dalam komuniti
						sedekah.je
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{topContributors.map((contributor) => (
							<div
								key={contributor.rank}
								className="flex items-center gap-2 md:gap-4 p-2 md:p-3 rounded-lg bg-background hover:bg-muted/50"
							>
								<div className="flex items-center justify-center w-8">
									{getRankIcon(contributor.rank)}
								</div>
								<Avatar className="h-8 w-8 md:h-10 md:w-10">
									<AvatarImage src={contributor.avatar ?? undefined} />
									<AvatarFallback>{contributor.name.charAt(0)}</AvatarFallback>
								</Avatar>
								<div className="flex-1 min-w-0">
									<div className="font-semibold text-sm md:text-base truncate">
										{contributor.name}
									</div>
									<div className="text-xs md:text-sm text-muted-foreground">
										{contributor.contributions} submission
									</div>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

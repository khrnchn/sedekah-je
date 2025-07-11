import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { StatCard, StatsGrid } from "@/components/user-page-components";
import { Award, Medal, Star, Trophy, Users } from "lucide-react";
import { getLeaderboardData } from "../_lib/queries";

function getRankIcon(rank: number) {
	switch (rank) {
		case 1:
			return <Trophy className="h-6 w-6 text-yellow-500" />;
		case 2:
			return <Medal className="h-6 w-6 text-slate-400" />;
		case 3:
			return <Award className="h-6 w-6 text-amber-600" />;
		default:
			return (
				<span className="text-sm font-bold text-muted-foreground">#{rank}</span>
			);
	}
}

export async function LeaderboardContent() {
	const data = await getLeaderboardData();
	const { stats, topContributors } = data;

	return (
		<div className="space-y-8">
			<StatsGrid cols={4}>
				<StatCard
					icon={Users}
					value={stats.totalContributors}
					label="Contributors"
				/>
				<StatCard
					icon={Star}
					value={stats.totalContributions}
					label="Contributions"
				/>
				<StatCard
					icon={Trophy}
					value={stats.mostActiveContributions}
					label="Most Active"
				/>
				<StatCard
					icon={Award}
					value={`${stats.verificationRate}%`}
					label="Verified"
				/>
			</StatsGrid>

			{topContributors.length > 0 && (
				<div className="space-y-8">
					<div className="flex items-end justify-center gap-2 md:gap-4">
						{/* Second Place */}
						{topContributors[1] && (
							<div className="flex flex-col items-center w-1/3">
								<Avatar className="w-12 h-12 md:w-20 md:h-20 border-4 border-slate-300">
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
										{topContributors[1].contributions} contributions
									</div>
								</div>
								<div className="w-full h-16 md:h-24 bg-slate-300/50 rounded-t-lg flex items-center justify-center mt-2">
									<span className="text-2xl md:text-4xl font-bold text-slate-600">
										2
									</span>
								</div>
							</div>
						)}

						{/* First Place */}
						{topContributors[0] && (
							<div className="flex flex-col items-center w-1/3">
								<Avatar className="w-16 h-16 md:w-24 md:h-24 border-4 border-yellow-400">
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
										{topContributors[0].contributions} contributions
									</div>
								</div>
								<div className="w-full h-20 md:h-32 bg-yellow-400/50 rounded-t-lg flex items-center justify-center mt-2">
									<span className="text-3xl md:text-5xl font-bold text-yellow-600">
										1
									</span>
								</div>
							</div>
						)}

						{/* Third Place */}
						{topContributors[2] && (
							<div className="flex flex-col items-center w-1/3">
								<Avatar className="w-12 h-12 md:w-20 md:h-20 border-4 border-amber-500">
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
										{topContributors[2].contributions} contributions
									</div>
								</div>
								<div className="w-full h-12 md:h-20 bg-amber-500/50 rounded-t-lg flex items-center justify-center mt-2">
									<span className="text-xl md:text-3xl font-bold text-amber-700">
										3
									</span>
								</div>
							</div>
						)}
					</div>

					<Card>
						<CardHeader>
							<CardTitle>Full List</CardTitle>
							<CardDescription>
								All contributors in the sedekah.je community
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
											<AvatarFallback>
												{contributor.name.charAt(0)}
											</AvatarFallback>
										</Avatar>
										<div className="flex-1 min-w-0">
											<div className="font-semibold text-sm md:text-base truncate">
												{contributor.name}
											</div>
											<div className="text-xs md:text-sm text-muted-foreground">
												{contributor.contributions} contributions
											</div>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</div>
			)}
		</div>
	);
}

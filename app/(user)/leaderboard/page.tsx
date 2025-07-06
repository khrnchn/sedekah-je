"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import PageSection from "@/components/ui/pageSection";
import { cn } from "@/lib/utils";
import { Award, Medal, Star, Trophy, Users } from "lucide-react";

export default function LeaderboardPage() {
	// Mock data for now
	const topContributors = [
		{
			rank: 1,
			name: "Ahmad Rahman",
			contributions: 45,
			avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d",
		},
		{
			rank: 2,
			name: "Siti Nurhaliza",
			contributions: 38,
			avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
		},
		{
			rank: 3,
			name: "Muhammad Ali",
			contributions: 32,
			avatar: "https://i.pravatar.cc/150?u=a04258114e29026302d",
		},
		{
			rank: 4,
			name: "Fatimah Zahra",
			contributions: 28,
			avatar: "https://i.pravatar.cc/150?u=a04258114e29026702d",
		},
		{
			rank: 5,
			name: "Hassan Ibrahim",
			contributions: 25,
			avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704e",
		},
	];

	const getRankIcon = (rank: number) => {
		switch (rank) {
			case 1:
				return <Trophy className="h-6 w-6 text-yellow-500" />;
			case 2:
				return <Medal className="h-6 w-6 text-slate-400" />;
			case 3:
				return <Award className="h-6 w-6 text-amber-600" />;
			default:
				return (
					<span className="text-sm font-bold text-muted-foreground">
						#{rank}
					</span>
				);
		}
	};

	return (
		<PageSection>
			<div className="space-y-8">
				<div className="text-center">
					<h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
					<p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
						See the top contributors in the sedekah.je community
					</p>
				</div>

				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					<Card>
						<CardContent className="p-3 md:p-4 text-center">
							<Users className="h-6 w-6 md:h-8 md:w-8 text-primary mx-auto mb-2" />
							<div className="text-xl md:text-2xl font-bold">127</div>
							<p className="text-xs md:text-sm text-muted-foreground">
								Contributors
							</p>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-3 md:p-4 text-center">
							<Star className="h-6 w-6 md:h-8 md:w-8 text-primary mx-auto mb-2" />
							<div className="text-xl md:text-2xl font-bold">2,450</div>
							<p className="text-xs md:text-sm text-muted-foreground">
								Contributions
							</p>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-3 md:p-4 text-center">
							<Trophy className="h-6 w-6 md:h-8 md:w-8 text-primary mx-auto mb-2" />
							<div className="text-xl md:text-2xl font-bold">45</div>
							<p className="text-xs md:text-sm text-muted-foreground">
								Most Active
							</p>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-3 md:p-4 text-center">
							<Award className="h-6 w-6 md:h-8 md:w-8 text-primary mx-auto mb-2" />
							<div className="text-xl md:text-2xl font-bold">95%</div>
							<p className="text-xs md:text-sm text-muted-foreground">
								Verified
							</p>
						</CardContent>
					</Card>
				</div>

				<div className="flex items-end justify-center gap-2 md:gap-4">
					{/* Second Place */}
					<div className="flex flex-col items-center w-1/3">
						<Avatar className="w-12 h-12 md:w-20 md:h-20 border-4 border-slate-300">
							<AvatarImage src={topContributors[1].avatar} />
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

					{/* First Place */}
					<div className="flex flex-col items-center w-1/3">
						<Avatar className="w-16 h-16 md:w-24 md:h-24 border-4 border-yellow-400">
							<AvatarImage src={topContributors[0].avatar} />
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

					{/* Third Place */}
					<div className="flex flex-col items-center w-1/3">
						<Avatar className="w-12 h-12 md:w-20 md:h-20 border-4 border-amber-500">
							<AvatarImage src={topContributors[2].avatar} />
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
										<AvatarImage src={contributor.avatar} />
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
		</PageSection>
	);
}

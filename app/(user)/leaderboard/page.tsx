import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import PageSection from "@/components/ui/pageSection";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, Medal, Star, Trophy, Users } from "lucide-react";
import { Suspense } from "react";
import { getLeaderboardData } from "./_lib/queries";

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

function StatsCardSkeleton() {
	return (
		<Card>
			<CardContent className="p-3 md:p-4 text-center">
				<div className="h-6 w-6 md:h-8 md:w-8 mx-auto mb-2 opacity-50" />
				<Skeleton className="h-8 w-16 mx-auto" />
				<div className="text-xs md:text-sm text-muted-foreground mt-2">
					Loading...
				</div>
			</CardContent>
		</Card>
	);
}

function TopContributorsSkeleton() {
	return (
		<div className="flex items-end justify-center gap-2 md:gap-4">
			{/* Second Place Skeleton */}
			<div className="flex flex-col items-center w-1/3">
				<Skeleton className="w-12 h-12 md:w-20 md:h-20 rounded-full" />
				<div className="text-center mt-2 space-y-2">
					<Skeleton className="h-4 w-20" />
					<Skeleton className="h-3 w-16" />
				</div>
				<Skeleton className="w-full h-16 md:h-24 mt-2" />
			</div>

			{/* First Place Skeleton */}
			<div className="flex flex-col items-center w-1/3">
				<Skeleton className="w-16 h-16 md:w-24 md:h-24 rounded-full" />
				<div className="text-center mt-2 space-y-2">
					<Skeleton className="h-5 w-24" />
					<Skeleton className="h-3 w-20" />
				</div>
				<Skeleton className="w-full h-20 md:h-32 mt-2" />
			</div>

			{/* Third Place Skeleton */}
			<div className="flex flex-col items-center w-1/3">
				<Skeleton className="w-12 h-12 md:w-20 md:h-20 rounded-full" />
				<div className="text-center mt-2 space-y-2">
					<Skeleton className="h-4 w-20" />
					<Skeleton className="h-3 w-16" />
				</div>
				<Skeleton className="w-full h-12 md:h-20 mt-2" />
			</div>
		</div>
	);
}

async function LeaderboardContent() {
	const data = await getLeaderboardData();
	const { stats, topContributors } = data;

	return (
		<>
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				<Card>
					<CardContent className="p-3 md:p-4 text-center">
						<Users className="h-6 w-6 md:h-8 md:w-8 text-primary mx-auto mb-2" />
						<div className="text-xl md:text-2xl font-bold">
							{stats.totalContributors}
						</div>
						<p className="text-xs md:text-sm text-muted-foreground">
							Penyumbang
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-3 md:p-4 text-center">
						<Star className="h-6 w-6 md:h-8 md:w-8 text-primary mx-auto mb-2" />
						<div className="text-xl md:text-2xl font-bold">
							{stats.totalContributions}
						</div>
						<p className="text-xs md:text-sm text-muted-foreground">
							Jumlah Sumbangan
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-3 md:p-4 text-center">
						<Trophy className="h-6 w-6 md:h-8 md:w-8 text-primary mx-auto mb-2" />
						<div className="text-xl md:text-2xl font-bold">
							{stats.mostActiveContributions}
						</div>
						<p className="text-xs md:text-sm text-muted-foreground">
							Paling Aktif
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-3 md:p-4 text-center">
						<Award className="h-6 w-6 md:h-8 md:w-8 text-primary mx-auto mb-2" />
						<div className="text-xl md:text-2xl font-bold">
							{stats.verificationRate}%
						</div>
						<p className="text-xs md:text-sm text-muted-foreground">Disahkan</p>
					</CardContent>
				</Card>
			</div>

			{topContributors.length > 0 && (
				<>
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
										{topContributors[1].contributions} sumbangan
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
										{topContributors[0].contributions} sumbangan
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
										{topContributors[2].contributions} sumbangan
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
							<CardTitle>Senarai Penuh</CardTitle>
							<CardDescription>
								Senarai semua penyumbang komuniti SedekahJe
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
												{contributor.contributions} sumbangan
											</div>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</>
			)}
		</>
	);
}

export default function LeaderboardPage() {
	return (
		<PageSection>
			<div className="space-y-8">
				<div className="text-center">
					<h1 className="text-3xl font-bold tracking-tight">
						Carta Penyumbang
					</h1>
					<p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
						Lihat penyumbang teratas dalam komuniti sedekah.je
					</p>
				</div>

				<Suspense
					fallback={
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
							<StatsCardSkeleton />
							<StatsCardSkeleton />
							<StatsCardSkeleton />
							<StatsCardSkeleton />
						</div>
					}
				>
					<LeaderboardContent />
				</Suspense>
			</div>
		</PageSection>
	);
}

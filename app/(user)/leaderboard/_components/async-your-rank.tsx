import { Trophy } from "lucide-react";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUserLeaderboardRank } from "../_lib/queries";

export async function AsyncYourRank() {
	const hdrs = await headers();
	const session = await auth.api.getSession({ headers: hdrs });

	if (!session?.user?.id) {
		return null;
	}

	const rank = await getCurrentUserLeaderboardRank(session.user.id);

	if (!rank) {
		return null;
	}

	return (
		<Card className="border-primary/20 bg-primary/5">
			<CardContent className="flex items-center gap-3 p-4">
				<Trophy className="h-8 w-8 text-primary shrink-0" />
				<div>
					<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
						Kedudukan Anda
					</p>
					<p className="text-lg font-semibold">
						#{rank.rank} · {rank.contributions} sumbangan
					</p>
				</div>
			</CardContent>
		</Card>
	);
}

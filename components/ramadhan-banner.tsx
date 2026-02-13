import { getTodaysFeatured } from "@/app/ramadhan/_lib/queries";
import Share from "@/components/share";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import RamadhanCountdown from "./ramadhan-countdown";

const BASE_URL = "https://sedekah.je";

export async function RamadhanBanner() {
	try {
		const featured = await getTodaysFeatured();
		if (!featured) return <RamadhanCountdown />;

		const customMessage = `QR Hari Ini — Hari ke-${featured.dayNumber}/30 Ramadan! 🌙\n\n${featured.institutionName} (${featured.institutionState})\n\n${BASE_URL}/ramadhan\n\n#SedekahJe #30Hari30QR`;

		return (
			<Card className="relative overflow-hidden bg-gradient-to-r from-emerald-400 to-teal-800 text-white shadow-lg">
				<div className="absolute inset-0 opacity-30 ramadhan-bg" />
				<CardContent className="relative p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
					<div>
						<p className="text-sm font-medium opacity-90">
							QR Hari Ini — Hari ke-{featured.dayNumber}/30
						</p>
						<p className="font-semibold text-lg">{featured.institutionName}</p>
					</div>
					<div className="flex gap-2 shrink-0">
						<Button
							asChild
							size="sm"
							className="bg-white text-teal-800 hover:bg-white/90"
						>
							<Link href="/ramadhan">Lihat QR</Link>
						</Button>
						<Share
							data={{
								category: featured.institutionCategory,
								name: featured.institutionName,
								slug: featured.institutionSlug,
								customMessage,
							}}
							platform="X"
						/>
					</div>
				</CardContent>
			</Card>
		);
	} catch {
		return null;
	}
}

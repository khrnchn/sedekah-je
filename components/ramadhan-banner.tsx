import { getTodaysFeatured } from "@/app/ramadhan/_lib/queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import RamadhanCountdown from "./ramadhan-countdown";

export async function RamadhanBanner() {
	try {
		const featured = await getTodaysFeatured();
		if (!featured) return <RamadhanCountdown />;

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
						<Button
							asChild
							size="sm"
							className="bg-white/20 text-white hover:bg-white/30 border border-white/40"
						>
							<Link href="/ramadhan">Senarai QR Ramadhan</Link>
						</Button>
					</div>
				</CardContent>
			</Card>
		);
	} catch {
		return null;
	}
}

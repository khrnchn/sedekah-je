import Image from "next/image";
import Link from "next/link";
import { getCurrentFridayCampaign } from "@/app/friday/_lib/queries";
import { getTodaysFeatured } from "@/app/ramadhan/_lib/queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import RamadhanCountdown from "./ramadhan-countdown";

export async function RamadhanBanner() {
	try {
		const featured = await getTodaysFeatured();
		if (!featured) {
			const fridayFeatured = await getCurrentFridayCampaign();
			if (fridayFeatured) {
				const institutionHref = `/${fridayFeatured.institutionCategory}/${fridayFeatured.institutionSlug}`;

				return (
					<Card className="relative overflow-hidden border-emerald-900/10 bg-emerald-950 text-white shadow-lg">
						<Image
							src="/friday-campaign-banner.png"
							alt=""
							fill
							priority={false}
							sizes="(max-width: 1024px) 100vw, 1024px"
							className="object-cover opacity-75"
						/>
						<div className="absolute inset-0 bg-gradient-to-r from-emerald-950 via-emerald-950/75 to-emerald-950/20" />
						<CardContent className="relative p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
							<div className="min-w-0">
								<p className="text-sm font-medium text-emerald-100">
									QR Jumaat Pilihan
								</p>
								<p className="truncate font-semibold text-lg">
									{fridayFeatured.institutionName}
								</p>
								<p className="text-sm text-emerald-50/90">
									{fridayFeatured.institutionCity},{" "}
									{fridayFeatured.institutionState}
								</p>
							</div>
							<div className="flex gap-2 shrink-0">
								<Button
									asChild
									size="sm"
									className="bg-white text-emerald-950 hover:bg-white/90"
								>
									<Link href={institutionHref}>Lihat QR</Link>
								</Button>
							</div>
						</CardContent>
					</Card>
				);
			}

			return <RamadhanCountdown />;
		}

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

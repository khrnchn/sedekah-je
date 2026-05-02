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
					<Card className="relative overflow-hidden border-accent/40 bg-accent/15">
						<Image
							src="/friday-campaign-banner.png"
							alt=""
							fill
							priority={false}
							sizes="(max-width: 1024px) 100vw, 1024px"
							className="object-cover opacity-20 mix-blend-multiply dark:mix-blend-screen"
						/>
						<CardContent className="relative p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
							<div className="min-w-0">
								<p className="text-sm font-medium text-accent-foreground">
									QR Jumaat Pilihan
								</p>
								<p className="truncate font-semibold text-lg text-foreground">
									{fridayFeatured.institutionName}
								</p>
								<p className="text-sm text-muted-foreground">
									{fridayFeatured.institutionCity},{" "}
									{fridayFeatured.institutionState}
								</p>
							</div>
							<div className="flex gap-2 shrink-0">
								<Button asChild size="sm">
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
			<Card className="relative overflow-hidden border-accent/40 bg-accent/15">
				<div className="absolute inset-0 opacity-20 ramadhan-bg" />
				<CardContent className="relative p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
					<div>
						<p className="text-sm font-medium text-accent-foreground">
							QR Hari Ini — Hari ke-{featured.dayNumber}/30
						</p>
						<p className="font-semibold text-lg text-foreground">
							{featured.institutionName}
						</p>
					</div>
					<div className="flex gap-2 shrink-0">
						<Button asChild size="sm">
							<Link href="/ramadhan">Lihat QR</Link>
						</Button>
						<Button asChild size="sm" variant="outline">
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

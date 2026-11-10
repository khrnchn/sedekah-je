import moment from "moment-hijri";
import Image from "next/image";
import Link from "next/link";
import { getCurrentFridayCampaign } from "@/app/friday/_lib/queries";
import { getQuestDistrictStats } from "@/app/quest/_lib/queries";
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

			// Sya'ban (Hijri month index 7) is the run-up month, so the countdown takes the slot back.
			if (moment().iMonth() === 7) return <RamadhanCountdown />;

			const stats = await getQuestDistrictStats();
			const total = stats.reduce((sum, d) => sum + d.total, 0);
			const hasQr = stats.reduce((sum, d) => sum + d.hasQr, 0);
			if (total === 0 || hasQr >= total) return <RamadhanCountdown />;
			const percent = Math.round((hasQr / total) * 100);

			return (
				<Card className="relative overflow-hidden border-emerald-700/20 bg-emerald-50/70 dark:border-emerald-400/20 dark:bg-emerald-950/30">
					<CardContent className="relative flex items-center gap-4 p-4">
						<QuestStamp />
						<div className="min-w-0 flex-1">
							<p className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
								Misi Masjid Selangor
							</p>
							<p className="mt-0.5 text-lg font-semibold text-foreground">
								<span className="tabular-nums">{hasQr}</span>
								<span className="text-muted-foreground"> / </span>
								<span className="tabular-nums">{total}</span> masjid sudah ada
								QR
							</p>
							<div
								className="mt-2 h-1.5 overflow-hidden rounded-full bg-emerald-900/10 dark:bg-emerald-100/10"
								role="progressbar"
								aria-label="Kemajuan Misi Masjid Selangor"
								aria-valuenow={percent}
								aria-valuemin={0}
								aria-valuemax={100}
							>
								<div
									className="h-full rounded-full bg-emerald-700 dark:bg-emerald-400"
									style={{ width: `${Math.max(percent, 2)}%` }}
								/>
							</div>
							<div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
								<p className="text-sm text-muted-foreground">
									<span className="font-medium text-foreground tabular-nums">
										{total - hasQr}
									</span>{" "}
									lagi perlu dicari. Kenal masjid berdekatan? Bantu tambah QR.
								</p>
								<Button asChild size="sm" className="shrink-0 self-start">
									<Link href="/quest">Sertai Quest</Link>
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			);
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
							<Link
								href={`/${featured.institutionCategory}/${featured.institutionSlug}`}
							>
								Lihat QR
							</Link>
						</Button>
						<Button asChild size="sm" variant="outline">
							<Link href="/ramadhan">Semua 30 Hari</Link>
						</Button>
					</div>
				</CardContent>
			</Card>
		);
	} catch {
		return null;
	}
}

function QuestStamp() {
	return (
		<span
			aria-hidden
			className="relative hidden size-[72px] shrink-0 -rotate-6 place-items-center text-emerald-700 min-[380px]:grid dark:text-emerald-400"
		>
			<svg viewBox="0 0 100 100" className="absolute inset-0 size-full">
				<defs>
					<path id="home-quest-stamp-top" d="M12,50 a38,38 0 0,1 76,0" />
					<path id="home-quest-stamp-bottom" d="M12,50 a38,38 0 0,0 76,0" />
				</defs>
				<circle
					cx="50"
					cy="50"
					r="46"
					fill="none"
					stroke="currentColor"
					strokeWidth="3.5"
				/>
				<circle
					cx="50"
					cy="50"
					r="30"
					fill="none"
					stroke="currentColor"
					strokeWidth="1.4"
				/>
				<circle cx="12" cy="50" r="2.2" fill="currentColor" />
				<circle cx="88" cy="50" r="2.2" fill="currentColor" />
				<text
					fill="currentColor"
					fontSize="9.5"
					fontWeight="700"
					letterSpacing="1.3"
					textAnchor="middle"
					dominantBaseline="central"
				>
					<textPath href="#home-quest-stamp-top" startOffset="50%">
						SEDEKAH.JE
					</textPath>
				</text>
				<text
					fill="currentColor"
					fontSize="9.5"
					fontWeight="700"
					letterSpacing="1.3"
					textAnchor="middle"
					dominantBaseline="central"
				>
					<textPath href="#home-quest-stamp-bottom" startOffset="50%">
						SELANGOR
					</textPath>
				</text>
			</svg>
			<span
				className="size-8 bg-current"
				style={{ mask: 'url("/masjid.svg") center / contain no-repeat' }}
			/>
		</span>
	);
}

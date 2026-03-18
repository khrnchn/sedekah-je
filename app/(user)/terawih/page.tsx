import { BarChart3, Sparkles, Timer } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { UserLayout } from "@/components/layout/user-layout";
import { StatCard, StatsGrid } from "@/components/layout/user-page-components";
import { Button } from "@/components/ui/button";
import { getBaseUrl } from "@/lib/utils";
import { TerawihSessionForm } from "./_components/terawih-session-form";
import { TerawihSessionList } from "./_components/terawih-session-list";
import {
	getDefaultTerawihDate,
	getTerawihDashboardData,
	getTerawihInstitutions,
} from "./_lib/queries";

const BASE_URL = getBaseUrl();

export const metadata: Metadata = {
	title: "Terawih Tracker",
	description:
		"Log sesi tarawih anda, jana kad share bergaya futuristik, dan lihat wrapped Ramadan di SedekahJe.",
	openGraph: {
		title: "Terawih Tracker | Sedekah Je",
		description:
			"Log sesi tarawih anda, jana kad share bergaya futuristik, dan lihat wrapped Ramadan di SedekahJe.",
		url: `${BASE_URL}/terawih`,
	},
	twitter: {
		title: "Terawih Tracker | Sedekah Je",
		description:
			"Log sesi tarawih anda, jana kad share bergaya futuristik, dan lihat wrapped Ramadan di SedekahJe.",
	},
	alternates: {
		canonical: `${BASE_URL}/terawih`,
	},
	robots: {
		index: false,
		follow: false,
	},
};

export default async function TerawihPage() {
	const [{ stats, sessions }, institutions] = await Promise.all([
		getTerawihDashboardData(),
		getTerawihInstitutions(),
	]);
	const defaultDate = getDefaultTerawihDate();

	return (
		<UserLayout
			title="Terawih Tracker"
			description="Log sesi, kira avg MPR, dan export kad story ala performance dashboard."
		>
			<div className="space-y-8">
				<div className="flex flex-col gap-4 rounded-3xl border border-orange-500/20 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.12),_transparent_40%),linear-gradient(180deg,_rgba(18,14,11,0.98)_0%,_rgba(15,13,12,0.92)_100%)] p-6 text-white md:flex-row md:items-end md:justify-between">
					<div className="space-y-3">
						<p className="text-sm uppercase tracking-[0.35em] text-orange-300">
							Terawih Performance Log
						</p>
						<h2 className="text-3xl font-black tracking-tight">
							Session-first, not OG-first.
						</h2>
						<p className="max-w-2xl text-sm text-white/70">
							Setiap sesi yang anda log boleh terus dijadikan kad story 9:16
							untuk dikongsi secara manual ke WhatsApp, IG, atau X.
						</p>
					</div>
					<Button asChild variant="secondary" className="shrink-0">
						<Link href="/terawih/wrapped">Lihat Ramadan Wrapped</Link>
					</Button>
				</div>

				<StatsGrid cols={4}>
					<StatCard
						icon={Sparkles}
						value={stats.totalNights}
						label="Jumlah malam"
					/>
					<StatCard
						icon={Timer}
						value={`${stats.totalMinutes} min`}
						label="Jumlah minit"
					/>
					<StatCard
						icon={BarChart3}
						value={stats.totalRakaat}
						label="Jumlah rakaat"
					/>
					<StatCard value={stats.averageMpr} label="Purata MPR" />
				</StatsGrid>

				<div className="grid gap-8 lg:grid-cols-[minmax(0,380px)_1fr]">
					<TerawihSessionForm
						institutions={institutions}
						defaultDate={defaultDate}
					/>
					<section className="space-y-4">
						<div className="flex items-center justify-between gap-4">
							<div>
								<h2 className="text-xl font-semibold">Sesi Terkini</h2>
								<p className="text-sm text-muted-foreground">
									Pilih sesi untuk preview dan export kad story.
								</p>
							</div>
						</div>
						<TerawihSessionList sessions={sessions} />
					</section>
				</div>
			</div>
		</UserLayout>
	);
}

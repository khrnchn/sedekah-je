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
			<div className="space-y-6">
				{/* Hero banner - compact on mobile */}
				<div className="flex flex-col gap-3 rounded-2xl border border-orange-500/20 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.12),_transparent_40%),linear-gradient(180deg,_rgba(18,14,11,0.98)_0%,_rgba(15,13,12,0.92)_100%)] p-4 text-white sm:rounded-3xl sm:p-6 md:flex-row md:items-end md:justify-between">
					<div className="space-y-2">
						<p className="text-xs uppercase tracking-[0.35em] text-orange-300 sm:text-sm">
							Terawih Performance Log
						</p>
						<h2 className="text-2xl font-black tracking-tight sm:text-3xl">
							Session-first, not OG-first.
						</h2>
						<p className="max-w-2xl text-xs text-white/70 sm:text-sm">
							Log sesi dan terus jana kad story 9:16 untuk dikongsi ke WhatsApp,
							IG, atau X.
						</p>
					</div>
					<Button
						asChild
						variant="secondary"
						className="mt-1 shrink-0 self-start md:self-auto"
					>
						<Link href="/terawih/wrapped">Ramadan Wrapped</Link>
					</Button>
				</div>

				{/* Stats - 2x2 on mobile, 4 cols on desktop */}
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

				{/* Form + session list - stacked on mobile */}
				<div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
					<TerawihSessionForm
						institutions={institutions}
						defaultDate={defaultDate}
					/>
					<section className="space-y-3">
						<div>
							<h2 className="text-lg font-semibold sm:text-xl">Sesi Terkini</h2>
							<p className="text-xs text-muted-foreground sm:text-sm">
								Pilih sesi untuk preview dan export kad story.
							</p>
						</div>
						<TerawihSessionList sessions={sessions} />
					</section>
				</div>
			</div>
		</UserLayout>
	);
}

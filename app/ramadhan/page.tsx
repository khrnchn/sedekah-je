import { Header } from "@/components/ui/header";
import { getIslamicDateMYT, toDateString } from "@/lib/ramadhan";
import type { Metadata } from "next";
import { RamadhanCalendar } from "./_components/ramadhan-calendar";
import { RamadhanTodayCard } from "./_components/ramadhan-today-card";
import { getCampaignByYear, getTodaysFeatured } from "./_lib/queries";

const BASE_URL = "https://sedekah.je";

export async function generateMetadata(): Promise<Metadata> {
	const featured = await getTodaysFeatured();
	const dayNum = featured?.dayNumber ?? 1;

	return {
		title: "30 Hari 30 QR — Kempen Ramadan | SedekahJe",
		description:
			"Ikuti kempen #SedekahJe 30 Hari 30 QR — satu institusi, satu kod QR setiap hari sepanjang Ramadan.",
		openGraph: {
			title: "30 Hari 30 QR — Kempen Ramadan",
			description:
				"Satu QR sehari sepanjang Ramadan. Kongsi sedekah dengan komuniti.",
			images: [`${BASE_URL}/api/og/ramadhan/${dayNum}`],
		},
	};
}

export default async function RamadhanPage() {
	const year = new Date().getFullYear();

	const [campaign, todaysFeatured] = await Promise.all([
		getCampaignByYear(year),
		getTodaysFeatured(),
	]);

	const campaignByDay = Object.fromEntries(
		campaign.map((c) => [c.dayNumber, c]),
	) as Record<number, (typeof campaign)[number]>;

	const todayDateStr = toDateString(getIslamicDateMYT());
	const todayDayNumber = todaysFeatured?.dayNumber ?? null;

	const startDate = campaignByDay[1]?.featuredDate ?? `${year}-03-01`;

	return (
		<>
			<Header />
			<main className="container mx-auto px-4 py-8 max-w-4xl lg:max-w-6xl">
				<header className="mb-8">
					<h1 className="text-3xl font-bold">
						30 Hari 30 QR — Kempen Ramadan {year}
					</h1>
					<p className="mt-2 text-muted-foreground">
						Satu institusi, satu kod QR setiap hari sepanjang Ramadan. Jom
						bersedekah!
					</p>
				</header>

				{todaysFeatured && (
					<section className="mb-10">
						<RamadhanTodayCard featured={todaysFeatured} baseUrl={BASE_URL} />
					</section>
				)}

				<section>
					<h2 className="text-xl font-semibold mb-4">Kalendar 30 Hari</h2>
					<RamadhanCalendar
						year={year}
						startDate={startDate}
						campaignByDay={campaignByDay}
						todayDayNumber={todayDayNumber}
						todayDateStr={todayDateStr}
						baseUrl={BASE_URL}
					/>
				</section>
			</main>
		</>
	);
}

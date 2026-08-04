/**
 * TEMPORARY scaffolding — delete once the embed has been reviewed.
 *
 * Renders the real EmbedCard with sample data so the embed can be inspected
 * without a database connection. `?card=1` renders a single card (what an
 * iframe would show); without it you get a fake "host site" framing them.
 */
import {
	buildEmbedSnippet,
	EMBED_SIZES,
	EMBED_THEME_LABELS,
	type EmbedSize,
	type EmbedTheme,
	parseEmbedSize,
	parseEmbedTheme,
} from "@/lib/embed";
import { EmbedCard } from "../[slug]/_components/embed-card";

const SAMPLE = {
	name: "Masjid Bandar Putera Indah (Dana Pembinaan)",
	city: "Batu Pahat",
	state: "Johor",
	qrContent:
		"00020201021126580014A000000615000101065999990206SEDEKAH5204739953034585802MY5925MASJID BANDAR PUTERA INDA6010BATU PAHAT61058300062070503***6304ABCD",
	qrImage: null,
	supportedPayment: ["duitnow"] as const,
	slug: "masjid-bandar-putera-indah-dana-pembinaan",
};

type Props = {
	searchParams: Promise<{ card?: string; theme?: string; size?: string }>;
};

export default async function EmbedPreviewPage(props: Props) {
	const searchParams = await props.searchParams;

	if (searchParams.card) {
		return (
			<EmbedCard
				name={SAMPLE.name}
				city={SAMPLE.city}
				state={SAMPLE.state}
				qrContent={SAMPLE.qrContent}
				qrImage={SAMPLE.qrImage}
				supportedPayment={[...SAMPLE.supportedPayment]}
				isVerified
				institutionUrl="/masjid/masjid-bandar-putera-indah-dana-pembinaan"
				theme={parseEmbedTheme(searchParams.theme)}
				size={parseEmbedSize(searchParams.size)}
			/>
		);
	}

	const sizes = Object.keys(EMBED_SIZES) as EmbedSize[];
	const themes: EmbedTheme[] = ["light", "dark", "auto"];
	const snippet = buildEmbedSnippet({
		url: `https://sedekah.je/embed/${SAMPLE.slug}`,
		name: SAMPLE.name,
	});

	return (
		<main className="mx-auto max-w-5xl space-y-10 bg-white p-8 font-sans text-slate-900">
			<header className="space-y-2">
				<p className="text-xs uppercase tracking-widest text-slate-400">
					Pratonton sementara
				</p>
				<h1 className="text-2xl font-bold">
					Ini contoh laman web pihak ketiga
				</h1>
				<p className="max-w-2xl text-sm text-slate-600">
					Setiap kotak di bawah ialah <code>&lt;iframe&gt;</code> yang menunjuk
					ke sedekah.je. Banner &ldquo;Dikuasakan oleh sedekah.je&rdquo; membawa
					pelawat balik ke halaman institusi.
				</p>
				<pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100">
					<code>{snippet}</code>
				</pre>
			</header>

			{themes.map((theme) => (
				<section key={theme} className="space-y-3">
					<h2 className="text-sm font-semibold text-slate-700">
						Tema: {EMBED_THEME_LABELS[theme]}
						<span className="ml-2 font-normal text-slate-400">
							?theme={theme}
						</span>
					</h2>
					<div className="flex flex-wrap items-start gap-6">
						{sizes.map((size) => (
							<figure key={size} className="space-y-2">
								<iframe
									title={`${theme}-${size}`}
									src={`/embed/preview?card=1&theme=${theme}&size=${size}`}
									width={EMBED_SIZES[size].width}
									height={EMBED_SIZES[size].height}
									style={{ border: 0 }}
									className="rounded-lg ring-1 ring-slate-200"
								/>
								<figcaption className="text-xs text-slate-500">
									{EMBED_SIZES[size].label} · {EMBED_SIZES[size].width}×
									{EMBED_SIZES[size].height}
								</figcaption>
							</figure>
						))}
					</div>
				</section>
			))}
		</main>
	);
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { parseEmbedSize, parseEmbedTheme } from "@/lib/embed";
import { getInstitutionBySlug } from "@/lib/queries/institutions";
import { EmbedCard } from "./_components/embed-card";

type Props = {
	params: Promise<{ slug: string }>;
	searchParams: Promise<{
		theme?: string;
		size?: string;
		/** Legacy flag kept for embeds published before `size` existed. */
		compact?: string;
	}>;
};

export const metadata: Metadata = {
	robots: { index: false, follow: false },
};

export default async function EmbedPage(props: Props) {
	const [params, searchParams] = await Promise.all([
		props.params,
		props.searchParams,
	]);
	const institution = await getInstitutionBySlug(params.slug);

	if (!institution) notFound();

	if (!institution.qrContent && !institution.qrImage) {
		return (
			<main className="flex min-h-dvh items-center justify-center p-4 text-center text-xs text-muted-foreground">
				Kod QR tidak tersedia.
			</main>
		);
	}

	const theme = parseEmbedTheme(searchParams.theme);
	const size = parseEmbedSize(searchParams.size, searchParams.compact);
	// Relative on purpose: it resolves against the iframe's own origin, so the
	// banner links home correctly regardless of deployment URL.
	const institutionUrl = `/${institution.category}/${institution.slug}?utm_source=embed&utm_medium=iframe`;

	return (
		<>
			{theme === "auto" && (
				<script
					// Mirrors the host site's colour scheme; Tailwind reads `.dark`
					// from any ancestor, so stamping <html> is enough.
					dangerouslySetInnerHTML={{
						__html:
							"if(window.matchMedia('(prefers-color-scheme: dark)').matches)document.documentElement.classList.add('dark')",
					}}
				/>
			)}
			<EmbedCard
				name={institution.name}
				city={institution.city}
				state={institution.state}
				qrContent={institution.qrContent}
				qrImage={institution.qrImage}
				supportedPayment={institution.supportedPayment}
				isVerified={institution.isVerified}
				institutionUrl={institutionUrl}
				theme={theme}
				size={size}
			/>
		</>
	);
}

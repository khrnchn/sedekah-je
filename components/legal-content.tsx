import Link from "next/link";

type LegalContentProps = {
	showTitle?: boolean;
};

export function LegalContent({ showTitle = true }: LegalContentProps) {
	return (
		<main className="container mx-auto max-w-4xl px-4 py-10">
			{showTitle && (
				<header className="mb-8">
					<h1 className="text-3xl font-bold">Legal: Privacy & Terms</h1>
					<p className="text-muted-foreground mt-2">
						Last updated: February 23, 2026
					</p>
				</header>
			)}

			<div className="space-y-8 text-sm leading-7 sm:text-base">
				<section className="space-y-2">
					<h2 className="text-xl font-semibold">Privacy Policy</h2>
					<p>
						SedekahJe collects limited account and usage data to operate the
						service, improve product quality, and protect the platform.
					</p>
					<p>
						We may process information such as name, email, profile image,
						contribution records, and technical logs (for example browser, IP,
						and request metadata).
					</p>
					<p>
						We do not sell personal data. Data may be shared with infrastructure
						providers used to run the service (for example hosting, database,
						storage, analytics, and authentication providers).
					</p>
					<p>
						To request account/data deletion or privacy-related support, contact{" "}
						<Link href="mailto:hello@sedekah.je" className="text-primary">
							hello@sedekah.je
						</Link>
						.
					</p>
				</section>

				<section className="space-y-2">
					<h2 className="text-xl font-semibold">Terms of Service</h2>
					<p>
						By using sedekah.je, you agree to use the service lawfully and not
						abuse, disrupt, or attempt unauthorized access to the platform.
					</p>
					<p>
						Contributed content (including QR references and institution data)
						must be accurate to the best of your knowledge. We may moderate,
						update, or remove submissions at our discretion.
					</p>
					<p>
						The service is provided on an &quot;as is&quot; basis without
						warranties. To the maximum extent permitted by law, SedekahJe is not
						liable for indirect or consequential losses arising from use of the
						service.
					</p>
					<p>
						These terms may be updated from time to time. Continued use after
						changes means acceptance of the updated terms.
					</p>
				</section>

				<section className="space-y-2">
					<h2 className="text-xl font-semibold">Contact</h2>
					<p>
						For legal, privacy, or compliance questions, contact{" "}
						<Link href="mailto:hello@sedekah.je" className="text-primary">
							hello@sedekah.je
						</Link>
						.
					</p>
				</section>
			</div>
		</main>
	);
}

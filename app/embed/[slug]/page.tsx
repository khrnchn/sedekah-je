import { QRCodeSVG } from "qrcode.react";
import type { PaymentOption } from "@/app/types/institutions";
import SedekahjeLogo from "@/components/sedekahje-logo";
import { paymentBrands } from "@/lib/payment-brands";
import { getInstitutionBySlug } from "@/lib/queries/institutions";
import { cn } from "@/lib/utils";

type Props = {
	params: Promise<{ slug: string }>;
	searchParams: Promise<{
		theme?: string;
		compact?: string;
	}>;
};

export default async function EmbedPage(props: Props) {
	const [params, searchParams] = await Promise.all([
		props.params,
		props.searchParams,
	]);
	const institution = await getInstitutionBySlug(params.slug);

	if (!institution?.qrContent) {
		return (
			<main className="flex min-h-screen items-center justify-center bg-background p-4 text-center text-sm text-muted-foreground">
				QR not available.
			</main>
		);
	}

	const isDark = searchParams.theme === "dark";
	const isCompact = searchParams.compact === "true";
	const payment =
		(institution.supportedPayment?.[0] as PaymentOption | undefined) ??
		"duitnow";
	const accent = paymentBrands[payment] ?? paymentBrands.duitnow;
	const qrSize = isCompact ? 180 : 240;

	return (
		<main
			className={cn(
				"flex min-h-screen items-center justify-center p-4 bg-background text-foreground",
				isDark && "dark",
			)}
		>
			<section
				className={cn(
					"flex w-full max-w-[360px] flex-col items-center text-center",
					isCompact ? "gap-3" : "gap-4",
				)}
			>
				<div className="flex items-center gap-2">
					<SedekahjeLogo width="28" height="28" />
					<span className="text-sm font-semibold">sedekah.je</span>
				</div>

				<div
					className="rounded-md p-3"
					style={{
						backgroundColor: accent.color,
					}}
				>
					{/* bg-white is intentional: QR scanners require a white background */}
					<div className="rounded bg-white p-3">
						<QRCodeSVG
							value={institution.qrContent}
							size={qrSize}
							level="M"
							fgColor={accent.color}
						/>
					</div>
				</div>

				<div className="space-y-1">
					<h1 className="text-balance text-base font-semibold leading-snug">
						{institution.name}
					</h1>
					<p className="text-xs text-muted-foreground">
						{institution.city}, {institution.state} · {accent.label}
					</p>
				</div>

				<p className="rounded-md border border-primary/30 bg-primary/8 px-3 py-1 text-xs font-medium text-primary">
					Disahkan oleh sedekah.je
				</p>
			</section>
		</main>
	);
}

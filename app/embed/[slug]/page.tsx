import { QRCodeSVG } from "qrcode.react";
import type { PaymentOption } from "@/app/types/institutions";
import SedekahjeLogo from "@/components/sedekahje-logo";
import { getInstitutionBySlug } from "@/lib/queries/institutions";
import { cn } from "@/lib/utils";

type Props = {
	params: Promise<{ slug: string }>;
	searchParams: Promise<{
		theme?: string;
		compact?: string;
	}>;
};

const paymentTheme = {
	duitnow: {
		color: "#ED2C66",
		label: "DuitNow",
	},
	boost: {
		color: "#EE2E24",
		label: "Boost",
	},
	tng: {
		color: "#015ABF",
		label: "Touch 'n Go",
	},
	toyyibpay: {
		color: "#00847F",
		label: "ToyyibPay",
	},
} satisfies Record<PaymentOption, { color: string; label: string }>;

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
	const accent = paymentTheme[payment] ?? paymentTheme.duitnow;
	const qrSize = isCompact ? 180 : 240;

	return (
		<main
			className={cn(
				"flex min-h-screen items-center justify-center p-4",
				isDark ? "bg-zinc-950 text-white" : "bg-white text-zinc-950",
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
					<p
						className={cn(
							"text-xs",
							isDark ? "text-zinc-300" : "text-zinc-600",
						)}
					>
						{institution.city}, {institution.state} · {accent.label}
					</p>
				</div>

				<p
					className={cn(
						"rounded-full border px-3 py-1 text-xs font-medium",
						isDark
							? "border-zinc-700 text-zinc-200"
							: "border-zinc-200 text-zinc-700",
					)}
				>
					Verified by sedekah.je
				</p>
			</section>
		</main>
	);
}

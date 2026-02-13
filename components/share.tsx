"use client";

import { slugify } from "@/lib/utils";
import { Share2 } from "lucide-react";
import { useTheme } from "next-themes";
import React, { useState } from "react";
import { Button } from "./ui/button";
import { WhatsAppIcon, XIcon } from "./ui/icons";

const SHARE_PLATFORMS = {
	X: "x",
	WHATSAPP: "whatsapp",
} as const;
type SharePlatform = keyof typeof SHARE_PLATFORMS;

export interface ShareData {
	category: string;
	name: string;
	slug?: string;
	customMessage?: string;
}

interface SharePropsPlatform {
	data: ShareData;
	platform: SharePlatform;
}

interface SharePropsNative {
	data: ShareData;
	platform?: never;
	variant?: "outline" | "secondary" | "ghost";
	className?: string;
}

type ShareProps = SharePropsPlatform | SharePropsNative;

const generateShareMessage = (data: ShareData) => {
	if (data.customMessage) {
		return data.customMessage;
	}
	const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
	const slug = data.slug ?? slugify(data.name);
	const institutionUrl = `${baseUrl}/${data.category}/${slug}`;
	return `Jom bersedekah! Dapatkan kod QR untuk ${data.name} melalui pautan di bawah. 🌟\n\n${institutionUrl}\n\nTerima kasih kerana menggunakan SedekahJe! 💖`;
};

const getShareUrl = (platform: SharePlatform, message: string) => {
	const encoded = encodeURIComponent(message);
	const isMobile =
		typeof window !== "undefined" &&
		/(android|iphone|ipad|mobile)/i.test(navigator.userAgent);

	const urls = {
		X: {
			mobile: `twitter://post?message=${encoded}`,
			desktop: `https://twitter.com/intent/tweet?text=${encoded}`,
		},
		WHATSAPP: {
			mobile: `whatsapp://send?text=${encoded}`,
			desktop: `https://web.whatsapp.com/send?text=${encoded}`,
		},
	}[platform];

	return isMobile ? urls.mobile : urls.desktop;
};

export default function Share(props: ShareProps) {
	const { data } = props;
	const { theme } = useTheme();
	const isDarkMode = theme === "dark";
	const [copied, setCopied] = useState(false);

	// Platform-specific (legacy) mode
	if ("platform" in props && props.platform) {
		const platform = props.platform;

		const handleShareClick = () => {
			if (typeof window === "undefined") return;
			const message = generateShareMessage(data);
			const url = getShareUrl(platform, message);
			window.open(url, "_blank");
		};

		return (
			<button
				type="button"
				onClick={handleShareClick}
				className="flex items-center gap-2 text-sm w-full"
			>
				{platform === "X" ? (
					<>
						<XIcon className="w-5 h-5" darkMode={isDarkMode} />
						<span>Kongsi ke X</span>
					</>
				) : (
					<>
						<WhatsAppIcon className="w-5 h-5" />
						<span>Kongsi ke WhatsApp</span>
					</>
				)}
			</button>
		);
	}

	// Native share mode (no platform)
	const handleNativeShare = async () => {
		if (typeof window === "undefined") return;

		const message = generateShareMessage(data);
		const hasCustomMessage = Boolean(data.customMessage);
		const baseUrl = window.location.origin;
		const slug = data.slug ?? slugify(data.name);
		const url = `${baseUrl}/${data.category}/${slug}`;

		if (navigator.share) {
			try {
				await navigator.share({
					title: `${data.name} — SedekahJe`,
					text: message,
					...(hasCustomMessage ? {} : { url }),
				});
				return;
			} catch (err) {
				if ((err as Error).name === "AbortError") return;
				// Fall through to copy fallback
			}
		}

		// Fallback: copy to clipboard
		try {
			const clipboardText = hasCustomMessage ? message : `${message}\n\n${url}`;
			await navigator.clipboard.writeText(clipboardText);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// Ignore clipboard errors
		}
	};

	const variant = "variant" in props ? (props.variant ?? "outline") : "outline";
	const className = "className" in props ? props.className : undefined;

	return (
		<Button
			type="button"
			variant={variant}
			size="sm"
			onClick={handleNativeShare}
			className={className ? `gap-2 ${className}` : "gap-2"}
		>
			<Share2 className="h-4 w-4" />
			{copied ? "Disalin!" : "Kongsi"}
		</Button>
	);
}

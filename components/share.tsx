import { slugify } from "@/lib/utils";
import { useTheme } from "next-themes";
import React from "react";
import { WhatsAppIcon, XIcon } from "./ui/icons";

const SHARE_PLATFORMS = {
	X: "x",
	WHATSAPP: "whatsapp",
} as const;
type SharePlatform = keyof typeof SHARE_PLATFORMS;

interface ShareData {
	category: string;
	name: string;
	slug?: string;
	customMessage?: string;
}

interface ShareProps {
	data: ShareData;
	platform: SharePlatform;
}

const isMobile = () =>
	typeof window !== "undefined" &&
	/(android|iphone|ipad|mobile)/i.test(navigator.userAgent);

const generateShareMessage = (data: ShareData) => {
	if (data.customMessage) {
		return encodeURIComponent(data.customMessage);
	}
	const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
	const slug = data.slug ?? slugify(data.name);
	const institutionUrl = `${baseUrl}/${data.category}/${slug}`;
	return encodeURIComponent(
		`Jom bersedekah! Dapatkan kod QR untuk ${data.name} melalui pautan di bawah. 🌟\n\n${institutionUrl}\n\nTerima kasih kerana menggunakan SedekahJe! 💖`,
	);
};

const PLATFORM_SHARE_URLS = {
	X: {
		mobile: (message: string) => `twitter://post?message=${message}`,
		desktop: (message: string) =>
			`https://twitter.com/intent/tweet?text=${message}`,
		fallback: (message: string) =>
			`https://twitter.com/intent/tweet?text=${message}`,
	},
	WHATSAPP: {
		mobile: (message: string) => `whatsapp://send?text=${message}`,
		desktop: (message: string) =>
			`https://web.whatsapp.com/send?text=${message}`,
		fallback: (message: string) =>
			`https://api.whatsapp.com/send?text=${message}`,
	},
};

const getShareUrl = (platform: SharePlatform, message: string) => {
	const mobile = isMobile();
	const urls = PLATFORM_SHARE_URLS[platform];

	return {
		primary: mobile ? urls.mobile(message) : urls.desktop(message),
		fallback: mobile ? urls.fallback(message) : urls.desktop(message),
	};
};

export default function Share({ data, platform }: ShareProps) {
	const { theme } = useTheme();
	const isDarkMode = theme === "dark";

	const handleShareClick = () => {
		if (typeof window === "undefined") return;

		const message = generateShareMessage(data);
		const { primary, fallback } = getShareUrl(platform, message);

		if (isMobile()) {
			window.location.href = primary; // Open mobile app
			setTimeout(() => window.open(fallback, "_blank"), 1000); // Fallback to web version
		} else {
			window.open(primary, "_blank"); // Open web version
		}
	};

	return (
		<button
			type="button"
			onClick={handleShareClick}
			className="flex items-center gap-2 text-sm"
		>
			<span>Kongsi ke</span>
			{platform === "X" ? (
				<XIcon className="w-7 h-7" darkMode={isDarkMode} />
			) : (
				<WhatsAppIcon className="w-7 h-7" />
			)}
		</button>
	);
}

/**
 * Shared contract for the public QR embed (`/embed/[slug]`).
 *
 * Both the embed page and the "Sematkan" dialog read from here so the iframe
 * dimensions advertised in the copied snippet always match what the page
 * actually renders.
 */

export const EMBED_THEMES = ["light", "dark", "auto"] as const;
export type EmbedTheme = (typeof EMBED_THEMES)[number];

export const EMBED_THEME_LABELS: Record<EmbedTheme, string> = {
	light: "Terang",
	dark: "Gelap",
	auto: "Ikut laman",
};

/**
 * Heights leave room for a two-line name plus the optional "Disahkan" badge so
 * the banner never gets clipped inside a fixed-height iframe.
 */
export const EMBED_SIZES = {
	sm: { label: "Kecil", width: 260, height: 360, tile: 196 },
	md: { label: "Sederhana", width: 300, height: 420, tile: 236 },
	lg: { label: "Besar", width: 340, height: 480, tile: 284 },
} as const;

export type EmbedSize = keyof typeof EMBED_SIZES;

export const DEFAULT_EMBED_THEME: EmbedTheme = "light";
export const DEFAULT_EMBED_SIZE: EmbedSize = "md";

export function parseEmbedTheme(value: string | undefined): EmbedTheme {
	return EMBED_THEMES.includes(value as EmbedTheme)
		? (value as EmbedTheme)
		: DEFAULT_EMBED_THEME;
}

/**
 * `compact=true` is the legacy flag emitted by older embed links (and the admin
 * export). It maps onto the small size so existing embeds keep working.
 */
export function parseEmbedSize(
	value: string | undefined,
	compact?: string,
): EmbedSize {
	// `Object.hasOwn`, not `in`: `in` walks the prototype chain, so a crafted
	// `?size=constructor` would pass and blow up on the dimension lookup.
	if (value && Object.hasOwn(EMBED_SIZES, value)) return value as EmbedSize;
	if (compact === "true") return "sm";
	return DEFAULT_EMBED_SIZE;
}

type EmbedOptions = {
	theme?: EmbedTheme;
	size?: EmbedSize;
};

export function buildEmbedPath(slug: string, options: EmbedOptions = {}) {
	const theme = options.theme ?? DEFAULT_EMBED_THEME;
	const size = options.size ?? DEFAULT_EMBED_SIZE;
	const params = new URLSearchParams();

	if (theme !== DEFAULT_EMBED_THEME) params.set("theme", theme);
	if (size !== DEFAULT_EMBED_SIZE) params.set("size", size);

	const query = params.toString();
	return `/embed/${slug}${query ? `?${query}` : ""}`;
}

export function buildEmbedUrl(
	baseUrl: string,
	slug: string,
	options: EmbedOptions = {},
) {
	return `${baseUrl.replace(/\/$/, "")}${buildEmbedPath(slug, options)}`;
}

const escapeAttribute = (value: string) =>
	value
		.replace(/&/g, "&amp;")
		.replace(/"/g, "&quot;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");

export function buildEmbedSnippet({
	url,
	name,
	size = DEFAULT_EMBED_SIZE,
}: {
	url: string;
	name: string;
	size?: EmbedSize;
}) {
	const { width, height } = EMBED_SIZES[size];

	return [
		`<iframe src="${escapeAttribute(url)}"`,
		`  title="Kod QR sedekah untuk ${escapeAttribute(name)}"`,
		`  width="${width}" height="${height}" loading="lazy"`,
		'  style="border:0;max-width:100%"></iframe>',
	].join("\n");
}

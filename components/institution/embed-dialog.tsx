"use client";

import { Check, Code2, Copy, ExternalLink } from "lucide-react";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	buildEmbedSnippet,
	buildEmbedUrl,
	DEFAULT_EMBED_SIZE,
	DEFAULT_EMBED_THEME,
	EMBED_SIZES,
	EMBED_THEME_LABELS,
	EMBED_THEMES,
	type EmbedSize,
	type EmbedTheme,
} from "@/lib/embed";
import { cn, getBaseUrl } from "@/lib/utils";

type Props = {
	slug: string;
	name: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

const SIZE_KEYS = Object.keys(EMBED_SIZES) as EmbedSize[];

const OptionButton = ({
	active,
	onClick,
	children,
}: {
	active: boolean;
	onClick: () => void;
	children: ReactNode;
}) => (
	<button
		type="button"
		onClick={onClick}
		aria-pressed={active}
		className={cn(
			"flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors",
			active
				? "border-primary bg-primary/10 text-primary"
				: "border-border text-muted-foreground hover:bg-muted",
		)}
	>
		{children}
	</button>
);

export const EmbedDialog = ({ slug, name, open, onOpenChange }: Props) => {
	const [theme, setTheme] = useState<EmbedTheme>(DEFAULT_EMBED_THEME);
	const [size, setSize] = useState<EmbedSize>(DEFAULT_EMBED_SIZE);
	const [copied, setCopied] = useState(false);

	const embedUrl = buildEmbedUrl(getBaseUrl(), slug, { theme, size });
	const snippet = buildEmbedSnippet({ url: embedUrl, name, size });
	const { width, height } = EMBED_SIZES[size];

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(snippet);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
			toast.success("Kod sematan disalin.");
		} catch (error) {
			console.error("Copy embed snippet error:", error);
			toast.error("Gagal menyalin kod sematan.");
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Code2 className="h-4 w-4" />
						Sematkan kod QR
					</DialogTitle>
					<DialogDescription>
						Salin kod di bawah dan tampal di laman web anda. Setiap sematan
						memaparkan banner &ldquo;Dikuasakan oleh sedekah.je&rdquo;.
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
					<div className="space-y-4">
						<div className="space-y-1.5">
							<p className="text-xs font-medium text-muted-foreground">Tema</p>
							<div className="flex gap-1.5">
								{EMBED_THEMES.map((option) => (
									<OptionButton
										key={option}
										active={theme === option}
										onClick={() => setTheme(option)}
									>
										{EMBED_THEME_LABELS[option]}
									</OptionButton>
								))}
							</div>
						</div>

						<div className="space-y-1.5">
							<p className="text-xs font-medium text-muted-foreground">Saiz</p>
							<div className="flex gap-1.5">
								{SIZE_KEYS.map((option) => (
									<OptionButton
										key={option}
										active={size === option}
										onClick={() => setSize(option)}
									>
										{EMBED_SIZES[option].label}
									</OptionButton>
								))}
							</div>
						</div>

						<div className="space-y-1.5">
							<p className="text-xs font-medium text-muted-foreground">
								Kod sematan ({width} × {height} px)
							</p>
							<pre className="max-h-40 overflow-auto rounded-md border bg-muted/50 p-3 text-[11px] leading-relaxed">
								<code className="whitespace-pre-wrap break-all">{snippet}</code>
							</pre>
						</div>

						<div className="flex flex-wrap gap-2">
							<Button size="sm" onClick={handleCopy} className="gap-1.5">
								{copied ? (
									<Check className="h-4 w-4" />
								) : (
									<Copy className="h-4 w-4" />
								)}
								{copied ? "Disalin" : "Salin kod"}
							</Button>
							<Button size="sm" variant="outline" asChild className="gap-1.5">
								<a href={embedUrl} target="_blank" rel="noopener noreferrer">
									<ExternalLink className="h-4 w-4" />
									Buka pratonton
								</a>
							</Button>
						</div>
					</div>

					<div className="space-y-1.5">
						<p className="text-xs font-medium text-muted-foreground">
							Pratonton
						</p>
						<iframe
							key={`${theme}-${size}`}
							src={embedUrl}
							title={`Pratonton sematan untuk ${name}`}
							width={width}
							height={height}
							className="mx-auto max-w-full rounded-lg border bg-background"
							style={{ border: 0 }}
						/>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};

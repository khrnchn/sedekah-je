"use client";

import { AnimatePresence, motion } from "framer-motion";
import html2canvas from "html2canvas";
import { DownloadIcon, Eye, MapPin, Share2, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { forwardRef, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Institution } from "@/app/types/institutions";
import Share from "@/components/share";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { useOutsideClick } from "@/hooks/use-outside-click";
import {
	getInstitutionCategoryIcon,
	getInstitutionCategoryIconDimensions,
	getInstitutionCategoryLabel,
	normalizeInstitutionCategory,
} from "@/lib/institution-categories";
import { paymentBrands } from "@/lib/payment-brands";
import { cn, slugify } from "@/lib/utils";
import { ClaimModal } from "./claim-modal";
import QrCodeDisplay from "./qr-code-display";

// power do atif
const capitalizeWords = (str: string): string => {
	return str.replace(/\S+/g, (word) => {
		// Kalau semua huruf besar atau huruf besar dengan titik (contoh: "IIUM", "W.P."), biar je
		if (/^[A-Z]+$/.test(word) || (/^[A-Z.]+$/.test(word) && word.length > 1))
			return word;
		// Kalau ada dalam kurungan (contoh: "(abc)"), apply the function recursively
		if (word.startsWith("(") && word.endsWith(")")) {
			const inner = word.slice(1, -1);
			return capitalizeWords(inner);
		}
		// Kalau ada dash (contoh: "an-nur"), capitalize kedua-dua belah perkataan
		if (word.includes("-"))
			return word
				.split("-")
				.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
				.join("-");
		// Default capitalization
		return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
	});
};

const formatDistance = (distanceInMeter?: number): string | null => {
	if (!distanceInMeter) return null;

	if (distanceInMeter >= 1000) {
		return `${(distanceInMeter / 1000).toFixed(1)} km`;
	}

	return `${Math.round(distanceInMeter)} m`;
};

const CLIPBOARD_WRITE_TIMEOUT_MS = 12_000;

const paymentLogoMap = {
	duitnow: "/icons/duitnow.png",
	tng: "/icons/tng.png",
	boost: "/icons/boost.png",
	toyyibpay: "/icons/toyyibpay-wordmark.png",
} as const;

const InstitutionCard = forwardRef<
	HTMLDivElement,
	Institution & { isClosest?: boolean; distanceToCurrentUserInMeter?: number }
>(
	(
		{
			id,
			name,
			slug,
			description,
			state,
			city,
			qrImage,
			qrContent,
			supportedPayment,
			category,
			coords,
			isClosest,
			distanceToCurrentUserInMeter,
			contributorId,
			contributorEmail,
			claimable,
		},
		ref,
	) => {
		const [active, setActive] = useState<boolean | null>(false);
		const [hasMounted, setHasMounted] = useState(false);
		const [isDownloading, setIsDownloading] = useState(false);
		const [downloadStage, setDownloadStage] = useState<string>("");
		const [showClaimModal, setShowClaimModal] = useState(false);
		const innerRef = useRef<HTMLDivElement>(null);
		const printRef = useRef<HTMLButtonElement>(null);

		const { isAuthenticated, isLoading } = useAuth();

		const capitalizedName = capitalizeWords(name);
		const capitalizedState = capitalizeWords(state);
		const capitalizedCity = capitalizeWords(city);
		const formattedDistance = formatDistance(distanceToCurrentUserInMeter);

		// Check if user can claim this institution
		// 1. User must be logged in
		// 2. Institution's contributorId must be null, OR
		// 3. Institution's contributor email must be khairin13chan@gmail.com
		const canClaim =
			hasMounted &&
			!isLoading &&
			isAuthenticated &&
			(claimable ??
				(contributorId === null ||
					contributorEmail === "khairin13chan@gmail.com"));

		const resolvedSlug = slug ?? slugify(name);
		const normalizedCategory = normalizeInstitutionCategory(category);
		const categoryIconDimensions =
			getInstitutionCategoryIconDimensions(normalizedCategory);
		const href = `/${normalizedCategory}/${resolvedSlug}`;

		useEffect(() => {
			setHasMounted(true);
		}, []);

		useEffect(() => {
			function onKeyDown(event: KeyboardEvent) {
				if (event.key === "Escape") {
					setActive(false);
				}
			}

			if (active) {
				document.body.style.overflow = "hidden";
			} else {
				document.body.style.overflow = "auto";
			}

			window.addEventListener("keydown", onKeyDown);
			return () => window.removeEventListener("keydown", onKeyDown);
		}, [active]);

		useOutsideClick(innerRef, () => setActive(false));

		const createImage = (options: { src: string }) => {
			const img = document.createElement("img");
			img.crossOrigin = "anonymous";
			if (options.src) {
				img.src = options.src;
			}
			return img;
		};

		const loadImage = (src: string) =>
			new Promise<HTMLImageElement>((resolve, reject) => {
				const img = createImage({ src });
				img.onload = () => resolve(img);
				img.onerror = reject;
			});

		const canvasToBlob = (
			canvas: HTMLCanvasElement,
			type = "image/png",
			quality = 1,
		) =>
			new Promise<Blob>((resolve, reject) => {
				canvas.toBlob(
					(blob) => {
						if (blob) {
							resolve(blob);
						} else {
							reject(new Error("Unable to create image blob"));
						}
					},
					type,
					quality,
				);
			});

		const withTimeout = async <T,>(
			promise: Promise<T>,
			message: string,
			timeoutMs = CLIPBOARD_WRITE_TIMEOUT_MS,
		) => {
			let timeoutId: number | undefined;

			try {
				return await Promise.race([
					promise,
					new Promise<never>((_resolve, reject) => {
						timeoutId = window.setTimeout(
							() => reject(new Error(message)),
							timeoutMs,
						);
					}),
				]);
			} finally {
				if (timeoutId !== undefined) {
					window.clearTimeout(timeoutId);
				}
			}
		};

		const writePngBlobToClipboard = async (pngBlob: Blob) => {
			if (!navigator.clipboard?.write || !("ClipboardItem" in window)) {
				throw new Error("Image clipboard is not supported");
			}

			await withTimeout(
				navigator.clipboard.write([
					new ClipboardItem({
						[pngBlob.type]: pngBlob,
					}),
				]),
				"Clipboard write timed out",
			);
		};

		const drawContainedImage = (
			ctx: CanvasRenderingContext2D,
			img: HTMLImageElement,
			x: number,
			y: number,
			width: number,
			height: number,
		) => {
			const ratio = Math.min(
				width / img.naturalWidth,
				height / img.naturalHeight,
			);
			const drawWidth = img.naturalWidth * ratio;
			const drawHeight = img.naturalHeight * ratio;
			ctx.drawImage(
				img,
				x + (width - drawWidth) / 2,
				y + (height - drawHeight) / 2,
				drawWidth,
				drawHeight,
			);
		};

		const renderQrContentToCanvas = async () => {
			const payment = supportedPayment?.[0];
			const brand = payment ? paymentBrands[payment] : undefined;
			const svg = printRef.current?.querySelector("svg");

			if (!svg) {
				throw new Error("QR SVG unavailable");
			}

			const canvas = document.createElement("canvas");
			const size = 600;
			const qrCardSize = 350;
			const qrSize = 250;
			const ctx = canvas.getContext("2d");

			canvas.width = size;
			canvas.height = size;

			if (!ctx) {
				throw new Error("Canvas context unavailable");
			}

			ctx.fillStyle = "#ffffff";
			ctx.fillRect(0, 0, size, size);

			ctx.fillStyle = "#111827";
			ctx.font = "700 18px sans-serif";
			ctx.textAlign = "center";
			ctx.fillText("SedekahJe", size / 2, 92);

			const cardX = (size - qrCardSize) / 2;
			const cardY = 125;
			const radius = 24;
			ctx.fillStyle = brand?.color ?? "#e5e7eb";
			ctx.beginPath();
			ctx.roundRect(cardX, cardY, qrCardSize, qrCardSize, radius);
			ctx.fill();

			if (payment && paymentLogoMap[payment]) {
				try {
					const logo = await loadImage(paymentLogoMap[payment]);
					const logoWidth = payment === "toyyibpay" ? 118 : 58;
					const logoHeight = 58;
					const logoX = (size - logoWidth) / 2;
					const logoY = cardY + 8;

					ctx.fillStyle = "#ffffff";
					ctx.beginPath();
					ctx.roundRect(
						logoX - 8,
						logoY - 4,
						logoWidth + 16,
						logoHeight + 8,
						999,
					);
					ctx.fill();

					if (payment !== "tng" && payment !== "toyyibpay") {
						ctx.fillStyle = brand?.color ?? "#e5e7eb";
						ctx.beginPath();
						ctx.arc(
							size / 2,
							logoY + logoHeight / 2,
							logoHeight / 2,
							0,
							Math.PI * 2,
						);
						ctx.fill();
					}

					drawContainedImage(ctx, logo, logoX, logoY, logoWidth, logoHeight);
				} catch (error) {
					console.error("QR logo render error:", error);
				}
			}

			const qrBackgroundSize = 282;
			const qrBackgroundX = (size - qrBackgroundSize) / 2;
			const qrBackgroundY = cardY + 52;
			ctx.fillStyle = "#ffffff";
			ctx.beginPath();
			ctx.roundRect(
				qrBackgroundX,
				qrBackgroundY,
				qrBackgroundSize,
				qrBackgroundSize,
				12,
			);
			ctx.fill();

			const qrClone = svg.cloneNode(true) as SVGElement;
			qrClone.setAttribute("width", String(qrSize));
			qrClone.setAttribute("height", String(qrSize));
			for (const element of Array.from(qrClone.querySelectorAll("*"))) {
				const fill = element.getAttribute("fill");
				if (fill && fill !== "none" && fill.toLowerCase() !== "#ffffff") {
					element.setAttribute("fill", brand?.color ?? "#111827");
				}
			}

			const serializedSvg = new XMLSerializer().serializeToString(qrClone);
			const svgBlob = new Blob([serializedSvg], {
				type: "image/svg+xml;charset=utf-8",
			});
			const svgUrl = window.URL.createObjectURL(svgBlob);

			try {
				const qrImageEl = await loadImage(svgUrl);
				ctx.drawImage(
					qrImageEl,
					(size - qrSize) / 2,
					qrBackgroundY + (qrBackgroundSize - qrSize) / 2,
					qrSize,
					qrSize,
				);
			} finally {
				window.URL.revokeObjectURL(svgUrl);
			}

			ctx.fillStyle = "#111827";
			ctx.font = "700 20px sans-serif";
			ctx.textAlign = "center";
			const maxTextWidth = 500;
			let displayName = capitalizedName;
			while (
				ctx.measureText(displayName).width > maxTextWidth &&
				displayName.length > 12
			) {
				displayName = `${displayName.slice(0, -2)}...`;
			}
			ctx.fillText(displayName, size / 2, 535);

			return canvas;
		};

		const renderBrandedQrPageToCanvas = async (
			onStage?: (stage: string) => void,
		) => {
			const iframe = document.createElement("iframe");
			iframe.style.visibility = "hidden";
			iframe.style.position = "fixed";
			iframe.style.right = "0";
			iframe.style.bottom = "0";
			iframe.width = "600px";
			iframe.height = "600px";

			const waitForIframe = new Promise<void>((resolve, reject) => {
				const timeoutId = window.setTimeout(() => {
					reject(new Error("QR page load timed out"));
				}, 8000);

				iframe.onload = () => {
					window.clearTimeout(timeoutId);
					onStage?.("Memuatkan halaman kod QR...");
					setTimeout(resolve, 1000);
				};

				iframe.onerror = () => {
					window.clearTimeout(timeoutId);
					reject(new Error("QR page failed to load"));
				};
			});

			try {
				document.body.appendChild(iframe);
				iframe.src = `${window.location.origin}/qr/${resolvedSlug}`;
				await waitForIframe;

				const documentBody = iframe.contentDocument?.body;
				if (!documentBody) {
					throw new Error("QR page unavailable");
				}

				const style = iframe.contentDocument.createElement("style");
				style.textContent = `
					html, body {
						width: 600px !important;
						height: 600px !important;
						margin: 0 !important;
						background: #ffffff !important;
						color: #111827 !important;
					}
					*, ::before, ::after {
						color: #111827 !important;
						border-color: transparent !important;
						box-shadow: none !important;
						text-shadow: none !important;
					}
				`;
				iframe.contentDocument.head.appendChild(style);

				onStage?.("Mengambil gambar kod QR...");
				return html2canvas(documentBody, {
					useCORS: true,
					allowTaint: true,
					backgroundColor: "#ffffff",
					scale: 2,
					width: 600,
					height: 600,
					windowWidth: 600,
					windowHeight: 600,
				});
			} finally {
				iframe.remove();
			}
		};

		const copyToClipboard = async (pngBlob: Blob | null) => {
			if (!pngBlob) return;
			try {
				await writePngBlobToClipboard(pngBlob);
				toast.success("Berjaya menyalin kod QR ke papan klipboard.");
			} catch (error) {
				console.error(error);
				toast.error("Gagal menyalin kod QR.");
			}
		};

		const copyCanvasToClipboard = async (canvas: HTMLCanvasElement) => {
			const pngBlob = await canvasToBlob(canvas);
			await writePngBlobToClipboard(pngBlob);
		};

		const convertToPng = (imgBlob: Blob) => {
			try {
				const canvas = document.createElement("canvas");
				const ctx = canvas.getContext("2d");
				const imageEl = createImage({
					src: window.URL.createObjectURL(imgBlob),
				});
				imageEl.onload = (e) => {
					//@ts-expect-error
					canvas.width = e.target?.width;
					//@ts-expect-error
					canvas.height = e.target?.height;
					//@ts-expect-error
					ctx?.drawImage(e.target, 0, 0, e.target?.width, e.target?.height);
					canvas.toBlob(copyToClipboard, "image/png", 1);
				};
			} catch (e) {
				console.error(e);
			}
		};

		const copyImg = async (src: string) => {
			const img = await fetch(src);
			const imgBlob = await img.blob();

			try {
				const extension = src.split(".").pop();
				if (!extension) throw new Error("No extension found");

				return convertToPng(imgBlob);
			} catch {
				console.error("Format unsupported");
			}
			return;
		};

		return (
			<>
				<AnimatePresence>
					{active && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="fixed inset-0 z-10 h-full w-full bg-transparent md:bg-foreground/20"
						/>
					)}
				</AnimatePresence>

				{/* Loading Overlay for Mobile */}
				<AnimatePresence>
					{isDownloading && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="fixed inset-0 z-50 flex h-full w-full flex-col items-center justify-center bg-foreground/50"
						>
							<div className="flex w-full max-w-xs flex-col items-center gap-4 rounded-lg border bg-card p-6 shadow-lg">
								<div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
								<p className="text-center font-medium">
									Memuat turun kod QR...
								</p>
								<p className="text-center text-sm text-muted-foreground">
									{downloadStage || "Sila tunggu sebentar"}
								</p>
							</div>
						</motion.div>
					)}
				</AnimatePresence>

				<AnimatePresence>
					{active ? (
						<div className="fixed inset-0 z-[100] grid place-items-center px-3 py-3 sm:px-4 sm:py-4">
							<motion.button
								key={`button-${name}-${id}`}
								layout
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0, transition: { duration: 0.05 } }}
								className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-md border bg-card lg:hidden"
								onClick={(e) => {
									e.stopPropagation();
									setActive(null);
								}}
							>
								<CloseIcon />
							</motion.button>
							<motion.div
								layoutId={`card-${name}-${id}`}
								ref={innerRef}
								drag
								onDragEnd={(e) => {
									e.stopPropagation();
									setActive(null);
								}}
								whileDrag={{ scale: 1.05 }}
								className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-[460px] flex-col overflow-auto rounded-lg border bg-card p-5 shadow-lg sm:max-h-[calc(100dvh-2rem)] lg:overflow-hidden"
							>
								<motion.div
									layoutId={`image-${name}-${id}`}
									className="flex items-center justify-center rounded-lg border bg-muted/40 p-3"
								>
									{qrContent ? (
										<QrCodeDisplay
											qrContent={qrContent}
											supportedPayment={supportedPayment}
											size={300}
										/>
									) : (
										<Image
											priority
											width={300}
											height={300}
											src={qrImage}
											alt={name}
											className="aspect-square w-full max-w-[300px] rounded-xl object-cover object-top"
										/>
									)}
								</motion.div>

								<div className="mt-4">
									<div className="flex justify-between items-start p-4">
										<div className="flex-1">
											<motion.h3
												layoutId={`title-${name}-${id}`}
												className="text-base font-semibold text-foreground"
											>
												{capitalizedName}
											</motion.h3>
											<motion.p
												layoutId={`location-${city}-${state}-${id}`}
												className="text-base text-muted-foreground"
											>
												{capitalizedCity}, {capitalizedState}
											</motion.p>
										</div>
										<motion.a
											layout
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											exit={{ opacity: 0 }}
											href={`https://www.google.com/maps/search/?api=1&query=${
												coords ? coords.join(",") : encodeURIComponent(name)
											}`}
											target="_blank"
											className="rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
											rel="noreferrer"
										>
											Cari di peta
										</motion.a>
									</div>
									{description ? (
										<div className="pt-4 relative px-4">
											<motion.div
												layout
												initial={{ opacity: 0 }}
												animate={{ opacity: 1 }}
												exit={{ opacity: 0 }}
												className="flex max-h-40 flex-col items-start gap-4 overflow-auto pb-10 text-xs text-muted-foreground [mask:linear-gradient(to_bottom,white,white,transparent)] [scrollbar-width:none] [-ms-overflow-style:none] [-webkit-overflow-scrolling:touch] md:max-h-60 md:text-sm lg:max-h-80 lg:text-base"
											>
												{description}
											</motion.div>
										</div>
									) : null}
								</div>
							</motion.div>
						</div>
					) : null}
				</AnimatePresence>

				<TooltipProvider>
					<motion.div
						ref={ref}
						layoutId={`card-${name}-${id}`}
						className="h-full"
					>
						<Card
							data-cat={normalizedCategory}
							className={cn(
								"relative h-full border shadow-[0_1px_2px_oklch(var(--foreground)/0.03)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_4px_12px_oklch(var(--foreground)/0.05)]",
								isClosest
									? "border-primary/35 ring-1 ring-primary/10"
									: "border-border/22 hover:border-primary/18",
							)}
						>
							<CardContent className="flex h-full flex-col items-center gap-3 p-4">
								{canClaim && (
									<div className="absolute top-2 right-2 z-10">
										<Tooltip>
											<TooltipTrigger asChild>
												<Button
													size="sm"
													variant="ghost"
													className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors duration-200 ease-out"
													onClick={(e) => {
														e.stopPropagation();
														setShowClaimModal(true);
													}}
												>
													<User className="h-3.5 w-3.5" />
													Tuntut
												</Button>
											</TooltipTrigger>
											<TooltipContent side="top">
												<p>Tuntut sebagai milik anda</p>
											</TooltipContent>
										</Tooltip>
									</div>
								)}
								{isClosest && (
									<div className="absolute top-0 left-1/2 z-10 inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full border border-primary/20 bg-card px-2.5 py-1 text-xs text-primary shadow-sm">
										<MapPin className="h-3.5 w-3.5" aria-hidden="true" />
										<span className="font-medium">Terdekat</span>
										{formattedDistance && (
											<span className="font-semibold tabular-nums">
												{formattedDistance}
											</span>
										)}
									</div>
								)}
								<Link
									href={href}
									className={cn(
										"mb-2 flex w-full flex-col items-center gap-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
										isClosest && "pt-2",
									)}
									aria-label={`Buka halaman ${capitalizedName}`}
								>
									<motion.div>
										<Image
											src={getInstitutionCategoryIcon(category)}
											alt=""
											width={categoryIconDimensions.width}
											height={categoryIconDimensions.height}
											unoptimized
											aria-hidden="true"
											style={{ height: "auto", width: "50px" }}
										/>
									</motion.div>
									<Tooltip>
										<TooltipTrigger asChild>
											<motion.h3
												layoutId={`title-${name}-${id}`}
												className="w-full truncate text-center text-base font-semibold text-foreground"
											>
												{capitalizedName}
											</motion.h3>
										</TooltipTrigger>
										<TooltipContent>
											<p>{capitalizedName}</p>
										</TooltipContent>
									</Tooltip>
									<motion.p
										layoutId={`location-${city}-${state}-${id}`}
										className="w-full truncate text-center text-sm font-medium text-muted-foreground"
									>
										{capitalizedCity}, {capitalizedState}
									</motion.p>
									<span
										data-cat={normalizedCategory}
										className="mt-0.5 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium"
										style={{
											borderColor:
												"color-mix(in oklch, var(--cat-ring) 55%, transparent)",
											backgroundColor:
												"color-mix(in oklch, var(--cat-surface) 76%, oklch(var(--card)))",
											color: "var(--cat-text)",
										}}
									>
										{getInstitutionCategoryLabel(category)}
									</span>
								</Link>
								<motion.div
									layoutId={`image-${name}-${id}`}
									className="cursor-pointer rounded-lg bg-muted/25 p-2.5 shadow-none"
								>
									{qrContent ? (
										<div className="flex aspect-square w-40 items-center justify-center">
											<QrCodeDisplay
												qrContent={qrContent}
												supportedPayment={supportedPayment}
												ref={printRef}
												name={name}
												aria-label={`Perbesarkan kod QR untuk ${capitalizedName}`}
												onClick={(e) => {
													e.stopPropagation();
													setActive(true);
												}}
											/>
										</div>
									) : (
										<button
											type="button"
											className="block aspect-square w-40 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
											aria-label={`Perbesarkan kod QR untuk ${capitalizedName}`}
											onClick={(e) => {
												e.stopPropagation();
												setActive(true);
											}}
										>
											<Image
												src={qrImage}
												alt={`QR Code for ${name}`}
												width={160}
												height={160}
												className="h-full w-full rounded-md object-cover"
											/>
										</button>
									)}
								</motion.div>
								<div className="mt-auto flex w-full justify-center gap-1.5">
									{/* Download Button */}
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												size="sm"
												variant="ghost"
												className="h-11 gap-1.5 px-2.5 hover:bg-primary/10 hover:text-primary transition-colors duration-200 ease-out"
												disabled={isDownloading}
												aria-label={`Muat turun kod QR untuk ${capitalizedName}`}
												onClick={async (e) => {
													e.stopPropagation();
													setIsDownloading(true);
													setDownloadStage("Menyediakan kod QR...");
													try {
														let canvas: HTMLCanvasElement;

														if (qrContent) {
															canvas =
																await renderBrandedQrPageToCanvas(
																	setDownloadStage,
																);
														} else {
															setDownloadStage("Mengambil gambar kod QR...");
															const imageEl = createImage({ src: qrImage });
															await new Promise((resolve, reject) => {
																imageEl.onload = resolve;
																imageEl.onerror = reject;
															});
															const imageCanvas =
																document.createElement("canvas");
															imageCanvas.width = imageEl.naturalWidth;
															imageCanvas.height = imageEl.naturalHeight;
															const ctx = imageCanvas.getContext("2d");
															if (!ctx) {
																throw new Error("Canvas context unavailable");
															}
															ctx.drawImage(imageEl, 0, 0);
															canvas = imageCanvas;
														}

														setDownloadStage(
															"Menyediakan fail untuk dimuat turun...",
														);
														const data = canvas.toDataURL("image/png");
														const link = document.createElement("a");
														link.href = data;
														link.download = `sedekahje-${resolvedSlug}.png`;
														document.body.appendChild(link);
														link.click();
														document.body.removeChild(link);
														toast.success("Berjaya memuat turun kod QR.");
													} catch (error) {
														console.error("Download error:", error);
														toast.error("Gagal memuat turun kod QR.");
													} finally {
														setIsDownloading(false);
														setDownloadStage("");
													}
												}}
											>
												{isDownloading ? (
													<div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
												) : (
													<DownloadIcon className="h-5 w-5" />
												)}
												<span className="text-xs font-medium">Muat turun</span>
											</Button>
										</TooltipTrigger>
										<TooltipContent side="top">
											<p>
												{isDownloading
													? "Sedang memuat turun..."
													: "Muat turun kod QR"}
											</p>
										</TooltipContent>
									</Tooltip>

									{/* Share Button with Dropdown */}
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												size="sm"
												variant="ghost"
												className="h-11 gap-1.5 px-2.5 hover:bg-primary/10 hover:text-primary transition-colors duration-200 ease-out"
												disabled={isDownloading}
												aria-label={`Kongsi ${capitalizedName}`}
											>
												<Share2 className="h-5 w-5" />
												<span className="text-xs font-medium">Kongsi</span>
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent
											onClick={(e) => e.stopPropagation()}
											className="animate-in fade-in zoom-in-95"
										>
											<DropdownMenuItem
												onClick={async () => {
													if (!qrContent) {
														await copyImg(qrImage);
														return;
													}

													const toastId = toast.loading("Menyalin kod QR...");
													try {
														const canvas = await renderQrContentToCanvas();
														await copyCanvasToClipboard(canvas);
														toast.success(
															"Berjaya menyalin kod QR ke papan klipboard.",
															{ id: toastId },
														);
													} catch (error) {
														console.error("Copy QR error:", error);
														toast.error("Gagal menyalin kod QR.", {
															id: toastId,
														});
													}
												}}
											>
												Salin QR
											</DropdownMenuItem>
											<DropdownMenuSeparator />
											<DropdownMenuItem>
												<Share data={{ category, name }} platform="WHATSAPP" />
											</DropdownMenuItem>
											<DropdownMenuItem>
												<Share data={{ category, name }} platform="X" />
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>

									{/* Expand Button */}
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												size="sm"
												variant="ghost"
												className="h-11 gap-1.5 px-2.5 hover:bg-primary/10 hover:text-primary transition-colors duration-200 ease-out"
												aria-label={`Perbesarkan kod QR untuk ${capitalizedName}`}
												onClick={async (e) => {
													e.stopPropagation();
													setActive(true);
												}}
											>
												<Eye className="h-5 w-5" />
												<span className="text-xs font-medium">QR</span>
											</Button>
										</TooltipTrigger>
										<TooltipContent side="top">
											<p>Perbesarkan kod QR</p>
										</TooltipContent>
									</Tooltip>
								</div>
							</CardContent>
						</Card>
					</motion.div>
				</TooltipProvider>

				{/* Claim Modal */}
				<ClaimModal
					open={showClaimModal}
					onOpenChange={setShowClaimModal}
					institutionId={id}
					institutionName={name}
				/>
			</>
		);
	},
);

InstitutionCard.displayName = "InstitutionCard";

export const CloseIcon = () => {
	return (
		<motion.svg
			name="close-icon"
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0, transition: { duration: 0.05 } }}
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className="h-4 w-4 text-foreground"
		>
			<path stroke="none" d="M0 0h24v24H0z" fill="none" />
			<path d="M18 6l-12 12" />
			<path d="M6 6l12 12" />
		</motion.svg>
	);
};

export default InstitutionCard;

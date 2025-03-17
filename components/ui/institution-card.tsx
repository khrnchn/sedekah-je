"use client";

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
import { useOutsideClick } from "@/hooks/use-outside-click";
import { cn, slugify } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import html2canvas from "html2canvas";
import { DownloadIcon, Eye, Share2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { forwardRef, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import QrCodeDisplay from "./qrCodeDisplay";

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

const InstitutionCard = forwardRef<
  HTMLDivElement,
  Institution & { isClosest?: boolean; distanceToCurrentUserInMeter?: number }
>(
  (
    {
      id,
      name,
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
    },
    ref,
  ) => {
    const [active, setActive] = useState<boolean | null>(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadStage, setDownloadStage] = useState<string>("");
    const innerRef = useRef<HTMLDivElement>(null);
    const printRef = useRef<HTMLButtonElement>(null);

    const capitalizedName = capitalizeWords(name);
    const capitalizedState = capitalizeWords(state);
    const capitalizedCity = capitalizeWords(city);

    const router = useRouter();
    const navigateToItem = (category: string, slug: string) => {
      router.push(`/${category}/${slug}`);
    };

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
      if (options.src) {
        img.src = options.src;
      }
      return img;
    };

    const copyToClipboard = async (pngBlob: Blob | null) => {
      if (!pngBlob) return;
      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            [pngBlob.type]: pngBlob,
          }),
        ]);
        toast.success("Berjaya menyalin kod QR ke papan klipboard.");
      } catch (error) {
        console.error(error);
        toast.error("Gagal menyalin kod QR.");
      }
    };

    const convertToPng = (imgBlob: Blob) => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const imageEl = createImage({
          src: window.URL.createObjectURL(imgBlob),
        });
        imageEl.onload = (e) => {
          //@ts-ignore
          canvas.width = e.target?.width;
          //@ts-ignore
          canvas.height = e.target?.height;
          //@ts-ignore
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
      } catch (e) {
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
              className="fixed inset-0 h-full w-full z-10 md:bg-black/20 bg-transparent"
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
              className="fixed inset-0 h-full w-full z-50 bg-black/50 flex flex-col items-center justify-center"
            >
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-xs w-full flex flex-col items-center gap-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-center font-medium">Memuat turun kod QR...</p>
                <p className="text-center text-sm text-gray-500 dark:text-gray-400">{downloadStage || "Sila tunggu sebentar"}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {active ? (
            <div className="fixed inset-0 grid place-items-center z-[100]">
              <motion.button
                key={`button-${name}-${id}`}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.05 } }}
                className="flex absolute top-2 right-2 lg:hidden items-center justify-center bg-white dark:bg-slate-800 rounded-full h-6 w-6 z-10"
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
                className="w-full max-w-[500px] h-full md:h-fit p-5 md:max-h-[90%] flex flex-col bg-white dark:bg-slate-800 sm:rounded-3xl overflow-auto lg:overflow-hidden"
              >
                <motion.div
                  layoutId={`image-${name}-${id}`}
                  className="flex items-center justify-center"
                >
                  {qrContent ? (
                    <QrCodeDisplay
                      qrContent={qrContent}
                      supportedPayment={supportedPayment}
                      size={500}
                    />
                  ) : (
                    <Image
                      priority
                      width={200}
                      height={200}
                      src={qrImage}
                      alt={name}
                      className="w-full h-full lg:h-full sm:rounded-tr-lg sm:rounded-tl-lg object-cover object-top"
                    />
                  )}
                </motion.div>

                <div className="mt-4">
                  <div className="flex justify-between items-start p-4">
                    <div className="flex-1">
                      <motion.h3
                        layoutId={`title-${name}-${id}`}
                        className="font-medium text-neutral-700 dark:text-neutral-200 text-base"
                      >
                        {capitalizedName}
                      </motion.h3>
                      <motion.p
                        layoutId={`location-${city}-${state}-${id}`}
                        className="text-neutral-600 dark:text-neutral-400 text-base"
                      >
                        {capitalizedCity}, {capitalizedState}
                      </motion.p>
                    </div>
                    <motion.a
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      href={`https://www.google.com/maps/search/?api=1&query=${coords ? coords.join(",") : encodeURIComponent(name)
                        }`}
                      target="_blank"
                      className="px-4 py-3 text-sm rounded-full font-bold bg-green-500 text-white"
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
                        className="text-neutral-600 text-xs md:text-sm lg:text-base max-h-40 md:max-h-60 lg:max-h-80 pb-10 flex flex-col items-start gap-4 overflow-auto dark:text-neutral-400 [mask:linear-gradient(to_bottom,white,white,transparent)] [scrollbar-width:none] [-ms-overflow-style:none] [-webkit-overflow-scrolling:touch]"
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
          <motion.div ref={ref} layoutId={`card-${name}-${id}`}>
            <Card
              className={cn(
                "relative group border-4 border-transparent shadow-lg dark:shadow-muted/50 cursor-pointer hover:shadow-xl transition-all duration-200 ease-in-out",
                "hover:bg-gray-100 dark:hover:bg-zinc-800",
                isClosest
                  ? "border-[hsl(var(--primary))] animate-pulse-subtle"
                  : "",
              )}
              onClick={() => navigateToItem(category, slugify(name))}
            >
              <CardContent className="flex flex-col items-center gap-2 p-4 h-full">
                {isClosest && (
                  <div className="absolute -top-3 left-4 shadow-lg">
                    <div className="relative">
                      <div className="absolute inset-0 blur-sm bg-[hsl(var(--primary)/0.9)] rounded-full" />
                      <div className="relative bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] py-1 px-3 rounded-full text-xs font-semibold flex items-center gap-1.5 text-white">
                        <span className="animate-ping absolute h-2 w-2 rounded-full bg-[hsl(var(--primary)/0.7)] opacity-75" />
                        <span className="relative h-2 w-2 rounded-full bg-[hsl(var(--primary)/0.9)]" />
                        Yang terdekat
                        {distanceToCurrentUserInMeter && (
                          <span className="font-medium">
                            •{" "}
                            {distanceToCurrentUserInMeter > 1000
                              ? `${(
                                distanceToCurrentUserInMeter / 1000
                              ).toFixed(1)}km`
                              : `${Math.round(distanceToCurrentUserInMeter)}m`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex flex-col items-center gap-1 mb-2 w-full">
                  <motion.div>
                    <Image
                      src={
                        category === "mosque"
                          ? "/masjid/masjid-figma.svg"
                          : category === "surau"
                            ? "/surau/surau-figma.svg"
                            : "/lain/lain-figma.svg"
                      }
                      alt="category logo"
                      width={50}
                      height={50}
                    />
                  </motion.div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.h3
                        layoutId={`title-${name}-${id}`}
                        className="text-lg font-semibold text-foreground truncate w-full text-center"
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
                    className="text-sm text-cyan-500 truncate w-full text-center font-medium"
                  >
                    {capitalizedCity}, {capitalizedState}
                  </motion.p>
                </div>
                <motion.div
                  layoutId={`image-${name}-${id}`}
                  className="cursor-pointer"
                >
                  {qrContent ? (
                    <QrCodeDisplay
                      qrContent={qrContent}
                      supportedPayment={supportedPayment}
                      ref={printRef}
                      name={name}
                    />
                  ) : (
                    <Image
                      src={qrImage}
                      alt={`QR Code for ${name}`}
                      width={160}
                      height={160}
                      className="rounded-lg h-40 object-cover"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActive(true);
                      }}
                    />
                  )}
                </motion.div>
                <div className="flex gap-2 mt-auto">
                  {/* Download Button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="hover:bg-primary/10 hover:text-primary transition-colors duration-200 ease-in-out"
                        disabled={isDownloading}
                        onClick={async (e) => {
                          e.stopPropagation();
                          setIsDownloading(true);
                          setDownloadStage("Menyediakan kod QR...");

                          // Set a master timeout to prevent infinite loading
                          const masterTimeoutId = setTimeout(() => {
                            setIsDownloading(false);
                            setDownloadStage("");
                            toast.error("Masa tamat. Sila cuba lagi.");
                          }, 15000); // 15 seconds maximum for the whole operation

                          // Check if this is a mobile device
                          const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

                          // Define the direct capture method
                          async function handleDirectCapture() {
                            setDownloadStage("Mengambil gambar kod QR secara langsung...");
                            const element = printRef.current;
                            if (!element) {
                              throw new Error("QR element not found");
                            }

                            const canvas = await html2canvas(element, {
                              useCORS: true,
                              allowTaint: true,
                              backgroundColor: "#ffffff",
                              scale: 2,
                              logging: false,
                            });

                            setDownloadStage("Menyediakan fail untuk dimuat turun...");

                            // For iOS Safari, we need to handle download differently
                            if (/iPhone|iPad|iPod/i.test(navigator.userAgent) && /Safari/i.test(navigator.userAgent)) {
                              // Create a temporary anchor that opens in a new tab
                              const data = canvas.toDataURL("image/png");
                              const newTab = window.open();
                              if (!newTab) {
                                throw new Error("Popup blocked. Please allow popups for this site.");
                              }

                              newTab.document.write(`
                                <html>
                                  <head>
                                    <title>Kod QR untuk ${name}</title>
                                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                    <style>
                                      body { margin: 0; padding: 20px; text-align: center; font-family: system-ui, sans-serif; }
                                      img { max-width: 100%; height: auto; }
                                      .instructions { margin-top: 20px; color: #555; }
                                    </style>
                                  </head>
                                  <body>
                                    <h3>Kod QR untuk ${name}</h3>
                                    <img src="${data}" alt="QR Code">
                                    <p class="instructions">Tekan lama pada imej dan pilih "Simpan Imej" untuk muat turun.</p>
                                  </body>
                                </html>
                              `);
                              newTab.document.close();
                              toast.success("Berjaya memuat turun kod QR. Sila simpan imej.");
                              return;
                            }

                            // For other browsers, use the standard download method
                            const data = canvas.toDataURL("image/png");
                            const link = document.createElement("a");
                            link.href = data;
                            link.download = `sedekahje-${slugify(name)}.png`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);

                            toast.success("Berjaya memuat turun kod QR.");
                          }

                          // Special handling for mobile browsers that don't support our main methods
                          async function handleMobileAlternative() {
                            setDownloadStage("Mencuba kaedah alternatif untuk peranti mudah alih...");
                            const element = printRef.current;
                            if (!element) {
                              throw new Error("QR element not found");
                            }

                            // Try a different approach to render and capture
                            const tempDiv = document.createElement("div");
                            tempDiv.style.position = "absolute";
                            tempDiv.style.left = "-9999px";
                            tempDiv.style.top = "-9999px";

                            // Clone the QR code element
                            const clone = element.cloneNode(true) as HTMLElement;
                            clone.style.width = "300px";
                            clone.style.height = "300px";
                            tempDiv.appendChild(clone);
                            document.body.appendChild(tempDiv);

                            try {
                              // Capture the isolated element
                              const canvas = await html2canvas(clone, {
                                useCORS: true,
                                allowTaint: true,
                                backgroundColor: "#ffffff",
                                scale: 2,
                                logging: false,
                              });

                              // For iOS Safari, open in new tab for saving
                              if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                                const data = canvas.toDataURL("image/png");
                                const newTab = window.open();
                                if (!newTab) {
                                  throw new Error("Popup blocked. Please allow popups for this site.");
                                }

                                newTab.document.write(`
                                  <html>
                                    <head>
                                      <title>Kod QR untuk ${name}</title>
                                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                      <style>
                                        body { margin: 0; padding: 20px; text-align: center; font-family: system-ui, sans-serif; }
                                        img { max-width: 100%; height: auto; }
                                        .instructions { margin-top: 20px; color: #555; }
                                      </style>
                                    </head>
                                    <body>
                                      <h3>Kod QR untuk ${name}</h3>
                                      <img src="${data}" alt="QR Code">
                                      <p class="instructions">Tekan lama pada imej dan pilih "Simpan Imej" untuk muat turun.</p>
                                    </body>
                                  </html>
                                `);
                                newTab.document.close();
                                toast.success("Berjaya memuat turun kod QR. Sila simpan imej.");
                              } else {
                                // For other mobile browsers
                                const data = canvas.toDataURL("image/png");
                                const link = document.createElement("a");
                                link.href = data;
                                link.download = `sedekahje-${slugify(name)}.png`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                toast.success("Berjaya memuat turun kod QR.");
                              }
                            } finally {
                              // Clean up
                              if (document.body.contains(tempDiv)) {
                                document.body.removeChild(tempDiv);
                              }
                            }
                          }

                          // Define the iframe method as a fallback only for desktop browsers
                          async function handleIframeCapture() {
                            // Create a temporary iframe to load the QR page
                            const iframe = document.createElement("iframe");
                            iframe.style.visibility = "hidden";
                            iframe.style.position = "fixed";
                            iframe.style.right = "0";
                            iframe.style.bottom = "0";
                            iframe.width = "600px";
                            iframe.height = "600px";

                            // Set the source to the QR page URL
                            const qrPageUrl = `${window.location.origin}/qr/${slugify(name)}`;
                            console.log("Loading QR page:", qrPageUrl);
                            iframe.src = qrPageUrl;

                            document.body.appendChild(iframe);

                            try {
                              // Wait for iframe to load with timeout
                              await new Promise<void>((resolve, reject) => {
                                const iframeTimeoutId = setTimeout(() => {
                                  reject(new Error("Iframe loading timed out"));
                                }, 5000);

                                iframe.onload = () => {
                                  setDownloadStage("Memuatkan halaman kod QR...");
                                  clearTimeout(iframeTimeoutId);
                                  setTimeout(() => { resolve(); }, 1000);
                                };

                                iframe.onerror = () => {
                                  clearTimeout(iframeTimeoutId);
                                  reject(new Error("Iframe failed to load"));
                                };
                              });

                              if (!iframe.contentDocument || !iframe.contentDocument.body) {
                                throw new Error("Cannot access iframe content");
                              }

                              // Capture the iframe content
                              setDownloadStage("Mengambil gambar kod QR...");
                              const canvas = await html2canvas(iframe.contentDocument.body, {
                                useCORS: true,
                                allowTaint: true,
                                backgroundColor: "#ffffff",
                                scale: 2,
                                logging: false,
                              });

                              // Convert to downloadable image
                              setDownloadStage("Menyediakan fail untuk dimuat turun...");
                              const data = canvas.toDataURL("image/png");
                              const link = document.createElement("a");
                              link.href = data;
                              link.download = `sedekahje-${slugify(name)}.png`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);

                              toast.success("Berjaya memuat turun kod QR.");
                            } finally {
                              // Always remove the iframe
                              if (document.body.contains(iframe)) {
                                document.body.removeChild(iframe);
                              }
                            }
                          }

                          try {
                            // For mobile devices, try Web Share API first if available
                            if (isMobile && navigator.share && navigator.canShare) {
                              try {
                                setDownloadStage("Menyediakan perkongsian kod QR...");
                                const element = printRef.current;
                                if (!element) {
                                  throw new Error("QR element not found");
                                }

                                // Capture image
                                const canvas = await html2canvas(element, {
                                  useCORS: true,
                                  allowTaint: true,
                                  backgroundColor: "#ffffff",
                                  scale: 2,
                                });

                                // Convert to blob for sharing
                                const blob = await new Promise<Blob>((resolve, reject) => {
                                  canvas.toBlob((blob) => {
                                    if (blob) resolve(blob);
                                    else reject(new Error("Failed to create image blob"));
                                  }, "image/png", 0.8);
                                });

                                // Create file from blob
                                const file = new File([blob], `sedekahje-${slugify(name)}.png`, { type: "image/png" });

                                // Check if we can share this file
                                const shareData = { files: [file], title: `Kod QR untuk ${name}` };

                                if (navigator.canShare(shareData)) {
                                  await navigator.share(shareData);
                                  toast.success("Kod QR telah dikongsi.");
                                  clearTimeout(masterTimeoutId);
                                  setIsDownloading(false);
                                  setDownloadStage("");
                                  return;
                                }
                              } catch (shareError) {
                                console.error("Share error:", shareError);
                                // Continue to fallback methods if sharing fails
                              }
                            }

                            // Try direct capture method for all devices
                            try {
                              await handleDirectCapture();
                              clearTimeout(masterTimeoutId);
                              setIsDownloading(false);
                              setDownloadStage("");
                              return;
                            } catch (directCaptureError) {
                              console.error("Direct capture error:", directCaptureError);

                              // On mobile, try alternative mobile approach
                              if (isMobile) {
                                try {
                                  await handleMobileAlternative();
                                  clearTimeout(masterTimeoutId);
                                  setIsDownloading(false);
                                  setDownloadStage("");
                                  return;
                                } catch (mobileAltError) {
                                  console.error("Mobile alternative error:", mobileAltError);
                                }
                              } else {
                                // On desktop, try iframe method
                                try {
                                  await handleIframeCapture();
                                  clearTimeout(masterTimeoutId);
                                  setIsDownloading(false);
                                  setDownloadStage("");
                                  return;
                                } catch (iframeError) {
                                  console.error("Iframe capture error:", iframeError);
                                }
                              }
                            }

                            // If we get here, all methods failed
                            toast.error("Gagal memuat turun kod QR. Sila cuba lagi.");
                          } catch (error) {
                            console.error("Download error:", error);
                            toast.error("Gagal memuat turun kod QR. Sila cuba lagi.");
                          } finally {
                            clearTimeout(masterTimeoutId);
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
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>{isDownloading ? "Sedang memuat turun..." : "Muat turun kod QR"}</p>
                    </TooltipContent>
                  </Tooltip>

                  {/* Share Button with Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="hover:bg-primary/10 hover:text-primary transition-colors duration-200 ease-in-out"
                        disabled={isDownloading}
                      >
                        <Share2 className="h-5 w-5" />
                        <span className="sr-only">Kongsi</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      onClick={(e) => e.stopPropagation()}
                      className="animate-in fade-in zoom-in-95"
                    >
                      <DropdownMenuItem
                        onClick={async () => {
                          if (!qrContent) {
                            copyImg(qrImage);
                            return;
                          }

                          const element = printRef.current;
                          const canvas = await html2canvas(
                            element as HTMLButtonElement,
                          );

                          const data = canvas.toDataURL("image/jpg");
                          const blob = await fetch(data).then((res) =>
                            res.blob(),
                          );

                          copyToClipboard(blob);
                          return;
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
                        size="icon"
                        variant="ghost"
                        className="hover:bg-primary/10 hover:text-primary transition-colors duration-200 ease-in-out"
                        onClick={async (e) => {
                          e.stopPropagation();
                          setActive(true);
                        }}
                      >
                        <Eye className="h-5 w-5" />
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
      className="h-4 w-4 text-black dark:text-neutral-200"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M18 6l-12 12" />
      <path d="M6 6l12 12" />
    </motion.svg>
  );
};

export default InstitutionCard;

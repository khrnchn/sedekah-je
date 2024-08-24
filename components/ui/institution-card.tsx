"use client";

import type { Institution } from "@/app/types/institutions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useOutsideClick } from "@/hooks/use-outside-click";
import { AnimatePresence, motion } from "framer-motion";
import html2canvas from "html2canvas";
import { DownloadIcon, Share2 } from "lucide-react";
import Image from "next/image";
import type React from "react";
import {
  forwardRef,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import CategoryLabel from "./category-label";
import QrCodeDisplay from "./qrCodeDisplay";

const capitalizeWords = (str: string): string => {
  return str.replace(/\S+/g, word => {
    // Kalau semua huruf besar atau huruf besar dengan titik (contoh: "IIUM", "W.P."), biar je
    if (/^[A-Z]+$/.test(word) || (/^[A-Z.]+$/.test(word) && word.length > 1)) return word;
    // Kalau ada dalam kurungan (contoh: "(abc)"), apply the function recursively
    if (word.startsWith('(') && word.endsWith(')')) {
      const inner = word.slice(1, -1);
      return capitalizeWords(inner);
    }
    // Kalau ada dash (contoh: "an-nur"), capitalize kedua-dua belah perkataan
    if (word.includes('-')) return word.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('-');
    // Default capitalization
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
};

const InstitutionCard = forwardRef<HTMLDivElement, Institution>(
  (
    { id, name, description, state, city, qrImage, qrContent, supportedPayment, category, coords },
    ref,
  ) => {
    const [active, setActive] = useState<boolean | null>(false);
    const innerRef = useRef<HTMLDivElement>(null);
    const printRef = useRef<HTMLButtonElement>(null);

    const capitalizedName = capitalizeWords(name);
    const capitalizedState = capitalizeWords(state);
    const capitalizedCity = capitalizeWords(city);

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

    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    const createImage = (options: any) => {
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
        toast.success("Berjaya menyalin kod QR ke papan keratan.");
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
                onClick={() => setActive(null)}
              >
                <CloseIcon />
              </motion.button>
              <motion.div
                layoutId={`card-${name}-${id}`}
                ref={innerRef}
                drag
                onDragEnd={() => setActive(false)}
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
                        layoutId={`location-${location}-${id}`}
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
                      href={`https://www.google.com/maps/search/?api=1&query=${coords ? coords.join(',') : encodeURIComponent(name)}`}
                      target="_blank"
                      className="px-4 py-3 text-sm rounded-full font-bold bg-green-500 text-white"
                      rel="noreferrer"
                    >
                      Cari di peta
                    </motion.a>
                  </div>
                  {description ? (
                    <div className="pt-4 relative px-4" >
                      <motion.div
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-neutral-600 text-xs md:text-sm lg:text-base max-h-40 md:max-h-60 lg:max-h-80 pb-10 flex flex-col items-start gap-4 overflow-auto dark:text-neutral-400 [mask:linear-gradient(to_bottom,white,white,transparent)] [scrollbar-width:none] [-ms-overflow-style:none] [-webkit-overflow-scrolling:touch]"
                      >
                        {description}
                      </motion.div>
                    </div>) : null}
                </div>
              </motion.div>
            </div>
          ) : null}
        </AnimatePresence>

        <TooltipProvider>
          <motion.div ref={ref} layoutId={`card-${name}-${id}`}>
            <Card className="group">
              <CardContent className="flex flex-col items-center gap-2 p-4 h-full">
                <div className="flex flex-col items-center gap-1 mb-2 w-full">
                  <motion.div>
                    <CategoryLabel category={category} />
                  </motion.div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.h3
                        layoutId={`title-${name}-${id}`}
                        className="text-lg font-semibold text-green-600 truncate w-full text-center"
                      >
                        {capitalizedName}
                      </motion.h3>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{capitalizedName}</p>
                    </TooltipContent>
                  </Tooltip>
                  <motion.p
                    layoutId={`location-${location}-${id}`}
                    className="text-sm text-muted-foreground truncate w-full text-center"
                  >
                    {capitalizedCity}, {capitalizedState}
                  </motion.p>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.div
                      layoutId={`image-${name}-${id}`}
                      className="cursor-pointer"
                    >
                      {qrContent ? (
                        <QrCodeDisplay
                          qrContent={qrContent}
                          supportedPayment={supportedPayment}
                          onClick={() => setActive(true)}
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
                          onClick={() => setActive(true)}
                        />
                      )}
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Klik untuk maklumat lanjut</p>
                  </TooltipContent>
                </Tooltip>
                <div className="flex gap-2 mt-auto">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="hover:bg-muted/50 focus:bg-muted/50 hover:scale-105 transition-transform duration-200 ease-in-out"
                        onClick={async () => {
                          try {
                            if (!qrContent) {
                              const blob = await fetch(qrImage).then((res) =>
                                res.blob(),
                              );
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");

                              a.href = url;
                              a.download = `${name.toLowerCase().replace(/\s/g, "-")}.png`;
                              a.click();
                              URL.revokeObjectURL(url);
                            } else {
                              const element = printRef.current;
                              const canvas = await html2canvas(
                                element as HTMLButtonElement,
                              );

                              const data = canvas.toDataURL("image/jpg");
                              const link = document.createElement("a");

                              link.href = data;
                              link.download = `${name.toLowerCase().replace(/\s/g, "-")}.png`;

                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }
                            toast.success("Berjaya memuat turun kod QR!");
                          } catch (error) {
                            toast.error("Gagal memuat turun kod QR.");
                          }
                        }}
                      >
                        <DownloadIcon className="h-5 w-5 text-green-600" />
                        <span className="sr-only">Muat turun kod QR</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Muat turun kod QR</p>
                    </TooltipContent>
                  </Tooltip>

                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="hover:bg-muted/50 focus:bg-muted/50 hover:scale-105 transition-transform duration-200 ease-in-out"
                      >
                        <Share2 className="h-5 w-5 text-green-600" />
                        <span className="sr-only">Muat turun kod QR</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
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
                      {/*
                    TODO: Implement sharing feature
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Kongsi ke WhatsApp</DropdownMenuItem>
                    <DropdownMenuItem>Kongsi ke X</DropdownMenuItem>
                    */}
                    </DropdownMenuContent>
                  </DropdownMenu>
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

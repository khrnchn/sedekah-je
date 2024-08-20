"use client";

import type { Institution } from "@/app/types/institutions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useOutsideClick } from "@/hooks/use-outside-click";
// import { TwitterIcon } from "./icons";
import { AnimatePresence, motion } from "framer-motion";
import html2canvas from "html2canvas";
import { CopyIcon, DownloadIcon } from "lucide-react";
import Image from "next/image";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import CategoryLabel from "./category-label";
import QrCodeDisplay from "./qrCodeDisplay";

const capitalizeWords = (str: string) => {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const InstitutionCard: React.FC<Institution> = ({
  id,
  name,
  location,
  image,
  qrContent,
  supportedPayment,
  category,
}) => {
  const [active, setActive] = useState<boolean | null>(false);
  const ref = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLButtonElement>(null);

  const capitalizedName = capitalizeWords(name);
  const capitalizedLocation = capitalizeWords(location);

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

  useOutsideClick(ref, () => setActive(false));

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
              className="flex absolute top-2 right-2 lg:hidden items-center justify-center bg-white rounded-full h-6 w-6 z-10"
              onClick={() => setActive(null)}
            >
              <CloseIcon />
            </motion.button>
            <motion.div
              layoutId={`card-${name}-${id}`}
              ref={ref}
              drag
              onDragEnd={() => setActive(false)}
              whileDrag={{ scale: 1.05 }}
              className="w-full max-w-[500px] h-full md:h-fit p-5 md:max-h-[90%] flex flex-col bg-white sm:rounded-3xl overflow-auto lg:overflow-hidden"
            >
              <motion.div
                layoutId={`image-${name}-${id}`}
                className="flex items-center justify-center "
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
                    src={image}
                    alt={name}
                    className="w-full h-full lg:h-full sm:rounded-tr-lg sm:rounded-tl-lg object-cover object-top"
                  />
                )}
              </motion.div>

              <div>
                <div className="flex justify-between items-start p-4">
                  <div>
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
                      {capitalizedLocation}
                    </motion.p>
                  </div>
                  <motion.a
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`}
                    target="_blank"
                    className="px-4 py-3 text-sm rounded-full font-bold bg-green-500 text-white"
                    rel="noreferrer"
                  >
                    Cari di peta
                  </motion.a>
                </div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <motion.div layoutId={`card-${name}-${id}`}>
        <Card className="group">
          <CardContent className="flex flex-col items-center gap-2 p-4 h-full">
            <div className="flex flex-col items-center gap-1 mb-2 w-full">
              <motion.div>
                <CategoryLabel category={category} />
              </motion.div>
              <TooltipProvider>
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
              </TooltipProvider>
              <motion.p
                layoutId={`location-${location}-${id}`}
                className="text-sm text-muted-foreground truncate w-full text-center"
              >
                {capitalizedLocation}
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
                        onClick={() => setActive(true)}
                        ref={printRef}
                        name={name}
                      />
                    ) : (
                      <Image
                        src={image}
                        alt={`QR Code for ${name}`}
                        width={160}
                        height={160}
                        className="rounded-lg h-40 object-cover"
                        onClick={() => setActive(true)}
                      />
                    )}
                  </motion.div>
            <div className="flex gap-2 mt-auto">
              <Button
                size="icon"
                variant="ghost"
                      className="hover:bg-muted/50 focus:bg-muted/50 hover:scale-105 transition-transform duration-200 ease-in-out"
                      // TODO
                      // onClick=
                    >
                <CopyIcon className="h-5 w-5 text-green-600" />
                <span className="sr-only">Copy QR code link</span>
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="hover:bg-muted/50 focus:bg-muted/50 hover:scale-105 transition-transform duration-200 ease-in-out"
                      onClick={async () => {
                        if (!qrContent) {
                          const blob = await fetch(
                            qrContent ? qrContent : image,
                          ).then((res) => res.blob());
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");

                          a.href = url;
                          a.download = `${name.toLowerCase().replace(/\s/g, "-")}.png`;
                          a.click();
                          URL.revokeObjectURL(url);
                          return;
                        }

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
                        return;
                      }}
                    >
                      <DownloadIcon className="h-5 w-5 text-green-600" />
                      <span className="sr-only">Download QR code</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Download QR Code</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {/* <Button
                size="icon"
                variant="ghost"
                className="group-hover:bg-muted/50 group-focus:bg-muted/50 hover:scale-105 transition-transform duration-200 ease-in-out"
              >
                <TwitterIcon className="h-5 w-5 text-green-600" />
                <span className="sr-only">Share on Twitter</span>
              </Button> */}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
};

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
      className="h-4 w-4 text-black"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M18 6l-12 12" />
      <path d="M6 6l12 12" />
    </motion.svg>
  );
};

export default InstitutionCard;

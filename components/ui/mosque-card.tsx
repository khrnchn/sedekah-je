"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CopyIcon, DownloadIcon } from "lucide-react";
import Image from "next/image";
import { TwitterIcon } from "./icons";
import { AnimatePresence, motion } from "framer-motion";
import { useOutsideClick } from "@/hooks/use-outside-click";

const MosqueCard: React.FC<Mosque> = ({ name, location, image }) => {
  const [active, setActive] = useState<boolean | null>(false);
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);

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
            className="fixed inset-0 bg-black/20 h-full w-full z-10"
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
              className="flex absolute top-2 right-2 lg:hidden items-center justify-center bg-white rounded-full h-6 w-6"
              onClick={() => setActive(null)}
            >
              <CloseIcon />
            </motion.button>
            <motion.div
              layoutId={`card-${name}-${id}`}
              ref={ref}
              className="w-full max-w-[500px] h-full md:h-fit md:max-h-[90%] flex flex-col bg-white dark:bg-neutral-900 sm:rounded-3xl overflow-auto lg:overflow-hidden"
            >
              <motion.div layoutId={`image-${name}-${id}`}>
                <Image
                  priority
                  width={200}
                  height={200}
                  src={image}
                  alt={name}
                  className="w-full h-full lg:h-full sm:rounded-tr-lg sm:rounded-tl-lg object-cover object-top"
                />
              </motion.div>

              <div>
                <div className="flex justify-between items-start p-4">
                  <div>
                    <motion.h3
                      layoutId={`title-${name}-${id}`}
                      className="font-medium text-neutral-700 dark:text-neutral-200 text-base"
                    >
                      {name}
                    </motion.h3>
                    <motion.p
                      layoutId={`location-${location}-${id}`}
                      className="text-neutral-600 dark:text-neutral-400 text-base"
                    >
                      {location}
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
                  >
                    Go to map
                  </motion.a>
                </div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <motion.div
        layoutId={`card-${name}-${id}`}
      >
        <Card className="group " >
          <CardContent className="flex flex-col items-center gap-4 p-6 h-full">
            <div className="flex flex-col items-center gap-2 h-20">
              <motion.h3
                layoutId={`title-${name}-${id}`}
                className="text-lg font-semibold text-green-600"
              >
                {name}
              </motion.h3>
              <motion.p
                layoutId={`location-${location}-${id}`}
                className="text-sm text-muted-foreground"
              >
                {location}
              </motion.p>
            </div>
            <motion.div layoutId={`image-${name}-${id}`} className="cursor-pointer">
              <Image
                src={image}
                alt={`QR Code for ${name}`}
                width={160}
                height={160}
                className="rounded-lg h-40 object-cover"
                onClick={() => setActive(true)}
              />
            </motion.div>
            <div className="flex gap-2 mt-auto">
              <Button
                size="icon"
                variant="ghost"
                className="group-hover:bg-muted/50 group-focus:bg-muted/50 hover:scale-105 transition-transform duration-200 ease-in-out"
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
                      className="group-hover:bg-muted/50 group-focus:bg-muted/50 hover:scale-105 transition-transform duration-200 ease-in-out"
                      onClick={async () => {
                        const blob = await fetch(image).then((res) => res.blob());
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `${name.toLowerCase().replace(/\s/g, "-")}.png`;
                        a.click();
                      }}
                    >
                      <DownloadIcon
                        className="h-5 w-5 text-green-600"
                      />
                      <span className="sr-only">Download QR code</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Download QR Code</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button
                size="icon"
                variant="ghost"
                className="group-hover:bg-muted/50 group-focus:bg-muted/50 hover:scale-105 transition-transform duration-200 ease-in-out"
              >
                <TwitterIcon className="h-5 w-5 text-green-600" />
                <span className="sr-only">Share on Twitter</span>
              </Button>
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

export default MosqueCard;

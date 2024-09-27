"use client";

import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";

import html2canvas from "html2canvas";
import { institutions } from "@/app/data/institutions";
import { QRCodeSVG } from "qrcode.react";
import { slugify } from "@/lib/utils";

function QRSlug({ params }: { params: { slug: string } }) {
  const [url, setUrl] = useState("");
  const qrCanvasRef = useRef<HTMLDivElement>(null);

  const selected = institutions.find((i) => slugify(i.name) === params.slug);

  useEffect(() => {
    if (!url) {
      void generateDownloadUrl();
    }
  }, [url]);

  const generateDownloadUrl = async () => {
    if (!qrCanvasRef.current) return;
    const canvas = await html2canvas(qrCanvasRef.current);
    const dataUrl = canvas.toDataURL("image/png");
    setUrl(dataUrl);
  };

  // make typescript happy
  if (!selected?.qrContent) return null;
  if (!selected?.supportedPayment) return null;

  const type = selected.supportedPayment[0] as "duitnow" | "boost" | "tng";

  const map = {
    duitnow: {
      color: "#ED2C66",
      bgColor: "bg-[#ED2C66]",
      logo: "/icons/duitnow.png",
    },
    boost: {
      color: "#EE2E24",
      bgColor: "bg-[#EE2E24]",
      logo: "/icons/boost.png",
    },
    tng: {
      color: "#015ABF",
      bgColor: "bg-[#015ABF]",
      logo: "/icons/square-tng.png",
    },
  };

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center">
      <div className="mb-4 flex flex-col items-center justify-center space-y-2">
        <Image
          alt=""
          src="/masjid.svg"
          className="h-10 w-10"
          width={100}
          height={100}
        />
        <p className="text-sm font-bold">SedekahJe</p>
      </div>
      <div className="h-[350px] w-[350px]" ref={qrCanvasRef}>
        <div
          className={`relative flex h-full w-full items-center justify-center rounded-2xl ${map[type].bgColor}`}
        >
          <div className="absolute top-0 mt-2 rounded-full bg-white p-2">
            <Image
              src={map[type].logo}
              width={100}
              height={100}
              className={`h-10 w-10 rounded-full object-contain p-1 ${map[type].bgColor}`}
              alt=""
            />
          </div>
          <div className="overflow-clip rounded-xl bg-white p-2">
            <QRCodeSVG
              value={selected?.qrContent}
              size={250}
              fgColor={map[type].color}
            />
          </div>
        </div>
      </div>
      <div className="mt-4 w-full max-w-[500px] text-center">
        <p className="font-bold">{selected.name}</p>
      </div>
    </div>
  );
}

export default QRSlug;

import React from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mosque } from "@/app/types";
import { CopyIcon, DownloadIcon } from "lucide-react";
import { TwitterIcon } from "./icons";
import { useToast } from "./use-toast";

export const MosqueCard: React.FC<Mosque> = ({ name, location, image }) => (
  <Card className="group transition-all duration-300 ease-in-out transform hover:scale-105">
    <CardContent className="flex flex-col items-center gap-4 p-6 h-full">
      <div className="flex flex-col items-center gap-2 h-20">
        <h3 className="text-lg font-semibold text-green-600">{name}</h3>
        <p className="text-sm text-muted-foreground">{location}</p>
      </div>
      <Image
        src={image}
        alt={`QR Code for ${name}`}
        width={160}
        height={160}
        className="rounded-lg h-40 object-cover"
      />
      <div className="flex gap-2 mt-auto">
        <Button
          size="icon"
          variant="ghost"
          className="group-hover:bg-muted/50 group-focus:bg-muted/50"
        >
          <CopyIcon className="h-5 w-5 text-green-600" />
          <span className="sr-only">Copy QR code link</span>
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="group-hover:bg-muted/50 group-focus:bg-muted/50"
        >
          <DownloadIcon className="h-5 w-5 text-green-600" />
          <span className="sr-only">Download QR code</span>
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="group-hover:bg-muted/50 group-focus:bg-muted/50"
        >
          <TwitterIcon className="h-5 w-5 text-green-600" />
          <span className="sr-only">Share on Twitter</span>
        </Button>
      </div>
    </CardContent>
  </Card>
);

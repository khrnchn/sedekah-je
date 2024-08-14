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
import type React from "react";
import { TwitterIcon } from "./icons";
import { useToast } from "./use-toast";

export const MosqueCard = ({ name, location, image }: Mosque) => (
	<Card className="group ">
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
					className="group-hover:bg-muted/50 group-focus:bg-muted/50 hover:scale-105 transition-transform duration-200 ease-in-out"
				>
					<CopyIcon className="h-5 w-5 text-green-600" />
					<span className="sr-only">Copy QR code link</span>
				</Button>
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger>
							<Button
								size="icon"
								variant="ghost"
								className="group-hover:bg-muted/50 group-focus:bg-muted/50 hover:scale-105 transition-transform duration-200 ease-in-out"
							>
								<DownloadIcon
									className="h-5 w-5 text-green-600"
									onClick={async () => {
										const blob = await fetch(image).then((res) => res.blob());
										const url = URL.createObjectURL(blob);
										const a = document.createElement("a");
										a.href = url;
										a.download = `${name.toLowerCase().replace(/\s/g, "-")}.png`;
										a.click();
									}}
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
);

import { QRCodeSVG } from "qrcode.react";
import SedekahjeLogo from "./masjid.svg";

import { institutions } from "@/app/data/institutions";
import { slugify } from "@/lib/utils";

function QRSlug({ params }: { params: { slug: string } }) {
	const selected = institutions.find((i) => slugify(i.name) === params.slug);

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
				<SedekahjeLogo width="80" height="80" />

				<p className="text-sm font-bold">SedekahJe</p>
			</div>
			<div className="h-[350px] w-[350px]">
				<div
					className={`relative flex h-full w-full items-center justify-center rounded-2xl ${map[type].bgColor}`}
				>
					<div className="absolute top-0 mt-2 rounded-full bg-white p-2">
						<img
							src={map[type].logo}
							className={`size-10 rounded-full object-contain p-1 ${map[type].bgColor}`}
							alt=""
						/>
					</div>
					<div className="overflow-clip rounded-xl bg-white p-4">
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

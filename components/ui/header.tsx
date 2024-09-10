import Image from "next/image";
import Link from "next/link";
import { ModeToggle } from "./mode-toggle";

export const Header = () => (
	<header className="flex flex-col md:flex-row items-center justify-center py-8 gap-5">
		<Link href="/">
			<Image src="/masjid.svg" alt="Masjid" width={100} height={100} />
		</Link>
		<div className="flex flex-col items-center md:items-start">
			<Link href="/">
				<h1 className="text-2xl md:text-3xl font-bold text-foreground">
					SedekahJe
				</h1>
			</Link>
			<p className="text-base md:text-lg text-gray-600 dark:text-gray-400 text-center md:text-left">
				Senarai QR masjid, surau, dan institusi.
			</p>
		</div>
		<ModeToggle className="absolute top-5 right-5" />
	</header>
);

import Image from "next/image";
import Link from "next/link";

export const Header = () => (
	<header className="flex items-center justify-center py-8 gap-5">
		<Image src="/masjid.svg" alt="Masjid" width={100} height={100} />
		<div className="flex flex-col items-start justify-center gap-0">
			<Link href="/">
				<h1 className="text-3xl font-bold text-foreground">SedekahJe</h1>
			</Link>
			<p className="text-lg mb-2">Senarai QR masjid, Surau, Institusi</p>
		</div>
	</header>
);

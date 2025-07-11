import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
	return (
		<div className="min-h-screen flex items-center justify-center px-4 py-8">
			<div className="flex flex-col items-center justify-center max-w-2xl mx-auto text-center space-y-6">
				<h1 className="text-2xl md:text-4xl font-bold text-foreground">
					404 tidak dijumpai
				</h1>
				<p className="text-gray-600 dark:text-gray-300 text-base md:text-lg max-w-md">
					tersesat? ikut saya{" "}
					<Link href="/" className="relative inline-block group">
						<span className="text-primary font-semibold transition-colors duration-200 group-hover:text-primary/80 ">
							laman utama
						</span>
						<span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary transform scale-x-0 transition-transform duration-200 origin-left group-hover:scale-x-100" />
					</Link>
				</p>
				<div className="w-full max-w-sm md:max-w-md">
					<Image
						src="/man-getting-lost.png"
						alt="Seorang lelaki tersesat dalam perjalanan ke masjid."
						width={400}
						height={400}
						className="w-full h-auto"
					/>
				</div>
			</div>
		</div>
	);
}

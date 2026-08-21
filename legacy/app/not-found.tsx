import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
	return (
		<div className="flex min-h-screen items-center justify-center px-4 py-8">
			<div className="mx-auto flex max-w-2xl flex-col items-center justify-center space-y-6 text-center">
				<h1 className="text-2xl font-bold text-foreground md:text-4xl">
					404 tidak dijumpai
				</h1>
				<p className="max-w-md text-base text-muted-foreground md:text-lg">
					tersesat? ikut saya{" "}
					<Link href="/" className="relative inline-block group">
						<span className="font-semibold text-primary transition-colors duration-200 group-hover:text-primary/80">
							laman utama
						</span>
						<span className="absolute bottom-0 left-0 h-0.5 w-full origin-left scale-x-0 bg-primary transition-transform duration-200 group-hover:scale-x-100" />
					</Link>
				</p>
				<div className="w-full max-w-sm md:max-w-md">
					<Image
						src="/man-getting-lost.png"
						alt="Seorang lelaki tersesat dalam perjalanan ke masjid."
						width={400}
						height={400}
						className="h-auto w-full"
					/>
				</div>
			</div>
		</div>
	);
}

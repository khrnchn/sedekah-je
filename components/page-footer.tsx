"use client";

import { Separator } from "@/components/ui/separator";
import { ExternalLink, Heart } from "lucide-react";
import { useTheme } from "next-themes";
import Image from "next/image";

const navigation = {
	social: [
		{
			name: "X",
			href: "https://x.com/sedekahje",
			icon: (props: React.SVGProps<SVGSVGElement>) => (
				<svg
					role="img"
					viewBox="0 0 24 24"
					xmlns="http://www.w3.org/2000/svg"
					{...props}
				>
					<title>X</title>
					<path
						fill="currentColor"
						d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"
					/>
				</svg>
			),
		},
		{
			name: "GitHub",
			href: "https://github.com/khrnchn/sedekah-je",
			icon: (props: React.SVGProps<SVGSVGElement>) => (
				<svg
					role="img"
					viewBox="0 0 24 24"
					xmlns="http://www.w3.org/2000/svg"
					{...props}
				>
					<title>GitHub</title>
					<path
						fill="currentColor"
						d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
					/>
				</svg>
			),
		},
	],
	partners: [
		{ name: "Cari Fatwa", href: "https://carifatwa.com" },
		{ name: "GetDoa", href: "https://getdoa.com" },
		{ name: "Kelas Mengaji Online", href: "https://kelasmengaji.online" },
		{ name: "Saham Akhirat", href: "https://sahamakhirat.org" },
		{ name: "Belasungkawa", href: "https://belasungkawa.my" },
		{ name: "Quran Manzil", href: "https://quran-manzil.com" },
		{ name: "Quran Sunnah AI", href: "https://quran-sunnah-ai.com" },
		{ name: "Meem", href: "https://usemeem.com" },
		{ name: "duaa.my", href: "https://duaa.my" },
		{ name: "SemakHadis.com", href: "https://semakhadis.com" },
		{ name: "CariTadika.my", href: "https://caritadika.my" },
		{ name: "e-Masjid.my", href: "https://e-masjid.my" },
	],
	resources: [
		{
			name: "Sumber Kod",
			href: "https://github.com/khrnchn/sedekah-je",
		},
		{
			name: "Data Trafik",
			href: "https://analytics.farhanhelmy.com/share/qqGVUCdO8JGBoSk5/sedekah.je",
		},
		{ name: "Logo", href: "https://www.flaticon.com/free-icons/holy" },
	],
	projects: [
		{
			name: "mnasrullah.com",
			href: "https://mnasrullah.com",
		},
	],
};

export default function PageFooter() {
	const { theme } = useTheme();

	return (
		<footer
			aria-labelledby="footer-heading"
			className="bg-gradient-to-br from-background to-muted/20 border-t border-border/40 mt-16"
		>
			<h2 id="footer-heading" className="sr-only">
				Footer
			</h2>
			<div className="mx-auto max-w-7xl px-6 py-12 sm:py-16 lg:px-8 lg:py-20">
				<div className="xl:grid xl:grid-cols-3 xl:gap-12">
					{/* Brand Section */}
					<div className="space-y-6 xl:col-span-1">
						<div className="flex items-center space-x-3">
							<Image
								alt="Logo Masjid SedekahJe"
								src="/masjid.svg"
								width={40}
								height={40}
								title="Logo created by Freepik - Flaticon"
								className="rounded-lg"
							/>
							<div>
								<h3 className="text-lg font-bold text-foreground">
									sedekah.je
								</h3>
								<p className="text-xs text-muted-foreground">QR Directory</p>
							</div>
						</div>

						<p className="text-sm leading-6 text-muted-foreground max-w-md">
							Senarai QR masjid, surau, dan institusi yang dikumpulkan oleh
							netizen untuk memudahkan sedekah dan sumbangan.
						</p>

						{/* Social Links */}
						<div className="flex space-x-4">
							{navigation.social.map((item) => (
								<a
									key={item.name}
									href={item.href}
									target="_blank"
									className="group flex items-center justify-center w-10 h-10 rounded-full bg-muted/50 hover:bg-muted transition-colors duration-200"
									rel="noreferrer"
									title={`Follow us on ${item.name}`}
								>
									<span className="sr-only">{item.name}</span>
									<item.icon
										aria-hidden="true"
										className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors"
									/>
								</a>
							))}
						</div>
					</div>

					{/* Links Section */}
					<div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 xl:col-span-2 xl:mt-0">
						<div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
							{/* Resources */}
							<div>
								<h3 className="text-sm font-semibold leading-6 text-foreground mb-4">
									Rujukan
								</h3>
								<ul className="space-y-3">
									{navigation.resources.map((item) => (
										<li key={item.name}>
											<a
												href={item.href}
												target="_blank"
												className="group flex items-center text-sm leading-6 text-muted-foreground hover:text-foreground transition-colors duration-200"
												rel="noreferrer"
											>
												{item.name}
												<ExternalLink className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
											</a>
										</li>
									))}
								</ul>
							</div>

							{/* Partners */}
							<div>
								<h3 className="text-sm font-semibold leading-6 text-foreground mb-4">
									Projek Komuniti
								</h3>
								<ul className="space-y-3">
									{navigation.partners.slice(0, 6).map((item) => (
										<li key={item.name}>
											<a
												href={`${item.href}?ref=sedekah.je`}
												target="_blank"
												className="group flex items-center text-sm leading-6 text-muted-foreground hover:text-foreground transition-colors duration-200"
												rel="noreferrer"
											>
												{item.name}
												<ExternalLink className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
											</a>
										</li>
									))}
								</ul>
							</div>
						</div>

						<div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
							{/* More Partners */}
							<div>
								<h3 className="text-sm font-semibold leading-6 text-foreground mb-4">
									Projek Komuniti
								</h3>
								<ul className="space-y-3">
									{navigation.partners.slice(6).map((item) => (
										<li key={item.name}>
											<a
												href={`${item.href}?ref=sedekah.je`}
												target="_blank"
												className="group flex items-center text-sm leading-6 text-muted-foreground hover:text-foreground transition-colors duration-200"
												rel="noreferrer"
											>
												{item.name}
												<ExternalLink className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
											</a>
										</li>
									))}
								</ul>
							</div>

							{/* Other Projects */}
							<div>
								<h3 className="text-sm font-semibold leading-6 text-foreground mb-4">
									Projek Lain
								</h3>
								<ul className="space-y-3">
									{navigation.projects.map((item) => (
										<li key={item.name}>
											<a
												href={`${item.href}?ref=sedekah.je`}
												target="_blank"
												className="group flex items-center text-sm leading-6 text-muted-foreground hover:text-foreground transition-colors duration-200"
												rel="noreferrer"
											>
												{item.name}
												<ExternalLink className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
											</a>
										</li>
									))}
								</ul>
							</div>
						</div>
					</div>
				</div>

				{/* Footer Bottom */}
				<Separator className="my-8" />
				<div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
					<p className="text-xs text-muted-foreground">
						&copy; {new Date().getFullYear()} Hak Cipta Terpelihara. Dibina
						dengan{" "}
						<Heart className="inline h-3 w-3 text-red-500" aria-hidden="true" />{" "}
						oleh{" "}
						<a
							href="https://github.com/khrnchn/sedekah-je/graphs/contributors"
							target="_blank"
							className="text-primary hover:underline font-medium"
							rel="noreferrer"
						>
							Khairin Chan dan kawan-kawan
						</a>
						.
					</p>
					<div className="flex items-center gap-4 text-xs text-muted-foreground">
						<a href="/faq" className="hover:text-foreground transition-colors">
							Soalan Lazim
						</a>
						<span>•</span>
						<a
							href="https://github.com/khrnchn/sedekah-je"
							target="_blank"
							className="hover:text-foreground transition-colors"
							rel="noreferrer"
						>
							Sumber Kod
						</a>
					</div>
				</div>
			</div>
		</footer>
	);
}

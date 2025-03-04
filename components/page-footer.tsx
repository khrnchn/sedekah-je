import Image from "next/image";
import { useTheme } from "next-themes";

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
		{ name: "Quran Manzil", href: "https://quran-manzil.com" },
		{ name: "Quran Sunnah AI", href: "https://quran-sunnah-ai.com" },
		{ name: "Belasungkawa", href: "https://belasungkawa.my" },
		{ name: "Meem", href: "https://usemeem.com" },
		{ name: "duaa.my", href: "https://duaa.my" },
		{ name: "SemakHadis.com", href: "https://semakhadis.com" },
		{ name: "CariTadika.my", href: "https://caritadika.my" },
		{ name: "e-Masjid.my", href: "https://e-masjid.my" },
		{ name: "GetDoa", href: "https://getdoa.com" },
		{ name: "Saham Akhirat", href: "https://sahamakhirat.org" },
		{ name: "Kelas Mengaji Online", href: "https://kelasmengaji.online" },
	],
	resources: [
		{
			name: "Sumber Kod",
			href: "https://github.com/khrnchn/sedekah-je",
		},
		{
			name: "Data Trafik",
			href: "https://analytics.farhanhelmy.com/share/OrlbJdQSaPiFFLqT/sedekah.je",
		},
		{ name: "Logo", href: "https://www.flaticon.com/free-icons/holy" },
	],
	projects: [
		{
			name: "Portfolio Saya",
			href: "https://khairin.my",
		},
	],
};

export default function PageFooter() {
	const { theme } = useTheme();

	return (
		<footer
			aria-labelledby="footer-heading"
			className={`bg-[hsl(var(--background))] text-[hsl(var(--foreground))]`}
		>
			<h2 id="footer-heading" className="sr-only">
				Footer
			</h2>
			<div className="mx-auto max-w-7xl px-6 py-12 sm:py-16 lg:px-8 lg:py-20">
				<div className="xl:grid xl:grid-cols-3 xl:gap-8">
					<div className="space-y-5 xl:col-span-1">
						<Image
							alt="Logo Masjid SedekahJe"
							src="/masjid.svg"
							width={100}
							height={20}
							title="Logo created by Freepik - Flaticon"
							className="cursor-pointer"
						/>
						<p className="text-sm leading-6">
							Senarai QR masjid, surau, dan institusi yang dikumpulkan oleh
							netizen.
						</p>
						<div className="flex space-x-6">
							{navigation.social.map((item) => (
								<a
									key={item.name}
									href={item.href}
									target="_blank"
									className="hover:text-gray-500"
									rel="noreferrer"
								>
									<span className="sr-only">{item.name}</span>
									<item.icon aria-hidden="true" className="h-6 w-6" />
								</a>
							))}
						</div>
						<p className="text-xs text-left mt-5">
							&copy; {new Date().getFullYear()} Hak Cipta Terpelihara.
							<br /> Dibina oleh{" "}
							<a
								href="https://github.com/khrnchn/sedekah-je/graphs/contributors"
								target="_blank"
								className="text-blue-500 hover:underline"
								rel="noreferrer"
							>
								Khairin Chan dan kawan kawan.
							</a>
						</p>
					</div>
					<div className="mt-4 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
						<div className="md:grid md:grid-cols-2 md:gap-8">
							<div>
								<h3 className="text-sm font-semibold leading-6 underline">
									Rujukan
								</h3>
								<ul className="mt-4 space-y-4">
									{navigation.resources.map((item) => (
										<li key={item.name}>
											<a
												href={item.href}
												target="_blank"
												className="text-sm leading-6 hover:text-gray-900"
												rel="noreferrer"
											>
												{item.name}
											</a>
										</li>
									))}
								</ul>
							</div>
							<div className="mt-4 md:mt-0">
								<h3 className="text-sm font-semibold leading-6 underline">
									Lawati Juga
								</h3>
								<ul className="mt-4 space-y-4">
									{navigation.partners.map((item) => (
										<li key={item.name}>
											<a
												href={`${item.href}?ref=sedekah.je`}
												target="_blank"
												className="text-sm leading-6 hover:text-gray-900"
												rel="noreferrer"
											>
												{item.name}
											</a>
										</li>
									))}
								</ul>
							</div>
						</div>
						<div className="md:grid md:grid-cols-2 md:gap-8">
							<div>
								<h3 className="text-sm font-semibold leading-6 underline">
									Projek Lain
								</h3>
								<ul className="mt-4 space-y-4">
									{navigation.projects.map((item) => (
										<li key={item.name}>
											<a
												href={`${item.href}?ref=sedekah.je`}
												target="_blank"
												className="text-sm leading-6 hover:text-gray-900"
												rel="noreferrer"
											>
												{item.name}
											</a>
										</li>
									))}
								</ul>
							</div>
						</div>
					</div>
				</div>
			</div>
		</footer>
	);
}
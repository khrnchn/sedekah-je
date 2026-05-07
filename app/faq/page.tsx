"use client";

import { MessageCircle, Search } from "lucide-react";
import Link from "next/link";
import {
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";
import PageFooter from "@/components/layout/page-footer";
import PageHeader from "@/components/layout/page-header";
import { Header } from "@/components/shared/header";
import PageSection from "@/components/shared/page-section";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type FaqEntry = {
	id: string;
	question: string;
	answer: ReactNode;
	/** Plain text for search when answer is not a string */
	searchText?: string;
};

type FaqCategory = {
	title: string;
	faqs: FaqEntry[];
};

const faqCategories: FaqCategory[] = [
	{
		title: "Sumbangan & Derma",
		faqs: [
			{
				id: "submit-qr-dari-masjid",
				question:
					"Saya ada beberapa gambar kod QR yang diambil dari masjid. Bagaimanakah cara untuk saya menyumbang?",
				searchText:
					"log masuk submit kod QR baru semak masjid tersenarai laman web contribute",
				answer: (
					<>
						Anda boleh klik butang "Log Masuk" untuk submit kod QR baru. Sila
						semak terlebih dahulu jika masjid tersebut telah tersenarai di laman
						web kami. Anda perlu{" "}
						<Link
							href="/contribute"
							className="font-medium text-primary hover:underline"
						>
							log masuk untuk submit
						</Link>
						.
					</>
				),
			},
			{
				id: "derma-terus-sampai",
				question:
					"Bagaimana saya tahu derma saya terus sampai kepada penerima yang dimaksudkan?",
				answer:
					"Kod QR yang disediakan adalah diambil terus dari masjid atau laman sosial mereka. Tiada perantara, dan 100% derma akan sampai kepada penerima.",
			},
			{
				id: "tiada-yuran-komisen",
				question:
					"Adakah platform ini mengambil sebarang yuran atau komisen daripada derma?",
				answer:
					"Tidak, kami tidak mengambil sebarang yuran atau komisen. Kod QR yang disediakan adalah diambil terus dari masjid atau laman sosial mereka.",
			},
		],
	},
	{
		title: "Keselamatan & Privasi",
		faqs: [
			{
				id: "keselamatan-derma",
				question: "Selamatkah untuk membuat derma melalui platform ini?",
				answer:
					"Ya, platform ini hanya menyediakan senarai QR. Kod QR ditapis dan disahkan sebelum diterbitkan di laman web kami.",
			},
			{
				id: "bebas-dari-pihak-ketiga",
				question:
					"Adakah platform ini mempunyai kaitan dengan mana-mana organisasi atau pihak ketiga?",
				answer:
					"Tidak, platform ini sepenuhnya bebas dan merupakan sebuah projek sumber terbuka. Ia tidak mempunyai kaitan dengan mana-mana organisasi, perniagaan, atau individu.",
			},
		],
	},
	{
		title: "Mengenai Platform",
		faqs: [
			{
				id: "pengurusan-platform",
				question: "Siapakah yang mengurus dan membangunkan platform ini?",
				searchText:
					"komuniti tech X penyelenggara penyumbang kod github contributors sumber terbuka",
				answer: (
					<>
						Platform ini dimulakan oleh{" "}
						<Link
							aria-label="khairin"
							href="https://x.com/khrnchn"
							target="_blank"
							rel="noopener noreferrer"
							className="text-primary hover:underline"
						>
							khairin
						</Link>{" "}
						dan dikendalikan bersama oleh komuniti tech yang kebanyakannya dari
						X. Anda boleh melihat senarai penyelenggara dan penyumbang kod di{" "}
						<Link
							href="https://github.com/khrnchn/sedekah-je/graphs/contributors"
							target="_blank"
							rel="noopener noreferrer"
							className="text-primary hover:underline"
						>
							GitHub
						</Link>
						. Kami juga mempunyai beberapa orang admin (sukarela) yang membantu
						menapis QR-QR yang dihantar oleh pengguna.
					</>
				),
			},
		],
	},
	{
		title: "Bantuan & Sokongan",
		faqs: [
			{
				id: "isu-derma-atau-qr",
				question:
					"Apa yang perlu saya lakukan jika terdapat isu dengan derma atau kod QR?",
				searchText: "hubungi x twitter sedekahje bantuan isu",
				answer: (
					<>
						Anda boleh menghubungi akaun X kami di{" "}
						<Link
							href="https://x.com/sedekahje"
							className="text-primary hover:underline"
							target="_blank"
							rel="noopener noreferrer"
						>
							@sedekahje
						</Link>
						, atau akaun threads khairin di{" "}
						<Link
							href="https://threads.com/@khrnchn"
							className="text-primary hover:underline"
							target="_blank"
							rel="noopener noreferrer"
						>
							@khrnchn
						</Link>
						. Kami akan cuba membantu secepat mungkin.
					</>
				),
			},
		],
	},
];

function collectSearchBlob(faq: FaqEntry): string {
	const answerPart =
		typeof faq.answer === "string" ? faq.answer : (faq.searchText ?? "");
	return `${faq.question} ${answerPart}`.toLowerCase();
}

const allFaqIds = new Set(
	faqCategories.flatMap((category) => category.faqs.map((faq) => faq.id)),
);

type FlatFaqItem = {
	id: string;
	categoryTitle: string;
	question: string;
	answer: ReactNode;
};

const FAQ = () => {
	const [query, setQuery] = useState("");
	const [requestedOpenValue, setRequestedOpenValue] = useState<
		string | undefined
	>(() => {
		if (typeof window === "undefined") return undefined;
		const hash = window.location.hash.slice(1);
		return hash && allFaqIds.has(hash) ? hash : undefined;
	});

	const filteredItems = useMemo(() => {
		const q = query.trim().toLowerCase();
		const items: FlatFaqItem[] = [];
		faqCategories.forEach((category) => {
			category.faqs.forEach((faq) => {
				if (!q || collectSearchBlob(faq).includes(q)) {
					items.push({
						id: faq.id,
						categoryTitle: category.title,
						question: faq.question,
						answer: faq.answer,
					});
				}
			});
		});
		return items;
	}, [query]);

	const openValue =
		requestedOpenValue &&
		filteredItems.some((item) => item.id === requestedOpenValue)
			? requestedOpenValue
			: undefined;

	useEffect(() => {
		const url = `${window.location.pathname}${window.location.search}${openValue ? `#${openValue}` : ""}`;
		window.history.replaceState(null, "", url);
	}, [openValue]);

	const handleOpenChange = useCallback((value: string) => {
		const next = value === "" ? undefined : value;
		setRequestedOpenValue(next);
	}, []);

	return (
		<>
			<Header />
			<PageSection>
				<PageHeader pageTitle="Soalan Lazim" showHeader={true} />

				<p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-4 max-w-prose">
					Jawapan ringkas tentang derma, keselamatan QR, dan cara menggunakan
					sedekah.je.
				</p>

				<Card className="w-full mb-8">
					<CardHeader className="space-y-4 p-4 pb-4 sm:p-6">
						<div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
							{faqCategories.map((category) => (
								<Badge
									key={category.title}
									variant="outline"
									className="max-w-full truncate text-[11px] font-normal text-muted-foreground sm:text-xs"
								>
									{category.title} · {category.faqs.length}
								</Badge>
							))}
						</div>
						<Input
							type="search"
							placeholder="Cari soalan…"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							startIcon={Search}
							className="mt-0 h-11 min-h-11 sm:h-10 sm:min-h-10"
							aria-label="Cari soalan lazim"
						/>
					</CardHeader>
					<CardContent className="px-4 pb-5 pt-0 sm:px-6 sm:pb-6">
						{filteredItems.length === 0 ? (
							<p className="text-muted-foreground text-sm px-1 py-8 text-center leading-relaxed sm:py-6">
								Tiada soalan yang sepadan. Cuba perkataan lain atau kosongkan
								carian.
							</p>
						) : (
							<Accordion
								type="single"
								collapsible
								className="w-full"
								value={openValue}
								onValueChange={handleOpenChange}
							>
								{filteredItems.map((item) => (
									<AccordionItem
										id={item.id}
										key={item.id}
										value={item.id}
										className="border-b border-border/40 last:border-b-0"
									>
										<AccordionTrigger className="min-h-[2.75rem] gap-0 py-3 text-left hover:no-underline sm:min-h-0 sm:py-4">
											<span className="flex flex-col items-start gap-1 pr-3 text-left sm:pr-4">
												<span className="text-[11px] font-normal text-muted-foreground sm:text-xs">
													{item.categoryTitle}
												</span>
												<span className="font-medium text-sm leading-snug sm:text-base">
													{item.question}
												</span>
											</span>
										</AccordionTrigger>
										<AccordionContent className="pb-4 pt-2">
											<div className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-prose">
												{item.answer}
											</div>
										</AccordionContent>
									</AccordionItem>
								))}
							</Accordion>
						)}
					</CardContent>
				</Card>

				<Card className="border-primary/20 bg-primary/5">
					<CardHeader className="space-y-2 p-4 sm:p-6">
						<CardTitle className="flex items-center gap-2 text-lg text-foreground sm:text-xl">
							<MessageCircle className="h-5 w-5 shrink-0" aria-hidden />
							Masih ada soalan?
						</CardTitle>
						<CardDescription className="text-pretty text-sm leading-relaxed">
							Hantar mesej di X atau buka isu di GitHub jika anda perlukan
							bantuan atau ingin melaporkan masalah kod QR.
						</CardDescription>
					</CardHeader>
					<CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
						<div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
							<Link
								href="https://x.com/sedekahje"
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:min-h-10 sm:w-auto sm:py-2"
							>
								Hubungi Kami
							</Link>
							<Link
								href="https://github.com/khrnchn/sedekah-je/issues"
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex min-h-11 w-full items-center justify-center rounded-md border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent sm:min-h-10 sm:w-auto sm:py-2"
							>
								Laporkan Isu Berkaitan Kod
							</Link>
						</div>
					</CardContent>
				</Card>

				<PageFooter />
			</PageSection>
		</>
	);
};

export default FAQ;

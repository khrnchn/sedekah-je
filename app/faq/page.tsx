"use client";

import PageFooter from "@/components/page-footer";
import PageHeader from "@/components/page-header";
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
import { Header } from "@/components/ui/header";
import PageSection from "@/components/ui/pageSection";
import { HelpCircle, MessageCircle, Shield, Users, Zap } from "lucide-react";
import Link from "next/link";
import React from "react";

const faqCategories = [
	{
		title: "Sumbangan & Derma",
		icon: HelpCircle,
		color: "bg-green-100 dark:bg-green-900",
		textColor: "text-green-700 dark:text-green-300",
		badge: "success",
		faqs: [
			{
				question:
					"Saya ada beberapa gambar kod QR yang diambil dari masjid. Bagaimanakah cara untuk saya menyumbang?",
				answer: (
					<>
						Anda boleh klik butang "Nak Tambah QR?" untuk menyumbang kod QR
						baru. Sila semak terlebih dahulu jika masjid tersebut telah
						tersenarai di laman web kami. Anda perlu{" "}
						<Link
							href="/contribute"
							className="text-blue-500 dark:text-blue-400 hover:underline font-medium"
						>
							log masuk untuk menyumbang
						</Link>
						.
					</>
				),
			},
			{
				question:
					"Bagaimana saya tahu derma saya terus sampai kepada penerima yang dimaksudkan?",
				answer:
					"Kod QR yang disediakan adalah diambil terus dari masjid atau laman sosial mereka. Tiada perantara, dan 100% derma akan sampai kepada penerima.",
			},
			{
				question:
					"Adakah platform ini mengambil sebarang yuran atau komisen daripada derma?",
				answer:
					"Tidak, kami tidak mengambil sebarang yuran atau komisen. Kod QR yang disediakan adalah diambil terus dari masjid atau laman sosial mereka.",
			},
		],
	},
	{
		title: "Keselamatan & Privasi",
		icon: Shield,
		color: "bg-blue-100 dark:bg-blue-900",
		textColor: "text-blue-700 dark:text-blue-300",
		badge: "default",
		faqs: [
			{
				question: "Selamatkah untuk membuat derma melalui platform ini?",
				answer:
					"Ya, platform ini hanya menyediakan senarai QR. Kod QR ditapis dan disahkan sebelum diterbitkan di laman web kami.",
			},
			{
				question:
					"Adakah platform ini mempunyai kaitan dengan mana-mana organisasi atau pihak ketiga?",
				answer:
					"Tidak, platform ini sepenuhnya bebas dan merupakan sebuah projek sumber terbuka. Ia tidak mempunyai kaitan dengan mana-mana organisasi, perniagaan, atau individu.",
			},
		],
	},
	{
		title: "Mengenai Platform",
		icon: Users,
		color: "bg-purple-100 dark:bg-purple-900",
		textColor: "text-purple-700 dark:text-purple-300",
		badge: "secondary",
		faqs: [
			{
				question: "Siapakah yang mengurus dan membangunkan platform ini?",
				answer: (
					<>
						Platform ini dikendalikan oleh komuniti tech yang kebanyakannya dari
						X. Anda boleh melihat senarai{" "}
						<span className="italic">maintainer/contributor</span> di{" "}
						<Link
							href="https://github.com/khrnchn/sedekah-je/graphs/contributors"
							className="text-blue-500 dark:text-blue-400 hover:underline"
						>
							sini
						</Link>
						.
					</>
				),
			},
		],
	},
	{
		title: "Bantuan & Sokongan",
		icon: MessageCircle,
		color: "bg-orange-100 dark:bg-orange-900",
		textColor: "text-orange-700 dark:text-orange-300",
		badge: "warning",
		faqs: [
			{
				question:
					"Apa yang perlu saya lakukan jika terdapat isu dengan derma atau kod QR?",
				answer: (
					<>
						Anda boleh menghubungi akaun X kami dengan mengetip{" "}
						<Link
							href="https://x.com/sedekahje"
							className="text-blue-500 dark:text-blue-400 hover:underline"
							target="_blank"
						>
							pautan ini
						</Link>{" "}
						. Kami akan cuba membantu secepat mungkin.
					</>
				),
			},
		],
	},
];

const FAQ = () => {
	return (
		<>
			<Header />
			<PageSection>
				<PageHeader pageTitle="Soalan Lazim" showHeader={true} />

				<div className="mb-4">
					<p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
						Temui jawapan untuk soalan-soalan yang sering ditanya mengenai
						platform sedekah.je. Jika anda tidak menemui jawapan yang anda cari,
						sila hubungi kami.
					</p>
				</div>

				<div className="space-y-8">
					{faqCategories.map((category, categoryIndex) => {
						const IconComponent = category.icon;
						return (
							<Card key={categoryIndex} className="w-full">
								<CardHeader className="pb-3">
									<div className="flex items-center gap-3">
										<div className={`p-2 rounded-lg ${category.color}`}>
											<IconComponent
												className={`h-5 w-5 ${category.textColor}`}
											/>
										</div>
										<div className="flex items-center gap-2">
											<CardTitle className="text-lg font-semibold">
												{category.title}
											</CardTitle>
											<Badge
												variant={
													category.badge as
														| "success"
														| "default"
														| "secondary"
														| "warning"
												}
												className="text-xs px-2 py-1"
											>
												{category.faqs.length} soalan
											</Badge>
										</div>
									</div>
								</CardHeader>
								<CardContent>
									<Accordion type="single" collapsible className="w-full">
										{category.faqs.map((faq, faqIndex) => (
											<AccordionItem
												key={faqIndex}
												value={`category-${categoryIndex}-item-${faqIndex}`}
												className="border-b border-border/40 last:border-b-0"
											>
												<AccordionTrigger className="py-4 text-left hover:no-underline">
													<span className="font-medium text-sm sm:text-base pr-4">
														{faq.question}
													</span>
												</AccordionTrigger>
												<AccordionContent className="pb-4 pt-2">
													<div className="text-muted-foreground text-sm sm:text-base leading-relaxed">
														{faq.answer}
													</div>
												</AccordionContent>
											</AccordionItem>
										))}
									</Accordion>
								</CardContent>
							</Card>
						);
					})}
				</div>

				<Card className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
							<MessageCircle className="h-5 w-5" />
							Masih ada soalan?
						</CardTitle>
						<CardDescription className="text-blue-700 dark:text-blue-300">
							Jika anda tidak menemui jawapan yang anda cari, jangan ragu untuk
							menghubungi kami.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="flex flex-col sm:flex-row gap-4">
							<Link
								href="https://x.com/sedekahje"
								target="_blank"
								className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium text-sm"
							>
								Hubungi Kami
							</Link>
							<Link
								href="https://github.com/khrnchn/sedekah-je/issues"
								target="_blank"
								className="inline-flex items-center justify-center px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors font-medium text-sm"
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

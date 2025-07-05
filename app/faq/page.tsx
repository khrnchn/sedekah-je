"use client";

import PageFooter from "@/components/page-footer";
import PageHeader from "@/components/page-header";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Header } from "@/components/ui/header";
import PageSection from "@/components/ui/pageSection";
import Link from "next/link";
import React from "react";

const faqData = [
	{
		question:
			"Saya ada beberapa gambar kod QR yang diambil dari masjid. Bagaimanakah cara untuk saya menyumbang?",
		answer:
			"Anda boleh hubungi akaun X kami di @sedekahje. Semak terlebih dahulu jika masjid tersebut telah tersenarai di laman web kami.",
	},
	{
		question:
			"Adakah platform ini mempunyai kaitan dengan mana-mana organisasi atau pihak ketiga?",
		answer:
			"Tidak, platform ini sepenuhnya bebas dan merupakan sebuah projek sumber terbuka. Ia tidak mempunyai kaitan dengan mana-mana organisasi, perniagaan, atau individu.",
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
	{
		question: "Selamatkah untuk membuat derma melalui platform ini?",
		answer:
			"Ya, platform ini hanya menyediakan senarai QR. Kod QR ditapis dan disahkan sebelum diterbitkan di laman web kami.",
	},
	{
		question: "Siapakah yang mengurus dan membangunkan platform ini?",
		answer: (
			<>
				Platform ini dikendalikan oleh komuniti tech yang kebanyakannya dari X.
				Anda boleh melihat senarai{" "}
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
	{
		question:
			"Apa yang perlu saya lakukan jika terdapat isu dengan derma atau kod QR?",
		answer: (
			<>
				Anda boleh menghubungi akaun X kami dengan mengetip{" "}
				<Link
					href="mailto:khrnchnv@gmail.com"
					className="text-blue-500 dark:text-blue-400 hover:underline"
				>
					pautan ini
				</Link>{" "}
				. Kami akan cuba membantu secepat mungkin.
			</>
		),
	},
];

const FAQ = () => {
	return (
		<>
			<Header />
			<PageSection>
				<PageHeader pageTitle="Soalan Lazim" showHeader={true} />

				<Accordion type="single" collapsible className="w-full space-y-4">
					{faqData.map((item, index) => (
						<AccordionItem
							key={index}
							value={`item-${index + 1}`}
							className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
						>
							<AccordionTrigger className="px-6 py-4 text-left">
								<span className="font-medium text-sm sm:text-base">
									{item.question}
								</span>
							</AccordionTrigger>
							<AccordionContent className="px-6 py-4 bg-gray-300 dark:bg-gray-700">
								<p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">
									{item.answer}
								</p>
							</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>
				<PageFooter />
			</PageSection>
		</>
	);
};

export default FAQ;

"use client";

import React from "react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import PageSection from "@/components/ui/pageSection";
import Link from "next/link";

const faqData = [
	{
		question: "Saya ada beberapa QR. Bagaimana cara untuk saya menyumbang?",
		answer:
			"Anda boleh menekan butang Muatnaik QR di bahagian bawah laman web utama.",
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
			"Kod QR yang disediakan adalah untuk derma secara langsung. Tiada perantara, dan 100% derma akan sampai kepada penerima yang dimaksudkan.",
	},
	{
		question:
			"Adakah platform ini mengambil sebarang yuran atau komisen daripada derma?",
		answer: "Tidak, kami tidak mengambil sebarang yuran atau komisen.",
	},
	{
		question: "Adakah selamat untuk membuat derma melalui platform ini?",
		answer:
			"Ya, platform ini hanya menyediakan senarai QR. Kod QR ditapis dan disahkan sebelum diterbitkan di laman web.",
	},
	{
		question: "Siapakah yang menguruskan platform ini?",
		answer: (
			<>
				Platform ini dikendalikan oleh komuniti tech yang kebanyakannya dari X.
				Anda boleh melihat senarai penyumbang di{" "}
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
				Anda boleh menghubungi{" "}
				<Link
					href="mailto:khrnchnv@gmail.com"
					className="text-blue-500 dark:text-blue-400 hover:underline"
				>
					khairin
				</Link>{" "}
				untuk melaporkan sebarang isu atau kemukakan cadangan.
			</>
		),
	},
];

const FAQ = () => {
	return (
		<PageSection>
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink asChild>
							<Link href="/">Laman Utama</Link>
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbPage>Soalan Lazim</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>

			<h2 className="text-lg font-bold">Soalan Lazim</h2>

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
		</PageSection>
	);
};

export default FAQ;

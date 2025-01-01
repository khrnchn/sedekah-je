"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";
import { useEffect, useState } from "react";

export function DisclaimerModal() {
	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => {
		const hasSeenDisclaimer = localStorage.getItem("hasSeenDisclaimer");
		if (!hasSeenDisclaimer) {
			setIsOpen(true);
		}
	}, []);

	const handleClose = () => {
		setIsOpen(false);
		localStorage.setItem("hasSeenDisclaimer", "true");
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Peringatan</DialogTitle>
					<DialogDescription>
						Selamat datang ke SedekahJe. Sila baca pesanan di bawah sebelum
						meneruskan derma.
					</DialogDescription>
				</DialogHeader>
				<div className="py-4">
					<p>
						Berikutan isu Duitnow QR yang dibangkitkan di X pada 27 September,
						kami ingin menasihati anda supaya berhati-hati sebelum menderma.
					</p>
					<p className="mt-2">
						Pihak SedekahJe sedang dalam proses untuk mengesahkan semula kesemua
						QR yang pernah dimuatnaik.
					</p>
					<p className="mt-4">
						Untuk maklumat lanjut mengenai isu ini, sila{" "}
						<Link
							href="https://x.com/mkhairulazri/status/1839563380186882380?t=l16MVgY5ajClN-dmB7D_Kg&s=08"
							target="_blank"
							rel="noopener noreferrer"
							className="text-blue-500 hover:underline"
						>
							klik di sini
						</Link>
						.
					</p>
					<p className="mt-4">
						Baca bagaimana SedekahJe mengesahkan QR sebelum ini:{" "}
						<Link
							href="https://www.khrnchn.xyz/blog/sedekah-je-first-challenge"
							target="_blank"
							rel="noopener noreferrer"
							className="text-blue-500 hover:underline"
						>
							klik untuk baca
						</Link>
						.
					</p>
				</div>
				<DialogFooter>
					<Button onClick={handleClose}>Saya Faham</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

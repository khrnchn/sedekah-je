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
		const hasSeenSignInAnnouncement = localStorage.getItem(
			"hasSeenSignInAnnouncement",
		);
		if (!hasSeenSignInAnnouncement) {
			setIsOpen(true);
		}
	}, []);

	const handleClose = () => {
		setIsOpen(false);
		localStorage.setItem("hasSeenSignInAnnouncement", "true");
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Berita Gembira!</DialogTitle>
					<DialogDescription>
						Selamat datang ke SedekahJe. Kini anda boleh menyumbang QR kod!
					</DialogDescription>
				</DialogHeader>
				<div className="py-4">
					<p>
						Kami dengan sukacitanya mengumumkan bahawa anda kini boleh log masuk
						untuk menyumbang QR kod ke dalam direktori SedekahJe.
					</p>
					<p className="mt-2">
						Dengan menyumbang, anda membantu masyarakat Malaysia untuk mencari
						dan menggunakan QR kod derma dengan lebih mudah.
					</p>
					<p className="mt-4">
						Mulakan sumbangan anda hari ini dan bantu kami mengembangkan
						direktori QR kod yang lebih komprehensif untuk semua!
					</p>
				</div>
				<DialogFooter>
					<Button onClick={handleClose}>Faham, Terima Kasih!</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

import InstitutionFormOptimized from "@/app/(user)/contribute/_components/institution-form-optimized";
import { UserLayout } from "@/components/user-layout";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Tambah Institusi",
	description:
		"Sumbang kepada komuniti sedekah.je dengan menambah institusi baru. Kongsi QR code masjid, surau atau institusi untuk memudahkan sedekah digital.",
	openGraph: {
		title: "Tambah Institusi | Sedekah Je",
		description:
			"Sumbang kepada komuniti sedekah.je dengan menambah institusi baru. Kongsi QR code masjid, surau atau institusi untuk memudahkan sedekah digital.",
		url: "https://sedekah.je/contribute",
	},
	twitter: {
		title: "Tambah Institusi | Sedekah Je",
		description:
			"Sumbang kepada komuniti sedekah.je dengan menambah institusi baru. Kongsi QR code masjid, surau atau institusi untuk memudahkan sedekah digital.",
	},
	alternates: {
		canonical: "https://sedekah.je/contribute",
	},
};

export default function ContributePage() {
	return (
		<UserLayout
			title="Tambah Institusi"
			description="Sumbang kepada komuniti sedekah.je dengan menambah institusi baru"
		>
			<InstitutionFormOptimized />
		</UserLayout>
	);
}

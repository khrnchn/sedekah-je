import type { Metadata } from "next";
import { LegalContent } from "@/components/legal-content";
import PageFooter from "@/components/page-footer";
import { Header } from "@/components/ui/header";

export const metadata: Metadata = {
	title: "Legal",
	description: "Privacy Policy and Terms of Service for sedekah.je",
};

export default function LegalPage() {
	return (
		<>
			<Header />
			<LegalContent />
			<PageFooter />
		</>
	);
}

import type { Metadata } from "next";
import { LegalContent } from "@/components/legal-content";
import PageFooter from "@/components/page-footer";
import { Header } from "@/components/ui/header";

export const metadata: Metadata = {
	title: "Terms of Service",
	description: "Terms of Service for sedekah.je",
};

export default function TermsPage() {
	return (
		<>
			<Header />
			<LegalContent />
			<PageFooter />
		</>
	);
}

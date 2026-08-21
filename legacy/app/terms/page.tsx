import type { Metadata } from "next";
import PageFooter from "@/components/layout/page-footer";
import { LegalContent } from "@/components/legal-content";
import { Header } from "@/components/shared/header";

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

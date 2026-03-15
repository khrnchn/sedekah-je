import type { Metadata } from "next";
import PageFooter from "@/components/layout/page-footer";
import { LegalContent } from "@/components/legal-content";
import { Header } from "@/components/shared/header";

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

import type { Metadata } from "next";
import PageFooter from "@/components/layout/page-footer";
import { LegalContent } from "@/components/legal-content";
import { Header } from "@/components/shared/header";

export const metadata: Metadata = {
	title: "Privacy Policy",
	description: "Privacy Policy for sedekah.je",
};

export default function PrivacyPage() {
	return (
		<>
			<Header />
			<LegalContent />
			<PageFooter />
		</>
	);
}

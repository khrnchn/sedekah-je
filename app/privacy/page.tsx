import type { Metadata } from "next";
import { LegalContent } from "@/components/legal-content";
import PageFooter from "@/components/page-footer";
import { Header } from "@/components/ui/header";

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

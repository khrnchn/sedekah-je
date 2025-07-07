"use client";

import InstitutionForm from "@/app/(user)/contribute/_components/institution-form";
import { ProtectedRoute } from "@/components/auth/protected-route";
import PageSection from "@/components/ui/pageSection";

export default function ContributePage() {
	return (
		<ProtectedRoute>
			<PageSection>
				<h1 className="text-3xl font-bold tracking-tight text-center mb-8">
					Add Institution
				</h1>
				<InstitutionForm />
			</PageSection>
		</ProtectedRoute>
	);
}

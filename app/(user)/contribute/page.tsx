"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import InstitutionForm from "@/components/forms/institution-form";
import PageSection from "@/components/ui/pageSection";

export default function ContributePage() {
	return (
		<ProtectedRoute>
			<PageSection>
				<h1 className="text-3xl font-bold tracking-tight text-center mb-8">
					Tambah Institusi
				</h1>
				<InstitutionForm />
			</PageSection>
		</ProtectedRoute>
	);
}

import InstitutionForm from "@/app/(user)/contribute/_components/institution-form";
import { UserLayout } from "@/components/user-layout";

export default function ContributePage() {
	return (
		<UserLayout
			title="Add Institution"
			description="Contribute to the sedekah.je community by adding new institutions"
		>
			<InstitutionForm />
		</UserLayout>
	);
}

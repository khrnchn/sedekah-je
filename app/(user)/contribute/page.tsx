import InstitutionForm from "@/app/(user)/contribute/_components/institution-form";
import { UserLayout } from "@/components/user-layout";

export default function ContributePage() {
	return (
		<UserLayout
			title="Tambah Institusi"
			description="Sumbang kepada komuniti sedekah.je dengan menambah institusi baru"
		>
			<InstitutionForm />
		</UserLayout>
	);
}

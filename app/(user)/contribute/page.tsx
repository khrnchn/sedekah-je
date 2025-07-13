import InstitutionFormOptimized from "@/app/(user)/contribute/_components/institution-form-optimized";
import { UserLayout } from "@/components/user-layout";

export default function ContributePage() {
	return (
		<UserLayout
			title="Tambah Institusi"
			description="Sumbang kepada komuniti sedekah.je dengan menambah institusi baru"
		>
			<InstitutionFormOptimized />
		</UserLayout>
	);
}

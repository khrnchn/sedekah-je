import { RawakClient } from "@/app/rawak/rawak-client";
import { getInstitutions } from "@/lib/queries/institutions";

export default async function RawakPage() {
	const institutions = await getInstitutions();
	return <RawakClient initialInstitutions={institutions} />;
}

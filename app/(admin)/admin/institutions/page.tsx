import { redirect } from "next/navigation";

export default function InstitutionsIndexPage() {
	redirect("/admin/institutions/pending");
}

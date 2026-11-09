import { notFound } from "next/navigation";
import { districtBySlug } from "@/lib/features/quest/districts";

export default async function QuestDistrictLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ district: string }>;
}) {
	if (!districtBySlug((await params).district)) notFound();
	return children;
}

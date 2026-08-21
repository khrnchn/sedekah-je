import { getContributionList } from "@/app/(user)/my-contributions/_lib/queries";
import { LazyContributionList } from "./lazy-contribution-list";

export async function AsyncContributionList() {
	const contributions = await getContributionList();

	return <LazyContributionList contributions={contributions} />;
}

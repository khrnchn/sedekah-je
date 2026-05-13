import { unstable_cache } from "next/cache";
import { getGitHubWrappedStats } from "@/lib/ramadhan-wrapped-github";
import { ImpactNumber } from "./impact-number";
import { formatNumber } from "./shared";
import { ChapterSubtitle, ChapterTitle, StoryProse } from "./story-chapter";

const getGitHubStatsCached = unstable_cache(
	async () => getGitHubWrappedStats(),
	["ramadhan-wrapped-2026-github"],
	{
		revalidate: 300,
		tags: ["ramadhan-wrapped-2026-github"],
	},
);

export async function AsyncGitHubSection() {
	const githubStats = await getGitHubStatsCached();
	if (!githubStats) return null;

	return (
		<>
			<ChapterSubtitle>Open source</ChapterSubtitle>
			<ChapterTitle>Built in the open</ChapterTitle>
			<StoryProse className="mt-3">
				Sedekah Je is open source. During Ramadhan, the codebase kept moving
				with{" "}
				<strong className="font-semibold text-foreground">
					{formatNumber(githubStats.commits)}
				</strong>{" "}
				commits,{" "}
				<strong className="font-semibold text-foreground">
					{formatNumber(githubStats.mergedPRs)}
				</strong>{" "}
				merged pull requests, and{" "}
				<strong className="font-semibold text-foreground">
					{formatNumber(githubStats.issues)}
				</strong>{" "}
				issues opened.
			</StoryProse>

			<div className="mt-8 grid grid-cols-3 gap-3 sm:gap-4">
				<ImpactNumber
					value={githubStats.commits}
					label="Commits"
					duration={0.8}
				/>
				<ImpactNumber
					value={githubStats.mergedPRs}
					label="Merged PRs"
					duration={0.8}
				/>
				<ImpactNumber
					value={githubStats.issues}
					label="Issues"
					duration={0.8}
				/>
			</div>
		</>
	);
}

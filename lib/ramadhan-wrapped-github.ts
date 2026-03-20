import { RAMADHAN_WRAPPED_CONFIG } from "@/lib/ramadhan-wrapped";

export type GitHubWrappedStats = {
	commits: number;
	pullRequests: number;
	mergedPRs: number;
	issues: number;
};

const REPO = "khrnchn/sedekah-je";
const START = RAMADHAN_WRAPPED_CONFIG.startAt.toISOString();
const END = RAMADHAN_WRAPPED_CONFIG.endExclusive.toISOString();
const START_DATE = RAMADHAN_WRAPPED_CONFIG.startDate;
const END_DATE = RAMADHAN_WRAPPED_CONFIG.endDate;

async function ghFetchJson<T>(url: string): Promise<T> {
	const headers: Record<string, string> = {
		Accept: "application/vnd.github+json",
	};
	const token = process.env.GITHUB_TOKEN;
	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}
	const res = await fetch(url, { headers });
	if (!res.ok) throw new Error(`GitHub API ${res.status}: ${url}`);
	return res.json() as Promise<T>;
}

async function countCommits(): Promise<number> {
	let total = 0;
	for (let page = 1; page <= 10; page++) {
		const commits = await ghFetchJson<unknown[]>(
			`https://api.github.com/repos/${REPO}/commits?since=${START}&until=${END}&per_page=100&page=${page}`,
		);
		total += commits.length;
		if (commits.length < 100) break;
	}
	return total;
}

export async function getGitHubWrappedStats(): Promise<GitHubWrappedStats | null> {
	try {
		const [commitCount, prResult, mergedResult, issueResult] =
			await Promise.all([
				countCommits(),
				ghFetchJson<{ total_count: number }>(
					`https://api.github.com/search/issues?q=repo:${REPO}+type:pr+created:${START_DATE}..${END_DATE}`,
				),
				ghFetchJson<{ total_count: number }>(
					`https://api.github.com/search/issues?q=repo:${REPO}+type:pr+is:merged+created:${START_DATE}..${END_DATE}`,
				),
				ghFetchJson<{ total_count: number }>(
					`https://api.github.com/search/issues?q=repo:${REPO}+type:issue+created:${START_DATE}..${END_DATE}`,
				),
			]);

		return {
			commits: commitCount,
			pullRequests: prResult.total_count,
			mergedPRs: mergedResult.total_count,
			issues: issueResult.total_count,
		};
	} catch (error) {
		console.error("[github-wrapped] Failed to fetch GitHub stats:", error);
		return null;
	}
}

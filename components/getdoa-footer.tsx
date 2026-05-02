"use client";

import { BookOpenText, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { mockGetDoa, useGetDoa } from "@/hooks/use-getdoa";

const GetdoaFooter = () => {
	const { data, isFetching } = useGetDoa();

	const renderDoaContent = (doaData: typeof data | typeof mockGetDoa) => {
		if (!doaData) return null;

		const hasLabel = /\[(.*?)\]/.test(doaData.name_my);
		const categoryText = hasLabel
			? doaData.name_my.match(/\[(.*?)\]/)?.[1]
			: null;
		const titleText = hasLabel
			? doaData.name_my.split("]")[1] || doaData.name_my
			: doaData.name_my;

		return (
			<div className="space-y-4">
				<div className="flex flex-wrap items-center gap-2">
					<h3 className="text-sm font-semibold leading-relaxed text-foreground">
						{titleText}
					</h3>
					{categoryText && (
						<Badge
							variant="outline"
							className="border-primary/20 bg-primary/5 text-[11px] font-medium text-primary"
						>
							{categoryText}
						</Badge>
					)}
				</div>

				<div className="rounded-lg border border-border/70 bg-background/60 p-4 sm:p-5">
					<p
						lang="ar"
						dir="rtl"
						className="font-arabic text-right text-base leading-9 text-foreground sm:text-lg"
					>
						{doaData.content}
					</p>
				</div>

				<div className="space-y-2">
					{doaData.reference_my && (
						<p className="text-xs text-muted-foreground">
							{doaData.reference_my}
						</p>
					)}
					<div className="rounded-md bg-muted/35 px-3 py-2">
						<p className="text-sm leading-relaxed text-muted-foreground">
							<span className="font-medium text-foreground">Maksud:</span>{" "}
							{doaData.meaning_my}
						</p>
					</div>
				</div>
			</div>
		);
	};

	return (
		<footer className="mt-12 w-full">
			<Card className="border-border/70 bg-card/80 shadow-none">
				<CardHeader className="space-y-0 px-4 pb-3 pt-4 sm:px-5 sm:pt-5">
					<div className="flex items-start gap-3">
						<div className="mt-0.5 rounded-md border border-primary/15 bg-primary/5 p-2 text-primary">
							<BookOpenText className="h-4 w-4" aria-hidden="true" />
						</div>
						<div className="min-w-0 space-y-1">
							<h2 className="text-sm font-semibold leading-none text-foreground">
								Doa Harian
							</h2>
							<p className="text-xs leading-5 text-muted-foreground">
								Bacaan ringkas selepas menjana atau menyemak QR.
							</p>
						</div>
					</div>
				</CardHeader>

				<CardContent className="px-4 pb-4 pt-0 sm:px-5 sm:pb-5">
					{isFetching ? (
						<div className="space-y-4" aria-busy="true" aria-live="polite">
							<div className="space-y-2">
								<div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
								<div className="h-3 w-24 animate-pulse rounded bg-muted" />
							</div>
							<div className="rounded-lg border border-border/70 bg-background/60 p-4">
								<div className="ml-auto h-5 w-4/5 animate-pulse rounded bg-muted" />
								<div className="ml-auto mt-3 h-5 w-3/5 animate-pulse rounded bg-muted" />
							</div>
							<div className="h-12 animate-pulse rounded-md bg-muted/70" />
						</div>
					) : (
						renderDoaContent(data || mockGetDoa)
					)}

					<Separator className="my-4" />

					<div className="flex flex-wrap items-center justify-between gap-2">
						<p className="text-xs text-muted-foreground">
							Kandungan doa daripada GetDoa.
						</p>
						<a
							href="https://getdoa.com"
							target="_blank"
							rel="noopener noreferrer"
							className="group inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
						>
							Lihat sumber
							<ExternalLink
								className="h-3 w-3 opacity-70 transition-opacity group-hover:opacity-100"
								aria-hidden="true"
							/>
						</a>
					</div>
				</CardContent>
			</Card>
		</footer>
	);
};

export default GetdoaFooter;

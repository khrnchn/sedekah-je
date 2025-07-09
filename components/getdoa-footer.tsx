"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { mockGetDoa, useGetDoa } from "@/hooks/use-getdoa";
import { ExternalLink, Heart, Quote } from "lucide-react";

const GetdoaFooter = () => {
	const { data, isFetching } = useGetDoa();
	const hasLabel = data && /\[(.*?)\]/.test(data.name_my);

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
				{categoryText && (
					<div className="flex items-center gap-2">
						<Quote className="h-4 w-4 text-primary" />
						<Badge variant="default" className="text-xs">
							{categoryText}
						</Badge>
					</div>
				)}

				<div className="space-y-3">
					<h3 className="text-sm font-semibold text-foreground leading-relaxed">
						{titleText}
					</h3>

					<div className="relative p-4 bg-muted/30 rounded-lg border-l-4 border-primary">
						<p className="text-sm text-foreground text-right leading-relaxed font-arabic">
							{doaData.content}
						</p>
					</div>

					<div className="space-y-2">
						<p className="text-xs text-muted-foreground italic">
							{doaData.reference_my}
						</p>
						<p className="text-sm text-muted-foreground leading-relaxed">
							<span className="font-medium">Maksud:</span> {doaData.meaning_my}
						</p>
					</div>
				</div>
			</div>
		);
	};

	return (
		<footer className="w-full mt-16">
			<Card className="border-0 shadow-lg bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20">
				<CardHeader className="pb-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<div className="p-2 bg-primary/10 rounded-full">
								<Heart className="h-4 w-4 text-primary" />
							</div>
							<div>
								<h2 className="text-base font-semibold text-foreground">
									Doa Harian
								</h2>
								<p className="text-xs text-muted-foreground">
									Doa untuk dibaca setiap hari
								</p>
							</div>
						</div>
					</div>
				</CardHeader>

				<CardContent className="pt-0">
					{isFetching ? (
						<div className="space-y-4">
							<div className="space-y-2">
								<div className="h-4 bg-muted animate-pulse rounded w-3/4" />
								<div className="h-4 bg-muted animate-pulse rounded w-1/2" />
							</div>
							<div className="space-y-2">
								<div className="h-16 bg-muted animate-pulse rounded" />
								<div className="h-3 bg-muted animate-pulse rounded w-2/3" />
								<div className="h-4 bg-muted animate-pulse rounded w-4/5" />
							</div>
						</div>
					) : (
						renderDoaContent(data || mockGetDoa)
					)}

					<Separator className="my-6" />

					<div className="flex items-center justify-center gap-2">
						<p className="text-xs text-muted-foreground">Dikuasakan oleh</p>
						<a
							href="https://getdoa.com"
							target="_blank"
							rel="noopener noreferrer"
							className="group inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
						>
							GetDoa
							<ExternalLink className="h-3 w-3 opacity-70 group-hover:opacity-100 transition-opacity" />
						</a>
					</div>
				</CardContent>
			</Card>
		</footer>
	);
};

export default GetdoaFooter;

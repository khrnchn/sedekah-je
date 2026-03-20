"use client";

import { useId } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";

export type DailyPageviewsPoint = {
	label: string;
	views: number;
};

type DailyPageviewsChartProps = {
	data: DailyPageviewsPoint[];
};

export function DailyPageviewsChart({ data }: DailyPageviewsChartProps) {
	const safeId = useId().replace(/:/g, "");
	const fillId = `wrapped-pageviews-${safeId}`;

	return (
		<ChartContainer
			config={{
				views: {
					label: "Pageviews",
					color: "hsl(var(--chart-2))",
				},
			}}
			className="aspect-auto h-[210px] w-full min-[400px]:h-[240px] sm:h-[260px] md:h-[280px]"
		>
			<AreaChart data={data} margin={{ left: 2, right: 4, top: 8, bottom: 12 }}>
				<defs>
					<linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
						<stop
							offset="5%"
							stopColor="var(--color-views)"
							stopOpacity={0.25}
						/>
						<stop
							offset="95%"
							stopColor="var(--color-views)"
							stopOpacity={0.02}
						/>
					</linearGradient>
				</defs>
				<CartesianGrid vertical={false} strokeDasharray="4 4" />
				<XAxis
					dataKey="label"
					tickLine={false}
					axisLine={false}
					tick={{ fontSize: 11 }}
					tickMargin={6}
					minTickGap={12}
					height={48}
					angle={-32}
					textAnchor="end"
					interval="preserveStartEnd"
				/>
				<YAxis
					tickLine={false}
					axisLine={false}
					tick={{ fontSize: 11 }}
					width={44}
					allowDecimals={false}
					tickFormatter={(v: number) =>
						v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
					}
				/>
				<ChartTooltip
					cursor={false}
					content={<ChartTooltipContent indicator="line" />}
				/>
				<Area
					type="monotone"
					dataKey="views"
					stroke="var(--color-views)"
					strokeWidth={2}
					fill={`url(#${fillId})`}
				/>
			</AreaChart>
		</ChartContainer>
	);
}

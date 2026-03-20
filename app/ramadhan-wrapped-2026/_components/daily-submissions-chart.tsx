"use client";

import { useId } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";

export type DailyChartPoint = {
	label: string;
	submissions: number;
};

type DailySubmissionsChartProps = {
	data: DailyChartPoint[];
	/** Use brand primary instead of chart palette (e.g. campaign pages). */
	seriesColor?: "chart" | "primary";
};

export function DailySubmissionsChart({
	data,
	seriesColor = "chart",
}: DailySubmissionsChartProps) {
	const safeId = useId().replace(/:/g, "");
	const fillId = `wrapped-submissions-${safeId}`;
	const strokeColor =
		seriesColor === "primary" ? "hsl(var(--primary))" : "hsl(var(--chart-1))";

	return (
		<ChartContainer
			config={{
				submissions: {
					label: "Submission",
					color: strokeColor,
				},
			}}
			className="aspect-auto h-[210px] w-full min-[400px]:h-[240px] sm:h-[260px] md:h-[280px]"
		>
			<AreaChart data={data} margin={{ left: 2, right: 4, top: 8, bottom: 12 }}>
				<defs>
					<linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
						<stop
							offset="5%"
							stopColor="var(--color-submissions)"
							stopOpacity={0.25}
						/>
						<stop
							offset="95%"
							stopColor="var(--color-submissions)"
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
					width={32}
					allowDecimals={false}
				/>
				<ChartTooltip
					cursor={false}
					content={<ChartTooltipContent indicator="line" />}
				/>
				<Area
					type="monotone"
					dataKey="submissions"
					stroke="var(--color-submissions)"
					strokeWidth={2}
					fill={`url(#${fillId})`}
				/>
			</AreaChart>
		</ChartContainer>
	);
}

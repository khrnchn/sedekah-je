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

export function DailySubmissionsChart({ data }: { data: DailyChartPoint[] }) {
	const safeId = useId().replace(/:/g, "");
	const fillId = `wrapped-submissions-${safeId}`;

	return (
		<ChartContainer
			config={{
				submissions: {
					label: "Submission",
					color: "hsl(var(--chart-1))",
				},
			}}
			className="aspect-auto h-[260px] w-full md:h-[280px]"
		>
			<AreaChart data={data} margin={{ left: 4, right: 8, top: 8, bottom: 4 }}>
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
					tickMargin={10}
					minTickGap={20}
					interval="preserveStartEnd"
				/>
				<YAxis
					tickLine={false}
					axisLine={false}
					width={40}
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

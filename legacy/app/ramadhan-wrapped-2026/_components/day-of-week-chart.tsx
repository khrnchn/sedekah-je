"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";

type DayOfWeekChartPoint = {
	day: string;
	[key: string]: string | number;
};

type DayOfWeekChartProps = {
	data: DayOfWeekChartPoint[];
	dataKey: string;
	label: string;
	color?: string;
};

export function DayOfWeekChart({
	data,
	dataKey,
	label,
	color = "oklch(var(--chart-1))",
}: DayOfWeekChartProps) {
	return (
		<ChartContainer
			config={{
				[dataKey]: {
					label,
					color,
				},
			}}
			className="aspect-auto h-[200px] w-full sm:h-[220px]"
		>
			<BarChart data={data} margin={{ left: 2, right: 4, top: 8, bottom: 4 }}>
				<CartesianGrid vertical={false} strokeDasharray="4 4" />
				<XAxis
					dataKey="day"
					tickLine={false}
					axisLine={false}
					tick={{ fontSize: 11 }}
					tickMargin={4}
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
					content={<ChartTooltipContent indicator="dot" />}
				/>
				<Bar
					dataKey={dataKey}
					fill={`var(--color-${dataKey})`}
					radius={[4, 4, 0, 0]}
					maxBarSize={48}
				/>
			</BarChart>
		</ChartContainer>
	);
}

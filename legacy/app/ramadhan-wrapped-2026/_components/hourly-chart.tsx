"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";

type HourlyChartPoint = {
	hour: number;
	label: string;
	[key: string]: string | number;
};

type HourlyChartProps = {
	data: HourlyChartPoint[];
	dataKey: string;
	label: string;
	color?: string;
};

export function HourlyChart({
	data,
	dataKey,
	label,
	color = "oklch(var(--chart-1))",
}: HourlyChartProps) {
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
			<BarChart data={data} margin={{ left: 2, right: 4, top: 8, bottom: 12 }}>
				<CartesianGrid vertical={false} strokeDasharray="4 4" />
				<XAxis
					dataKey="label"
					tickLine={false}
					axisLine={false}
					tick={{ fontSize: 10 }}
					tickMargin={4}
					interval={2}
					height={32}
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
					radius={[3, 3, 0, 0]}
					maxBarSize={20}
				/>
			</BarChart>
		</ChartContainer>
	);
}

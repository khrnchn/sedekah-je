"use client";

import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

interface MonthlyData {
	month: string;
	total: number;
	approved: number;
	pending: number;
	rejected: number;
}

interface MonthlyChartProps {
	data: MonthlyData[];
}

export function MonthlyChart({ data }: MonthlyChartProps) {
	return (
		<ChartContainer
			config={{
				total: {
					label: "Total",
					color: "hsl(var(--chart-1))",
				},
				approved: {
					label: "Approved",
					color: "hsl(var(--chart-2))",
				},
				pending: {
					label: "Pending",
					color: "hsl(var(--chart-3))",
				},
			}}
		>
			<ResponsiveContainer width="100%" height="100%">
				<LineChart data={data}>
					<XAxis dataKey="month" />
					<YAxis />
					<Line
						type="monotone"
						dataKey="total"
						stroke="hsl(var(--chart-1))"
						strokeWidth={2}
						name="Total"
					/>
					<Line
						type="monotone"
						dataKey="approved"
						stroke="hsl(var(--chart-2))"
						strokeWidth={2}
						name="Approved"
					/>
					<Line
						type="monotone"
						dataKey="pending"
						stroke="hsl(var(--chart-3))"
						strokeWidth={2}
						name="Pending"
					/>
					<ChartTooltip content={<ChartTooltipContent />} />
				</LineChart>
			</ResponsiveContainer>
		</ChartContainer>
	);
}

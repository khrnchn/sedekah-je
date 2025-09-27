"use client";

import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

const COLORS = {
	mosque: "#10b981",
	surau: "#3b82f6",
	others: "#f59e0b",
};

interface CategoryData {
	category: string;
	count: number;
	[key: string]: string | number;
}

interface CategoryChartProps {
	data: CategoryData[];
}

export function CategoryChart({ data }: CategoryChartProps) {
	return (
		<ChartContainer
			config={{
				count: {
					label: "Count",
					color: "hsl(var(--chart-1))",
				},
			}}
		>
			<ResponsiveContainer width="100%" height="100%">
				<PieChart>
					<Pie
						data={data}
						cx="50%"
						cy="50%"
						innerRadius={40}
						outerRadius={80}
						paddingAngle={5}
						dataKey="count"
						label={({ category, count }) => `${category}: ${count}`}
					>
						{data.map((entry, index) => (
							<Cell
								key={`cell-${index}`}
								fill={COLORS[entry.category as keyof typeof COLORS]}
							/>
						))}
					</Pie>
					<ChartTooltip content={<ChartTooltipContent />} />
				</PieChart>
			</ResponsiveContainer>
		</ChartContainer>
	);
}

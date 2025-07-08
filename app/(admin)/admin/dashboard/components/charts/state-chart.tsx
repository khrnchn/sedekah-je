"use client";

import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import {
	Bar,
	BarChart,
	Cell,
	ResponsiveContainer,
	XAxis,
	YAxis,
} from "recharts";

const STATE_COLORS = [
	"#10b981",
	"#3b82f6",
	"#f59e0b",
	"#ef4444",
	"#8b5cf6",
	"#06b6d4",
	"#84cc16",
	"#f97316",
	"#ec4899",
	"#6366f1",
	"#14b8a6",
	"#eab308",
	"#f43f5e",
	"#8b5cf6",
	"#06b6d4",
];

interface StateData {
	state: string;
	count: number;
}

interface StateChartProps {
	data: StateData[];
}

export function StateChart({ data }: StateChartProps) {
	return (
		<ChartContainer
			config={{
				count: {
					label: "Count",
					color: "hsl(var(--chart-2))",
				},
			}}
		>
			<ResponsiveContainer width="100%" height="100%">
				<BarChart data={data}>
					<XAxis
						dataKey="state"
						angle={-45}
						textAnchor="end"
						height={60}
						interval={0}
					/>
					<YAxis />
					<Bar dataKey="count" radius={[4, 4, 0, 0]}>
						{data.map((entry, index) => (
							<Cell
								key={`cell-${index}`}
								fill={STATE_COLORS[index % STATE_COLORS.length]}
							/>
						))}
					</Bar>
					<ChartTooltip content={<ChartTooltipContent />} />
				</BarChart>
			</ResponsiveContainer>
		</ChartContainer>
	);
}

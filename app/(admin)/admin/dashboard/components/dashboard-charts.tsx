import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	getInstitutionsByCategory,
	getInstitutionsByState,
	getMonthlyGrowth,
} from "../queries";
import { CategoryChart } from "./charts/category-chart";
import { MonthlyChart } from "./charts/monthly-chart";
import { StateChart } from "./charts/state-chart";

export async function DashboardCharts() {
	const [categoryData, stateData, monthlyData] = await Promise.all([
		getInstitutionsByCategory(),
		getInstitutionsByState(),
		getMonthlyGrowth(),
	]);

	// Transform monthly data for the chart
	const monthlyChartData = monthlyData.map((item) => ({
		month: item.month,
		total: item.total,
		approved: item.approved,
		pending: item.pending,
		rejected: item.rejected,
	}));

	// Top 10 states only for better visualization
	const topStates = stateData.slice(0, 10);

	return (
		<div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
			{/* Category Distribution */}
			<Card>
				<CardHeader>
					<CardTitle>Distribution by Category</CardTitle>
				</CardHeader>
				<CardContent>
					<CategoryChart data={categoryData} />
				</CardContent>
			</Card>

			{/* Top States */}
			<Card>
				<CardHeader>
					<CardTitle>Top States</CardTitle>
				</CardHeader>
				<CardContent>
					<StateChart data={topStates} />
				</CardContent>
			</Card>

			{/* Monthly Growth */}
			<Card className="xl:col-span-1 lg:col-span-2">
				<CardHeader>
					<CardTitle>Monthly Growth</CardTitle>
				</CardHeader>
				<CardContent>
					<MonthlyChart data={monthlyChartData} />
				</CardContent>
			</Card>
		</div>
	);
}

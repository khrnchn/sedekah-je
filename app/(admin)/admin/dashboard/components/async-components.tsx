import {
	getDashboardStats,
	getInstitutionsByCategory,
	getInstitutionsByState,
	getInstitutionsWithCoords,
	getLatestActivities,
	getMonthlyGrowth,
	getTopContributors,
} from "../queries";
import { ActivityFeed } from "./activity-feed";
import { DashboardCharts } from "./dashboard-charts";
import { DashboardMap } from "./dashboard-map";
import { DashboardStats } from "./dashboard-stats";
import { InstitutionTable } from "./institution-table";
import {
	ChartSkeleton,
	MapSkeleton,
	StatsSkeleton,
	TableSkeleton,
} from "./loading-skeletons";
import { RealTimeMetrics } from "./real-time-metrics";
import { TopContributors } from "./top-contributors";

export async function AsyncDashboardStats() {
	const stats = await getDashboardStats();
	return <DashboardStats data={stats} />;
}

export async function AsyncDashboardCharts() {
	const [categoryData, stateData, monthlyGrowth] = await Promise.all([
		getInstitutionsByCategory(),
		getInstitutionsByState(),
		getMonthlyGrowth(),
	]);
	return (
		<DashboardCharts
			categoryData={categoryData}
			stateData={stateData}
			monthlyData={monthlyGrowth}
		/>
	);
}

export async function AsyncDashboardMap() {
	const [institutionsWithCoords, stateData] = await Promise.all([
		getInstitutionsWithCoords(),
		getInstitutionsByState(),
	]);
	return (
		<DashboardMap institutions={institutionsWithCoords} stateData={stateData} />
	);
}

export async function AsyncTopContributors() {
	const topContributors = await getTopContributors();
	return <TopContributors data={topContributors} />;
}

export async function AsyncActivityFeed() {
	const latestActivities = await getLatestActivities();
	return <ActivityFeed data={latestActivities} />;
}

export async function AsyncRealTimeMetrics() {
	const stats = await getDashboardStats();
	return <RealTimeMetrics data={stats} />;
}

export async function AsyncInstitutionTable() {
	const latestActivities = await getLatestActivities();
	return <InstitutionTable data={latestActivities} />;
}

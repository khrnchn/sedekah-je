import { StatCard, StatsGrid } from "@/components/user-page-components";

interface StatsCardsProps {
	stats: {
		totalContributions: number;
		approvedContributions: number;
		pendingContributions: number;
		rejectedContributions: number;
	};
}

export function StatsCards({ stats }: StatsCardsProps) {
	return (
		<StatsGrid cols={3}>
			<StatCard value={stats.totalContributions} label="Total Contributions" />
			<StatCard value={stats.approvedContributions} label="Approved" />
			<StatCard value={stats.pendingContributions} label="Pending Review" />
		</StatsGrid>
	);
}

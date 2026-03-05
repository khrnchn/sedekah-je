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
		<div data-tour="mycontrib-stats">
			<StatsGrid cols={4}>
				<StatCard value={stats.totalContributions} label="Jumlah Sumbangan" />
				<StatCard value={stats.approvedContributions} label="Diluluskan" />
				<StatCard value={stats.pendingContributions} label="Menunggu Semakan" />
				<StatCard value={stats.rejectedContributions} label="Ditolak" />
			</StatsGrid>
		</div>
	);
}

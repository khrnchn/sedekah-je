import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, CheckCircle, MapPin, Users } from "lucide-react";

interface DashboardMapProps {
	institutions: Array<{
		id: number;
		name: string;
		category: string;
		state: string;
		city: string;
		coords: [number, number] | null;
	}>;
	stateData: Array<{
		state: string;
		count: number;
	}>;
}

export function DashboardMap({ institutions, stateData }: DashboardMapProps) {
	// Get top 5 states by count
	const topStates = stateData
		.filter((item) => item.count > 0)
		.sort((a, b) => b.count - a.count)
		.slice(0, 5);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<MapPin className="h-5 w-5" />
					Institution Distribution
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{/* Summary Stats */}
					<div className="grid grid-cols-3 gap-4">
						<div className="text-center">
							<div className="text-2xl font-bold text-primary">
								{institutions.length}
							</div>
							<div className="text-xs text-muted-foreground">
								With Locations
							</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold text-green-600">
								{stateData.filter((s) => s.count > 0).length}
							</div>
							<div className="text-xs text-muted-foreground">Active States</div>
						</div>
						<div className="text-center">
							<div className="text-2xl font-bold text-blue-600">
								{stateData.reduce((sum, s) => sum + s.count, 0)}
							</div>
							<div className="text-xs text-muted-foreground">
								Total Institutions
							</div>
						</div>
					</div>

					{/* Top States */}
					<div className="space-y-2">
						<h4 className="font-medium flex items-center gap-2">
							<Building2 className="h-4 w-4" />
							Top States
						</h4>
						<div className="space-y-2">
							{topStates.map((state, index) => (
								<div
									key={state.state}
									className="flex items-center justify-between p-2 bg-muted/50 rounded"
								>
									<div className="flex items-center gap-2">
										<Badge variant="secondary" className="text-xs">
											#{index + 1}
										</Badge>
										<span className="font-medium">{state.state}</span>
									</div>
									<div className="flex items-center gap-2">
										<CheckCircle className="h-4 w-4 text-green-600" />
										<span className="font-bold">{state.count}</span>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Recent Locations */}
					<div className="space-y-2">
						<h4 className="font-medium flex items-center gap-2">
							<Users className="h-4 w-4" />
							Recent Locations
						</h4>
						<div className="space-y-2 max-h-48 overflow-y-auto">
							{institutions.slice(0, 8).map((institution) => (
								<div
									key={institution.id}
									className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm"
								>
									<div>
										<div className="font-medium">{institution.name}</div>
										<div className="text-xs text-muted-foreground">
											{institution.city}, {institution.state}
										</div>
									</div>
									<Badge variant="outline" className="text-xs">
										{institution.category}
									</Badge>
								</div>
							))}
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

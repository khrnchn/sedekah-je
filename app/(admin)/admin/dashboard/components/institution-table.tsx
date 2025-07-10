import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { Building2, Calendar, Eye, User } from "lucide-react";
import Link from "next/link";

interface InstitutionTableProps {
	data: Array<{
		id: number;
		name: string;
		status: string;
		category: string;
		state: string;
		city: string;
		contributorName: string | null;
		createdAt: Date;
		reviewedAt: Date | null;
	}>;
}

export function InstitutionTable({
	data: institutions,
}: InstitutionTableProps) {
	const getStatusColor = (status: string) => {
		switch (status) {
			case "pending":
				return "warning";
			case "approved":
				return "success";
			case "rejected":
				return "destructive";
			default:
				return "default";
		}
	};

	const getCategoryIcon = (category: string) => {
		return <Building2 className="h-4 w-4" />;
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Building2 className="h-5 w-5" />
					Recent Institutions
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Institution</TableHead>
								<TableHead>Category</TableHead>
								<TableHead>Location</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Contributor</TableHead>
								<TableHead>Created</TableHead>
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{institutions.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={7}
										className="text-center py-8 text-muted-foreground"
									>
										<Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
										<p>No institutions found</p>
									</TableCell>
								</TableRow>
							) : (
								institutions.slice(0, 10).map((institution) => (
									<TableRow key={institution.id}>
										<TableCell>
											<div className="flex items-center gap-2">
												{getCategoryIcon(institution.category)}
												<div>
													<div className="font-medium">{institution.name}</div>
													<div className="text-xs text-muted-foreground">
														ID: {institution.id}
													</div>
												</div>
											</div>
										</TableCell>
										<TableCell>
											<Badge variant="outline" className="text-xs">
												{institution.category}
											</Badge>
										</TableCell>
										<TableCell>
											<div className="text-sm">
												<div>{institution.city}</div>
												<div className="text-xs text-muted-foreground">
													{institution.state}
												</div>
											</div>
										</TableCell>
										<TableCell>
											<Badge
												variant={
													getStatusColor(institution.status) as
														| "default"
														| "secondary"
														| "destructive"
														| "warning"
														| "success"
														| "outline"
												}
												className="text-xs"
											>
												{institution.status}
											</Badge>
										</TableCell>
										<TableCell>
											<div className="flex items-center gap-2">
												<User className="h-4 w-4 text-muted-foreground" />
												<span className="text-sm">
													{institution.contributorName || "Anonymous"}
												</span>
											</div>
										</TableCell>
										<TableCell>
											<div className="flex items-center gap-2">
												<Calendar className="h-4 w-4 text-muted-foreground" />
												<span className="text-sm">
													{formatDistanceToNow(
														new Date(institution.createdAt),
														{
															addSuffix: true,
														},
													)}
												</span>
											</div>
										</TableCell>
										<TableCell className="text-right">
											<Button variant="outline" size="sm" asChild>
												<Link
													href={`/admin/institutions/${
														institution.status === "pending"
															? "pending"
															: institution.status === "approved"
																? "approved"
																: "rejected"
													}/${institution.id}`}
												>
													<Eye className="h-4 w-4 mr-1" />
													View
												</Link>
											</Button>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>
			</CardContent>
		</Card>
	);
}

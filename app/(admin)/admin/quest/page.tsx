import Link from "next/link";
import { AdminLayout } from "@/components/layout/admin-layout";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/date-utils";
import { reviewQuestAttempt } from "./_lib/actions";
import { getPendingExistingQuestAttempts } from "./_lib/queries";

export default async function QuestAttemptsPage() {
	const attempts = await getPendingExistingQuestAttempts();

	return (
		<SidebarProvider>
			<AppSidebar variant="inset" />
			<SidebarInset>
				<AdminLayout
					title="Quest attempts"
					description="Hunters matched these mosques to listings already on sedekah.je"
					breadcrumbs={[
						{ label: "Dashboard", href: "/admin/dashboard" },
						{ label: "Quest attempts" },
					]}
				>
					{attempts.length === 0 ? (
						<p className="py-12 text-center text-sm text-muted-foreground">
							No quest attempts to review.
						</p>
					) : (
						<div className="rounded-md border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Mosque</TableHead>
										<TableHead>Linked listing</TableHead>
										<TableHead>Hunter</TableHead>
										<TableHead>Submitted</TableHead>
										<TableHead className="text-right">Decision</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{attempts.map((attempt) => (
										<TableRow key={attempt.id} className="align-top">
											<TableCell>
												<div className="font-medium">{attempt.mosqueName}</div>
												<div className="text-xs text-muted-foreground">
													{attempt.mosqueAddress ?? attempt.mosqueDistrict}
												</div>
											</TableCell>
											<TableCell>
												<Link
													href={`/${attempt.listingCategory}/${attempt.listingSlug}`}
													target="_blank"
													className="font-medium underline underline-offset-4"
												>
													{attempt.listingName}
												</Link>
												<div className="text-xs text-muted-foreground">
													{attempt.listingAddress ?? attempt.listingCity}
												</div>
												<p className="mt-2 max-w-xs text-xs text-muted-foreground">
													No photo for existing listings. Compare the listing
													name and address with the mosque.
												</p>
											</TableCell>
											<TableCell>{attempt.hunterName ?? "Unknown"}</TableCell>
											<TableCell className="whitespace-nowrap">
												{formatDateTime(attempt.createdAt)}
											</TableCell>
											<TableCell>
												<div className="flex justify-end gap-2">
													<form
														action={reviewQuestAttempt.bind(
															null,
															attempt.id,
															"approved",
														)}
													>
														<Button type="submit" size="sm">
															Approve
														</Button>
													</form>
													<form
														action={reviewQuestAttempt.bind(
															null,
															attempt.id,
															"rejected",
														)}
													>
														<Button type="submit" size="sm" variant="outline">
															Reject
														</Button>
													</form>
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</AdminLayout>
			</SidebarInset>
		</SidebarProvider>
	);
}

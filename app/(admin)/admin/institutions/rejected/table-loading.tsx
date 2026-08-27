import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

// Same DOM as ReusableDataTable so the columns do not shift when the data lands.
const COLUMNS: Array<{ head: string; cell: string }> = [
	{ head: "h-4 w-6", cell: "h-4 w-8" },
	{ head: "h-4 w-12", cell: "h-4 w-40" },
	{ head: "h-4 w-16", cell: "h-5 w-16 rounded-md" },
	{ head: "h-4 w-10", cell: "h-4 w-20" },
	{ head: "h-4 w-8", cell: "h-4 w-20" },
	{ head: "h-4 w-20", cell: "h-4 w-24" },
	{ head: "h-4 w-28", cell: "h-4 w-28" },
	{ head: "h-4 w-4", cell: "h-8 w-20 rounded-md" },
];

export default function RejectedTableLoading() {
	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div className="flex flex-wrap items-center gap-2">
					<Skeleton className="h-8 w-[150px] rounded-md lg:w-[250px]" />
					<Skeleton className="h-8 w-36 rounded-md" />
					<Skeleton className="h-8 w-36 rounded-md" />
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Skeleton className="h-8 w-20 rounded-md" />
				</div>
			</div>
			<div className="overflow-auto rounded-lg border">
				<Table>
					<TableHeader>
						<TableRow>
							{COLUMNS.map((column) => (
								<TableHead key={column.head + column.cell}>
									<Skeleton className={column.head} />
								</TableHead>
							))}
						</TableRow>
					</TableHeader>
					<TableBody>
						{Array.from({ length: 8 }).map((_, rowIndex) => (
							<TableRow key={rowIndex}>
								{COLUMNS.map((column) => (
									<TableCell key={column.head + column.cell}>
										<Skeleton className={column.cell} />
									</TableCell>
								))}
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
			<div className="flex items-center justify-between px-2">
				<Skeleton className="h-4 w-44" />
				<div className="flex items-center gap-6 lg:gap-8">
					<Skeleton className="h-8 w-[150px] rounded-md" />
					<Skeleton className="h-4 w-24" />
					<div className="flex items-center gap-2">
						<Skeleton className="hidden h-8 w-8 rounded-md lg:block" />
						<Skeleton className="h-8 w-8 rounded-md" />
						<Skeleton className="h-8 w-8 rounded-md" />
						<Skeleton className="hidden h-8 w-8 rounded-md lg:block" />
					</div>
				</div>
			</div>
		</div>
	);
}

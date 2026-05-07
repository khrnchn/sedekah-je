import Link from "next/link";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const PageHeader = ({
	pageTitle,
	showHeader,
}: {
	pageTitle: string;
	showHeader: boolean;
}) => {
	return (
		<div>
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink asChild>
							<Link href="/">Laman Utama</Link>
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbPage>{pageTitle}</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>

			{showHeader && (
				<h2 className="pt-4 text-lg font-semibold text-foreground">
					{pageTitle}
				</h2>
			)}
		</div>
	);
};

export default PageHeader;

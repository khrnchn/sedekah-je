"use client";

import Link from "next/link";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { TextReveal } from "@/components/ui/text-reveal";

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
				<TextReveal>
					<h2 className="text-lg font-bold pt-4">{pageTitle}</h2>
				</TextReveal>
			)}
		</div>
	);
};

export default PageHeader;

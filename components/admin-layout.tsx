import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Home } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";

interface AdminBreadcrumbItem {
	label: string;
	href?: string;
}

interface AdminLayoutProps {
	children: React.ReactNode;
	title?: string;
	description?: string;
	breadcrumbs?: AdminBreadcrumbItem[];
}

// Client-side sidebar trigger component
import { ClientSidebarTrigger } from "./client-sidebar-trigger";

// Server component for breadcrumbs
function ServerBreadcrumbs({
	breadcrumbs,
}: { breadcrumbs?: AdminBreadcrumbItem[] }) {
	return (
		<Breadcrumb>
			<BreadcrumbList>
				<BreadcrumbItem>
					<BreadcrumbLink asChild>
						<Link href="/admin/dashboard" className="flex items-center gap-1">
							<Home className="h-4 w-4" />
							<span className="sr-only">Admin Dashboard</span>
						</Link>
					</BreadcrumbLink>
				</BreadcrumbItem>
				{breadcrumbs?.map((item, index) => (
					<Fragment key={index}>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							{item.href ? (
								<BreadcrumbLink asChild>
									<Link href={item.href}>{item.label}</Link>
								</BreadcrumbLink>
							) : (
								<BreadcrumbPage>{item.label}</BreadcrumbPage>
							)}
						</BreadcrumbItem>
					</Fragment>
				))}
			</BreadcrumbList>
		</Breadcrumb>
	);
}

// Server component for admin header
function AdminHeader({ breadcrumbs }: { breadcrumbs?: AdminBreadcrumbItem[] }) {
	return (
		<header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
			<div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
				<ClientSidebarTrigger />
				<Separator
					orientation="vertical"
					className="mx-2 data-[orientation=vertical]:h-4"
				/>
				<ServerBreadcrumbs breadcrumbs={breadcrumbs} />
			</div>
		</header>
	);
}

// Main AdminLayout server component
export function AdminLayout({
	children,
	title,
	description,
	breadcrumbs,
}: AdminLayoutProps) {
	return (
		<>
			<AdminHeader breadcrumbs={breadcrumbs} />
			<div className="flex flex-1 flex-col">
				<div className="@container/main flex flex-1 flex-col gap-2">
					<div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
						{(title || description) && (
							<div className="px-4 lg:px-6">
								{title && (
									<h1 className="text-2xl font-semibold tracking-tight">
										{title}
									</h1>
								)}
								{description && (
									<p className="text-muted-foreground mt-1">{description}</p>
								)}
							</div>
						)}
						<div className="px-4 lg:px-6">{children}</div>
					</div>
				</div>
			</div>
		</>
	);
}

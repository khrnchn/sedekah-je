import { PWAInstallPrompt } from "@/components/pwa-touch-enhancements";
import { Header } from "@/components/ui/header";
import PageSection from "@/components/ui/pageSection";

interface UserBreadcrumbItem {
	label: string;
	href?: string;
}

interface UserLayoutProps {
	children: React.ReactNode;
	title?: string;
	description?: string;
	breadcrumbs?: UserBreadcrumbItem[];
	fullWidth?: boolean;
	pageSection?: boolean;
}

// Server component for user page header
function UserPageHeader({
	title,
	description,
}: {
	title?: string;
	description?: string;
}) {
	if (!title && !description) return null;

	return (
		<div className="text-center space-y-2">
			{title && <h1 className="text-3xl font-bold tracking-tight">{title}</h1>}
			{description && (
				<p className="text-muted-foreground max-w-2xl mx-auto">{description}</p>
			)}
		</div>
	);
}

// Main UserLayout server component with hybrid approach
export function UserLayout({
	children,
	title,
	description,
	fullWidth = false,
	pageSection = true,
}: UserLayoutProps) {
	const content = (
		<div className="space-y-8">
			<UserPageHeader title={title} description={description} />
			{children}
		</div>
	);

	return (
		<>
			<Header />
			<main className="flex-1">
				{pageSection ? (
					<PageSection className={fullWidth ? "max-w-none" : ""}>
						{content}
					</PageSection>
				) : (
					<div className={fullWidth ? "" : "container mx-auto px-4"}>
						{content}
					</div>
				)}
			</main>
			<PWAInstallPrompt />
		</>
	);
}

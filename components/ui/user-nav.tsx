"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { BarChart3, Home, LogOut, Menu, Plus, Settings, Trophy, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const userNavItems = [
	{
		title: "Laman Utama",
		href: "/",
		icon: Home,
		description: "Kembali ke laman utama"
	},
	{
		title: "Tambah Institusi",
		href: "/contribute",
		icon: Plus,
		description: "Tambah institusi baru",
		badge: "Aktif"
	},
	{
		title: "Carta Penyumbang",
		href: "/leaderboard",
		icon: Trophy,
		description: "Lihat carta"
	},
	{
		title: "Sumbangan Saya",
		href: "/my-contributions",
		icon: BarChart3,
		description: "Lihat sumbangan anda"
	}
];

const secondaryNavItems = [
	{
		title: "Tetapan",
		href: "/settings",
		icon: Settings,
		description: "Tukar tetapan akaun"
	}
];

export function UserNav() {
	const pathname = usePathname();
	const { user, isAuthenticated, signOut } = useAuth();

	const handleSignOut = async () => {
		await signOut();
	};

	if (!isAuthenticated) {
		return (
			<Link href="/auth">
				<Button variant="outline" size="sm">
					Login
				</Button>
			</Link>
		);
	}

	return (
		<Sheet>
			<SheetTrigger asChild>
				<Button variant="outline" size="icon" className="md:hidden">
					<Menu className="h-4 w-4" />
					<span className="sr-only">Toggle navigation</span>
				</Button>
			</SheetTrigger>
			<SheetContent side="left" className="w-[280px] p-0">
				<div className="flex flex-col h-full">
					{/* Header */}
					<div className="p-6 border-b">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
								<User className="h-5 w-5 text-white" />
							</div>
							<div>
								<div className="font-semibold text-sm">
									{user?.name || "User"}
								</div>
								<div className="text-xs text-muted-foreground">
									0 contribution points
								</div>
							</div>
						</div>
					</div>

					{/* Navigation */}
					<div className="flex-1 overflow-y-auto">
						<nav className="p-4 space-y-2">
							{userNavItems.map((item) => {
								const Icon = item.icon;
								const isActive = pathname === item.href;

								return (
									<Link key={item.href} href={item.href}>
										<div
											className={cn(
												"flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
												isActive && "bg-accent text-accent-foreground"
											)}
										>
											<Icon className="h-4 w-4" />
											<div className="flex-1">
												<div className="font-medium">{item.title}</div>
												<div className="text-xs text-muted-foreground">
													{item.description}
												</div>
											</div>
											{item.badge && (
												<Badge variant="secondary" className="text-xs">
													{item.badge}
												</Badge>
											)}
										</div>
									</Link>
								);
							})}
						</nav>

						<Separator className="mx-4" />

						<nav className="p-4 space-y-2">
							{secondaryNavItems.map((item) => {
								const Icon = item.icon;
								const isActive = pathname === item.href;

								return (
									<Link key={item.href} href={item.href}>
										<div
											className={cn(
												"flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
												isActive && "bg-accent text-accent-foreground"
											)}
										>
											<Icon className="h-4 w-4" />
											<div className="flex-1">
												<div className="font-medium">{item.title}</div>
												<div className="text-xs text-muted-foreground">
													{item.description}
												</div>
											</div>
										</div>
									</Link>
								);
							})}
						</nav>
					</div>

					{/* Footer */}
					<div className="p-4 border-t">
						<Button
							variant="ghost"
							className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
							onClick={handleSignOut}
						>
							<LogOut className="h-4 w-4 mr-2" />
							Log Keluar
						</Button>
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
}

export function UserNavDesktop() {
	const pathname = usePathname();
	const { signOut } = useAuth();

	const handleSignOut = async () => {
		await signOut();
	};

	return (
		<div className="hidden md:flex items-center gap-6">
			{userNavItems.slice(1).map((item) => {
				const Icon = item.icon;
				const isActive = pathname === item.href;

				return (
					<Link key={item.href} href={item.href}>
						<div
							className={cn(
								"flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
								isActive && "bg-accent text-accent-foreground"
							)}
						>
							<Icon className="h-4 w-4" />
							{item.title}
							{item.badge && (
								<Badge variant="secondary" className="text-xs ml-1">
									{item.badge}
								</Badge>
							)}
						</div>
					</Link>
				);
			})}

			<Button
				variant="ghost"
				size="sm"
				className="text-red-600 hover:text-red-700 hover:bg-red-50"
				onClick={handleSignOut}
			>
				<LogOut className="h-4 w-4 mr-2" />
				Log Keluar
			</Button>
		</div>
	);
}
"use client";

import {
	BarChart,
	HeartHandshake,
	HelpCircle,
	Home,
	LayoutDashboard,
	Loader2,
	LogIn,
	LogOut,
	Menu,
	Moon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { OnboardingSambungButton } from "@/components/onboarding/onboarding-sambung-button";
import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { signInWithGoogle } from "@/lib/auth-client";
import { isCurrentGregorianYearRamadhanActive } from "@/lib/ramadhan";
import { cn } from "@/lib/utils";
import { ModeToggle } from "./mode-toggle";
import { UserNavDesktop } from "./user-nav";

const links = [
	{
		name: "Laman Utama",
		href: "/",
		icon: Home,
	},
	{
		name: "Semua sumbangan",
		href: "/my-contributions",
		icon: LayoutDashboard,
	},
	{
		name: "Sumbang QR",
		href: "/contribute",
		icon: HeartHandshake,
	},
	{
		name: "Carta Penyumbang",
		href: "/leaderboard",
		icon: BarChart,
	},
	{
		name: "Ramadhan",
		href: "/ramadhan",
		icon: Moon,
	},
];

const publicLinks = [
	{ name: "Laman Utama", href: "/", icon: Home },
	{ name: "Sumbang QR", href: "/contribute", icon: HeartHandshake },
	{ name: "Carta Penyumbang", href: "/leaderboard", icon: BarChart },
	{ name: "Ramadhan", href: "/ramadhan", icon: Moon },
];

interface HeaderProps {
	compactMobileBrand?: boolean;
}

export const Header = ({ compactMobileBrand = false }: HeaderProps) => {
	const isMobile = useIsMobile();
	const { user, isAuthenticated, isAdmin, signOut, isLoading } = useAuth();
	const pathname = usePathname();
	const [open, setOpen] = useState(false);
	const showRamadhanLink = isCurrentGregorianYearRamadhanActive();
	const showBrandText = !compactMobileBrand || !isMobile;
	const logoSize = compactMobileBrand && isMobile ? 76 : 100;
	const mobileLinks = (isAuthenticated ? links : publicLinks).filter(
		(link) => showRamadhanLink || link.href !== "/ramadhan",
	);
	const desktopPublicLinks = publicLinks.filter(
		(link) => showRamadhanLink || link.href !== "/ramadhan",
	);

	const handleSignOut = async () => {
		setOpen(false);
		await signOut();
	};

	const handleLogin = async () => {
		if (isLoading) return;
		await signInWithGoogle();
	};

	return (
		<>
			<header
				className={cn(
					"flex flex-col md:flex-row items-center justify-center py-4 md:py-6 gap-2 relative",
					compactMobileBrand && isMobile && "py-3 gap-1",
				)}
			>
				<Link href="/">
					<Image
						src="/masjid.svg"
						alt="Masjid"
						width={logoSize}
						height={logoSize}
					/>
				</Link>
				{showBrandText && (
					<div className="flex flex-col items-center md:items-start">
						<Link href="/">
							<h1 className="text-2xl md:text-3xl font-bold text-foreground">
								SedekahJe
							</h1>
						</Link>
						<p className="text-base md:text-lg text-gray-600 dark:text-gray-400 text-center md:text-left">
							Senarai QR masjid, surau, dan institusi.
						</p>
					</div>
				)}

				{/* Mobile Menu - Top Left */}
				{isMobile && (
					<div className="absolute top-5 left-5 md:hidden">
						<Drawer open={open} onOpenChange={setOpen}>
							<DrawerTrigger asChild>
								<Button
									variant="outline"
									size="icon"
									className="rounded-full shadow-lg border-2"
									data-tour="nav-menu"
								>
									<Menu className="h-4 w-4" />
								</Button>
							</DrawerTrigger>
							<DrawerContent>
								<DrawerHeader>
									<DrawerTitle>
										{isAuthenticated
											? `Hello, ${user?.name || "User"}`
											: "Menu"}
									</DrawerTitle>
									<DrawerDescription>
										{isAuthenticated
											? "Pautan navigasi untuk akaun anda"
											: "Terokai ciri sedekah.je"}
									</DrawerDescription>
								</DrawerHeader>
								<div className="grid grid-cols-2 gap-2 p-4">
									{isAuthenticated && (
										<div className="col-span-2">
											<OnboardingSambungButton
												variant="outline"
												size="sm"
												className="w-full"
											/>
										</div>
									)}
									{mobileLinks.map((link) => (
										<Link
											key={link.href}
											href={link.href}
											onClick={() => setOpen(false)}
											className={cn(
												"flex flex-col items-center justify-center rounded-lg p-3 hover:bg-accent",
												pathname === link.href &&
													"bg-accent text-accent-foreground",
											)}
										>
											<link.icon className="size-5" />
											<span className="mt-1 text-xs font-medium">
												{link.name}
											</span>
										</Link>
									))}
									<Link
										href="/faq"
										onClick={() => setOpen(false)}
										className={cn(
											"flex flex-col items-center justify-center rounded-lg p-3 hover:bg-accent",
											pathname === "/faq" && "bg-accent text-accent-foreground",
										)}
									>
										<HelpCircle className="size-5" />
										<span className="mt-1 text-xs font-medium">
											Soalan Lazim
										</span>
									</Link>
									{isAuthenticated && isAdmin && (
										<Link
											href="/admin/dashboard"
											onClick={() => setOpen(false)}
											className={cn(
												"flex flex-col items-center justify-center rounded-lg p-3 hover:bg-accent",
												pathname === "/admin/dashboard" &&
													"bg-accent text-accent-foreground",
											)}
										>
											<LayoutDashboard className="size-5" />
											<span className="mt-1 text-xs font-medium">
												Admin Panel
											</span>
										</Link>
									)}
								</div>
								<div className="p-4 border-t">
									{isAuthenticated ? (
										<Button
											variant="ghost"
											className="w-full flex items-center justify-center text-red-500"
											onClick={handleSignOut}
										>
											<LogOut className="size-5 mr-2" />
											<span className="text-sm font-medium">Log Keluar</span>
										</Button>
									) : (
										<Link href="/auth" onClick={() => setOpen(false)}>
											<Button
												variant="default"
												className="w-full flex items-center justify-center"
											>
												<LogIn className="size-5 mr-2" />
												<span className="text-sm font-medium">Log Masuk</span>
											</Button>
										</Link>
									)}
								</div>
							</DrawerContent>
						</Drawer>
					</div>
				)}

				{/* Theme Toggle - Top Right */}
				<div className="absolute top-5 right-5 flex items-center gap-2">
					<ModeToggle />
				</div>
			</header>

			{/* Desktop Navigation */}
			{!isMobile && (
				<div
					className="hidden md:flex justify-center py-4 border-b"
					data-tour="nav-desktop"
				>
					{isAuthenticated ? (
						<UserNavDesktop />
					) : (
						<div className="flex items-center gap-4">
							{desktopPublicLinks.map((link) => {
								const Icon = link.icon;
								const isActive = pathname === link.href;
								return (
									<Link key={link.href} href={link.href}>
										<div
											className={cn(
												"flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
												isActive && "bg-accent text-accent-foreground",
											)}
										>
											<Icon className="h-4 w-4" />
											{link.name}
										</div>
									</Link>
								);
							})}
							<Button
								variant="outline"
								size="sm"
								className="gap-2"
								onClick={handleLogin}
								disabled={isLoading}
							>
								{isLoading ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<LogIn className="h-4 w-4" />
								)}
								Log Masuk
							</Button>
						</div>
					)}
				</div>
			)}

			<div className="h-24 w-full absolute top-0 left-0 bg-gradient-to-b from-orange-300 to-background -z-10 opacity-20 dark:opacity-5" />
		</>
	);
};

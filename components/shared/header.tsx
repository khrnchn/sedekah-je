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
		name: "Submission",
		href: "/my-contributions",
		icon: LayoutDashboard,
	},
	{
		name: "Sumbang QR",
		href: "/contribute",
		icon: HeartHandshake,
	},
	{
		name: "Carta Penghantar QR",
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
	{ name: "Carta Penghantar QR", href: "/leaderboard", icon: BarChart },
	{ name: "Ramadhan", href: "/ramadhan", icon: Moon },
];

interface HeaderProps {
	compactMobileBrand?: boolean;
}

export const Header = (_props: HeaderProps = {}) => {
	const isMobile = useIsMobile();
	const { user, isAuthenticated, isAdmin, signOut, isLoading } = useAuth();
	const pathname = usePathname();
	const [open, setOpen] = useState(false);
	const showRamadhanLink = isCurrentGregorianYearRamadhanActive();
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

	const drawerContent = (
		<DrawerContent>
			<DrawerHeader>
				<DrawerTitle>
					{isAuthenticated ? `Hello, ${user?.name || "User"}` : "Menu"}
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
							"flex flex-col items-center justify-center rounded-lg p-3 transition-colors hover:bg-primary/10 hover:text-primary",
							pathname === link.href && "bg-primary/10 text-primary",
						)}
					>
						<link.icon className="size-5" />
						<span className="mt-1 text-xs font-medium">{link.name}</span>
					</Link>
				))}
				<Link
					href="/faq"
					onClick={() => setOpen(false)}
					className={cn(
						"flex flex-col items-center justify-center rounded-lg p-3 transition-colors hover:bg-primary/10 hover:text-primary",
						pathname === "/faq" && "bg-primary/10 text-primary",
					)}
				>
					<HelpCircle className="size-5" />
					<span className="mt-1 text-xs font-medium">Soalan Lazim</span>
				</Link>
				{isAuthenticated && isAdmin && (
					<Link
						href="/admin/dashboard"
						onClick={() => setOpen(false)}
						className={cn(
							"flex flex-col items-center justify-center rounded-lg p-3 transition-colors hover:bg-primary/10 hover:text-primary",
							pathname === "/admin/dashboard" && "bg-primary/10 text-primary",
						)}
					>
						<LayoutDashboard className="size-5" />
						<span className="mt-1 text-xs font-medium">Admin Panel</span>
					</Link>
				)}
			</div>
			<div className="p-4 border-t">
				{isAuthenticated ? (
					<Button
						variant="ghost"
						className="w-full flex items-center justify-center text-destructive"
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
	);

	return (
		<>
			{isMobile ? (
				/* Mobile: compact horizontal bar */
				<header className="relative flex items-center justify-between px-4 py-3 bg-muted/35">
					<Drawer open={open} onOpenChange={setOpen}>
						<DrawerTrigger asChild>
							<Button
								variant="outline"
								size="icon"
								className="rounded-md border shadow-sm shrink-0"
								data-tour="nav-menu"
							>
								<Menu className="h-4 w-4" />
							</Button>
						</DrawerTrigger>
						{drawerContent}
					</Drawer>

					<div className="flex items-center gap-2">
						<Link href="/">
							<Image
								src="/masjid.svg"
								alt="Masjid"
								width={28}
								height={28}
								priority
							/>
						</Link>
						<Link href="/">
							<span className="text-sm font-bold tracking-tight text-foreground">
								SedekahJe
							</span>
						</Link>
					</div>

					<ModeToggle />
				</header>
			) : (
				/* Desktop: centered column */
				<>
					<header className="relative flex flex-col items-center justify-center gap-2 py-6 md:flex-row">
						<Link href="/">
							<Image
								src="/masjid.svg"
								alt="Masjid"
								width={100}
								height={100}
								priority
							/>
						</Link>
						<div className="flex flex-col items-center md:items-start">
							<Link href="/">
								<h1 className="text-2xl font-bold leading-tight text-foreground md:text-3xl">
									SedekahJe
								</h1>
							</Link>
							<p className="max-w-[34ch] text-center text-sm text-muted-foreground md:text-left md:text-base">
								Direktori QR DuitNow masjid, surau, dan institusi.
							</p>
						</div>

						<div className="absolute top-5 right-5 flex items-center gap-2">
							<ModeToggle />
						</div>
					</header>

					<div
						className="hidden justify-center border-y bg-background/80 py-3 backdrop-blur md:flex"
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
													"flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
													isActive &&
														"bg-primary/10 text-primary font-semibold",
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

					<div className="absolute left-0 top-0 -z-10 h-full w-full bg-muted/35" />
				</>
			)}
		</>
	);
};

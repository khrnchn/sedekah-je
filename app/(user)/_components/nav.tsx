"use client";

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
import { cn } from "@/lib/utils";
import {
	BarChart,
	HeartHandshake,
	LayoutDashboard,
	LogOut,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
	{
		name: "Contributions",
		href: "/my-contributions",
		icon: LayoutDashboard,
	},
	{
		name: "Contribute",
		href: "/contribute",
		icon: HeartHandshake,
	},
	{
		name: "Leaderboard",
		href: "/leaderboard",
		icon: BarChart,
	},
];

export function Nav() {
	const pathname = usePathname();
	const [open, setOpen] = useState(false);
	const { signOut } = useAuth();

	const handleSignOut = async () => {
		setOpen(false);
		await signOut();
	};

	return (
		<div className="fixed bottom-4 left-0 right-0 z-50 flex justify-center md:hidden">
			<Drawer open={open} onOpenChange={setOpen}>
				<DrawerTrigger asChild>
					<Button variant="outline" className="rounded-full shadow-lg border-2">
						Menu
					</Button>
				</DrawerTrigger>
				<DrawerContent>
					<DrawerHeader>
						<DrawerTitle className="sr-only">Menu</DrawerTitle>
						<DrawerDescription className="sr-only">
							Navigation links for your account
						</DrawerDescription>
					</DrawerHeader>
					<div className="grid grid-cols-3 gap-2 p-4">
						{links.map((link) => (
							<Link
								key={link.href}
								href={link.href}
								onClick={() => setOpen(false)}
								className={cn(
									"flex flex-col items-center justify-center rounded-lg p-3 hover:bg-accent",
									pathname === link.href && "bg-accent text-accent-foreground",
								)}
							>
								<link.icon className="size-5" />
								<span className="mt-1 text-xs font-medium">{link.name}</span>
							</Link>
						))}
					</div>
					<div className="p-4 border-t">
						<Button
							variant="ghost"
							className="w-full flex items-center justify-center text-red-500"
							onClick={handleSignOut}
						>
							<LogOut className="size-5 mr-2" />
							<span className="text-sm font-medium">Logout</span>
						</Button>
					</div>
				</DrawerContent>
			</Drawer>
		</div>
	);
}

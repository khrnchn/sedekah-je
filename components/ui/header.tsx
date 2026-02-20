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
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  BarChart,
  HeartHandshake,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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

export const Header = () => {
  const isMobile = useIsMobile();
  const { user, isAuthenticated, isAdmin, signOut } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
  };

  return (
    <>
      <header className="flex flex-col md:flex-row items-center justify-center py-8 gap-5 relative">
        <Link href="/">
          <Image src="/masjid.svg" alt="Masjid" width={100} height={100} />
        </Link>
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

        {/* Mobile Menu - Top Left */}
        {isMobile && isAuthenticated && (
          <div className="absolute top-5 left-5 md:hidden">
            <Drawer open={open} onOpenChange={setOpen}>
              <DrawerTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full shadow-lg border-2">
                  <Menu className="h-4 w-4" />
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Hello, {user?.name || "User"}</DrawerTitle>
                  <DrawerDescription>
                    Pautan navigasi untuk akaun anda
                  </DrawerDescription>
                </DrawerHeader>
                <div className="grid grid-cols-2 gap-2 p-4">
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
                  {isAdmin && (
                    <Link
                      href="/admin/dashboard"
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex flex-col items-center justify-center rounded-lg p-3 hover:bg-accent",
                        pathname === "/admin/dashboard" && "bg-accent text-accent-foreground",
                      )}
                    >
                      <LayoutDashboard className="size-5" />
                      <span className="mt-1 text-xs font-medium">Admin Panel</span>
                    </Link>
                  )}
                </div>
                <div className="p-4 border-t">
                  <Button
                    variant="ghost"
                    className="w-full flex items-center justify-center text-red-500"
                    onClick={handleSignOut}
                  >
                    <LogOut className="size-5 mr-2" />
                    <span className="text-sm font-medium">Log Keluar</span>
                  </Button>
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
      {!isMobile && isAuthenticated && (
        <div className="hidden md:flex justify-center py-4 border-b">
          <UserNavDesktop />
        </div>
      )}

      <div className="h-24 w-full absolute top-0 left-0 bg-gradient-to-b from-orange-300 to-background -z-10 opacity-20 dark:opacity-5" />
    </>
  );
};

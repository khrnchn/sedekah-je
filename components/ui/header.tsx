"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import Image from "next/image";
import Link from "next/link";
import { ModeToggle } from "./mode-toggle";
import { UserNavDesktop } from "./user-nav";

export const Header = () => {
  const isMobile = useIsMobile();

  return (
    <>
      <header className="flex flex-col md:flex-row items-center justify-center py-8 gap-5 relative">
        <Link href="/">
          <Image src="/masjid.svg" alt="Masjid" width={100} height={100} />
        </Link>
        <div className="hidden md:flex flex-col items-center md:items-start">
          <Link href="/">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              SedekahJe
            </h1>
          </Link>
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 text-center md:text-left">
            List of mosques, prayer rooms, and institutions.
          </p>
        </div>

        <div className="absolute top-5 right-5 flex items-center gap-2">
          <ModeToggle />
        </div>
      </header>

      {/* Desktop Navigation */}
      {!isMobile && (
        <div className="hidden md:flex justify-center py-4 border-b">
          <UserNavDesktop />
        </div>
      )}

      <div className="h-24 w-full absolute top-0 left-0 bg-gradient-to-b from-orange-300 to-background -z-10 opacity-20 dark:opacity-5" />
    </>
  );
};

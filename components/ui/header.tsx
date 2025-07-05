"use client";

import { authClient } from "@/lib/auth-client";
import { LogIn, LogOut, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "./button";
import { ModeToggle } from "./mode-toggle";

export const Header = () => {
  const { data: session } = authClient.useSession();

  const handleSignOut = async () => {
    await authClient.signOut();
    window.location.href = "/";
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
        
        <div className="absolute top-5 right-5 flex items-center gap-2">
          {session ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:inline">
                {session.user.name || session.user.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="bg-gradient-to-br from-red-500 to-red-300 border border-red-400 hover:from-red-600 hover:to-red-400 text-white"
              >
                <LogOut className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Keluar</span>
              </Button>
            </div>
          ) : (
            <Link href="/auth">
              <Button
                variant="outline"
                size="sm"
                className="bg-gradient-to-br from-orange-500 to-orange-300 border border-orange-400 hover:from-orange-600 hover:to-orange-400 text-white"
              >
                <LogIn className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Log Masuk</span>
              </Button>
            </Link>
          )}
          <ModeToggle />
        </div>
      </header>
      <div className="h-24 w-full absolute top-0 left-0 bg-gradient-to-b from-orange-300 to-background -z-10 opacity-20 dark:opacity-5" />
    </>
  );
};

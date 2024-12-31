import { Analytics } from "@vercel/analytics/react";
import { Poppins } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { QueryProvider } from "@/components/providers/query-provider";

const poppins = Poppins({ weight: ["400", "700", "900"], subsets: ["latin"] });

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ms" suppressHydrationWarning>
            <body
                className={cn(
                    "bg-background transition-colors duration-200 ease-in-out overscroll-y-none",
                    poppins.className,
                )}
            >
                <QueryProvider>
                    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                        {children}
                        <Analytics />
                        <Toaster richColors />
                    </ThemeProvider>
                </QueryProvider>
            </body>
        </html>
    );
}

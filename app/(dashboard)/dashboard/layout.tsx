import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { Analytics } from "@vercel/analytics/react";
import { Poppins } from "next/font/google";

const poppins = Poppins({ weight: ["400", "700", "900"], subsets: ["latin"] });

export default function DashboardLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<QueryProvider>
			{/* <ThemeProvider attribute="class" defaultTheme="system" enableSystem> */}
			{children}
			<Analytics />
			<Toaster richColors />
			{/* </ThemeProvider> */}
		</QueryProvider>
	);
}

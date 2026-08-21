"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { signInWithGoogle } from "@/lib/auth-client";
import { Button } from "./ui/button";

const RawakFooter = () => {
	const { user, isLoading } = useAuth();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const handleLogin = async () => {
		if (isLoading) return;
		await signInWithGoogle();
	};

	return (
		<footer className="fixed bottom-0 left-0 right-0 z-50 flex w-full flex-wrap items-center justify-center gap-3 border-t border-border/60 bg-background/90 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-sm backdrop-blur-sm">
			<Button asChild variant="outline">
				<Link href="/rawak">
					<p className="font-medium text-foreground">Sedekah Rawak</p>
				</Link>
			</Button>
			{mounted && !user && (
				<Button variant="outline" onClick={handleLogin} disabled={isLoading}>
					{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
					<p className="font-medium text-foreground">Log Masuk</p>
				</Button>
			)}
		</footer>
	);
};

export default RawakFooter;

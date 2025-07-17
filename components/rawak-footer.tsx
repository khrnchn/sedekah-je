"use client";

import { useAuth } from "@/hooks/use-auth";
import { signInWithGoogle } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
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
		<footer className="h-8 w-full p-8 flex items-center justify-center fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t-2 border-border shadow-sm gap-4">
			<Link href="/rawak">
				<Button
					variant="outline"
					className="bg-gradient-to-br from-orange-500 to-orange-300 border border-orange-400 rounded-full hover:from-orange-600 hover:to-orange-400 transition-colors"
				>
					<p className="text-black font-medium dark:text-white">
						Sedekah Rawak
					</p>
				</Button>
			</Link>
			{mounted && !user && (
				<Button
					variant="outline"
					className="bg-gradient-to-br from-blue-500 to-blue-300 border border-blue-400 rounded-full hover:from-blue-700 hover:to-blue-500 transition-colors duration-300"
					onClick={handleLogin}
					disabled={isLoading}
				>
					{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
					<p className="text-black font-medium bold dark:text-white">
						Log Masuk
					</p>
				</Button>
			)}
		</footer>
	);
};

export default RawakFooter;

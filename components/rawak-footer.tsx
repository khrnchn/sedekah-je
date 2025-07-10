"use client";

import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { Button } from "./ui/button";

const RawakFooter = () => {
	const router = useRouter();
	const { isAuthenticated, isLoading } = useAuth();

	const handleAddQrClick = () => {
		if (isLoading) {
			return;
		}
		if (isAuthenticated) {
			router.push("/contribute");
		} else {
			router.push("/auth");
		}
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
			<Button
				variant="outline"
				className="bg-gradient-to-br from-blue-500 to-blue-300 border border-blue-400 rounded-full hover:from-blue-700 hover:to-blue-500 transition-colors duration-300"
				onClick={handleAddQrClick}
				disabled={isLoading}
			>
				{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
				<p className="text-black font-medium bold dark:text-white">Log Masuk</p>
			</Button>
		</footer>
	);
};

export default RawakFooter;

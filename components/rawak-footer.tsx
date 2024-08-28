import Link from "next/link";
import React from "react";
import { Button } from "./ui/button";

const RawakFooter = () => {
	return (
		<footer className="h-8 w-full p-8 flex items-center justify-center fixed bottom-0 bg-background border-t-2 border-border shadow-sm">
			<Link href="/rawak">
				<Button
					variant="outline"
					className="bg-gradient-to-br from-orange-500 to-orange-300 border border-orange-400 rounded-full relative"
				>
					<p className="text-background font-medium">Sedekah Rawak</p>
				</Button>
			</Link>
		</footer>
	);
};

export default RawakFooter;

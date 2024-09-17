import Link from "next/link";
import React from "react";
import { Button } from "./ui/button";

const RawakFooter = () => {
	return (
		<footer className="h-8 w-full p-8 flex items-center justify-center fixed bottom-0 left-0 right-0 bg-background border-t-2 border-border shadow-sm gap-4">
			<Link href="/rawak">
				<Button
					variant="outline"
					className="bg-gradient-to-br from-orange-500 to-orange-300 border border-orange-400 rounded-full hover:from-orange-600 hover:to-orange-400 transition-colors"
				>
					<p className="text-black font-medium dark:text-white">Sedekah Rawak</p>
				</Button>
			</Link>
			<a href="https://forms.gle/epGv61AnEWcjYe1C8" target="_blank">
				<Button
					variant="outline"
					className="bg-gradient-to-br from-orange-500 to-orange-300 border border-orange-400 rounded-full hover:from-orange-600 hover:to-orange-400 transition-colors"
				>
					<p className="text-black font-medium bold dark:text-white">Muatnaik QR</p>
				</Button>
			</a>
		</footer>
	);
};


export default RawakFooter;

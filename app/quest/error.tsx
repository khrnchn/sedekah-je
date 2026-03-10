"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function QuestError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error("Quest error:", error);
	}, [error]);

	return (
		<div className="flex min-h-[50dvh] flex-col items-center justify-center bg-zinc-950 p-6">
			<div className="flex flex-col items-center space-y-4 text-center">
				<div className="rounded-full bg-red-500/10 p-3">
					<AlertTriangle className="h-8 w-8 text-red-400" />
				</div>

				<div className="space-y-2">
					<h2 className="text-xl font-semibold text-zinc-100">Ralat berlaku</h2>
					<p className="max-w-sm text-sm text-zinc-400">
						Kami mengalami masalah sementara. Sila cuba lagi atau kembali ke
						halaman utama.
					</p>
				</div>

				<div className="flex flex-col gap-2 sm:flex-row">
					<Button
						onClick={() => reset()}
						variant="default"
						className="gap-2 bg-green-600 hover:bg-green-700"
					>
						<RefreshCw className="h-4 w-4" />
						Cuba lagi
					</Button>
					<Button asChild variant="outline" className="border-zinc-700">
						<Link href="/">Ke Laman Utama</Link>
					</Button>
				</div>

				{process.env.NODE_ENV === "development" && (
					<details className="mt-4 w-full max-w-lg">
						<summary className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-400">
							Butiran ralat (Development)
						</summary>
						<pre className="mt-2 max-h-32 overflow-auto rounded-md bg-zinc-900 p-3 text-xs text-zinc-400">
							{error.message}
							{error.stack && `\n\n${error.stack}`}
						</pre>
					</details>
				)}
			</div>
		</div>
	);
}

"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
	const router = useRouter();

	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
			<div className="max-w-md space-y-4">
				<h1 className="text-2xl font-bold text-foreground">
					Anda Sedang Offline
				</h1>
				<p className="text-muted-foreground">
					Tiada sambungan internet. Sila semak sambungan anda dan cuba lagi.
				</p>
				<Button type="button" onClick={() => router.refresh()}>
					Cuba Lagi
				</Button>
			</div>
		</div>
	);
}

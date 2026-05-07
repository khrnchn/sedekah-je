"use client";

import { CalendarDays } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function RamadhanDayDetailPlaceholder() {
	return (
		<Card className="mt-4 border-primary/15 bg-primary/5">
			<CardContent className="p-6">
				<div className="flex flex-col items-center justify-center gap-4 py-4 text-center">
					<CalendarDays
						className="h-12 w-12 text-muted-foreground"
						aria-hidden
					/>
					<p className="text-sm text-muted-foreground max-w-[260px]">
						Pilih hari dari kalendar di atas untuk lihat QR kod dan butiran
						institusi.
					</p>
				</div>
			</CardContent>
		</Card>
	);
}

"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import type { ExistingInstitution } from "@/lib/queries/institution-duplicate";

export function SubmissionNotice({
	message,
	existingInstitution,
}: {
	message: string;
	existingInstitution?: ExistingInstitution;
}) {
	const noticeRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		noticeRef.current?.scrollIntoView({
			block: "nearest",
			behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
				? "instant"
				: "smooth",
		});
	}, []);

	const approved = existingInstitution?.status === "approved";
	return (
		<div
			ref={noticeRef}
			className={
				existingInstitution
					? "mt-4 min-w-0 space-y-3 rounded-md border border-border bg-muted p-3 text-foreground sm:flex sm:items-center sm:gap-4 sm:space-y-0"
					: "mt-4 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-center"
			}
		>
			<div className="min-w-0 flex-1 break-words text-sm">
				<p
					className={
						existingInstitution ? "font-medium" : "font-medium text-destructive"
					}
				>
					{approved
						? "QR ini sudah disenaraikan."
						: existingInstitution
							? "Anda sudah menghantar QR ini. Sumbangan anda masih dalam semakan."
							: message}
				</p>
				{approved && <p className="mt-1">{existingInstitution.name}</p>}
			</div>
			{existingInstitution && (
				<Button
					asChild
					variant="outline"
					className="min-h-11 w-full shrink-0 sm:w-auto"
				>
					<a href={approved ? existingInstitution.url : "/my-contributions"}>
						{approved ? "Lihat institusi" : "Lihat sumbangan saya"}
					</a>
				</Button>
			)}
		</div>
	);
}

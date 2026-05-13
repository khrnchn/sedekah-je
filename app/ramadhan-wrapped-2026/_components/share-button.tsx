"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ShareButton() {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(window.location.href);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error("Failed to copy Ramadhan Wrapped link", err);
			toast.error("Could not copy link. Please copy it from the address bar.");
		}
	};

	return (
		<Button variant="default" size="sm" onClick={handleCopy}>
			{copied ? "Link copied" : "Share this page"}
		</Button>
	);
}

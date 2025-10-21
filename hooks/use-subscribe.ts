"use client";

import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";

export default function useSubscribe() {
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const [open, setOpen] = useState(false);
	const { toast } = useToast();

	async function handleSubscribe(e: React.FormEvent) {
		e.preventDefault();

		if (!email) return;

		try {
			setLoading(true);

			const res = await fetch("/api/subscribe", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email }),
			});

			if (!res.ok) throw new Error("Failed to subscribe");

			toast({
				title: "✅ Subscribed successfully!",
				description: "Check your inbox for confirmation.",
			});

			setEmail("");
			setOpen(false);
		} catch (err) {
			console.error(err);
			toast({
				title: "❌ Something went wrong",
				description: "Please try again later.",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	}

	// Return all the useful values + handlers
	return {
		email,
		setEmail,
		loading,
		open,
		setOpen,
		handleSubscribe,
	};
}

"use client";

import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { GoogleIcon } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { signInWithGoogle } from "@/lib/auth-client";

const reasonCopyMap: Record<string, string> = {
	submit_qr:
		"Untuk hantar QR, tengok leaderboard, dan uruskan submission anda.",
	view_submissions:
		"Untuk hantar QR, tengok leaderboard, dan uruskan submission anda.",
	login_required:
		"Untuk hantar QR, tengok leaderboard, dan uruskan submission anda.",
};

const getSafeInternalPath = (path: string | null) => {
	if (!path || !path.startsWith("/")) {
		return null;
	}

	if (path.startsWith("//")) {
		return null;
	}

	return path;
};

export default function AuthForm() {
	const searchParams = useSearchParams();
	const nextPath =
		getSafeInternalPath(searchParams.get("next")) ||
		getSafeInternalPath(searchParams.get("redirect")) ||
		"/contribute";
	const reason = searchParams.get("reason") || "login_required";
	const reasonCopy = reasonCopyMap[reason] || reasonCopyMap.login_required;

	const handleGoogleSignIn = async () => {
		try {
			await signInWithGoogle(nextPath);
		} catch {
			toast.error("Gagal log masuk dengan Google");
		}
	};

	return (
		<Card className="w-full max-w-md border-border/80 bg-card">
			<CardHeader className="text-center">
				<CardTitle className="text-xl font-semibold">Log Masuk</CardTitle>
				<CardDescription>{reasonCopy}</CardDescription>
			</CardHeader>
			<CardContent>
				<Button
					type="button"
					variant="outline"
					onClick={handleGoogleSignIn}
					className="mt-2 w-full"
				>
					<GoogleIcon className="mr-2 h-5 w-5" />
					Log Masuk dengan Google
				</Button>
			</CardContent>
		</Card>
	);
}

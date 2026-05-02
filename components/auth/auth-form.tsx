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

export default function AuthForm() {
	const searchParams = useSearchParams();
	const redirectTo = searchParams.get("redirect") || "/contribute";

	const handleGoogleSignIn = async () => {
		try {
			await signInWithGoogle(redirectTo);
		} catch {
			toast.error("Gagal log masuk dengan Google");
		}
	};

	return (
		<Card className="w-full max-w-md border-border/80 bg-card">
			<CardHeader className="text-center">
				<CardTitle className="text-xl font-semibold">Log Masuk</CardTitle>
				<CardDescription>
					Gunakan akaun Google untuk menyumbang dan mengurus QR.
				</CardDescription>
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

"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { GoogleIcon } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { signInWithGoogle } from "@/lib/auth-client";
import { AUTH_REASON_COPY, type AuthReason } from "@/lib/auth-messages";
import { cn } from "@/lib/utils";

interface AuthGateOverlayProps {
	children: React.ReactNode;
	callbackURL: string;
	reason?: AuthReason;
	title?: string;
}

export function AuthGateOverlay({
	children,
	callbackURL,
	reason = "submit_qr",
	title = "Log Masuk",
}: AuthGateOverlayProps) {
	const { isAuthenticated, isLoading } = useAuth();
	const [dialogOpen, setDialogOpen] = useState(true);
	const [isSigningIn, setIsSigningIn] = useState(false);

	const handleGoogleSignIn = async () => {
		setIsSigningIn(true);
		try {
			await signInWithGoogle(callbackURL);
		} catch {
			toast.error("Gagal log masuk dengan Google");
			setIsSigningIn(false);
		}
	};

	if (isLoading) {
		return (
			<div className="flex min-h-[40vh] items-center justify-center">
				<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (isAuthenticated) {
		return <>{children}</>;
	}

	return (
		<div className="relative">
			<div
				className={cn("pointer-events-none select-none blur-[6px] saturate-50")}
				aria-hidden="true"
				inert
			>
				{children}
			</div>
			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>{title}</DialogTitle>
						<DialogDescription>{AUTH_REASON_COPY[reason]}</DialogDescription>
					</DialogHeader>
					<Button
						type="button"
						variant="outline"
						onClick={handleGoogleSignIn}
						disabled={isSigningIn}
						className="w-full"
					>
						{isSigningIn ? (
							<Loader2 className="mr-2 h-5 w-5 animate-spin" />
						) : (
							<GoogleIcon className="mr-2 h-5 w-5" />
						)}
						Log Masuk dengan Google
					</Button>
				</DialogContent>
			</Dialog>
			{!dialogOpen && (
				<div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-6">
					<Button
						type="button"
						className="pointer-events-auto shadow-lg"
						onClick={() => setDialogOpen(true)}
					>
						Log Masuk untuk Hantar QR
					</Button>
				</div>
			)}
		</div>
	);
}

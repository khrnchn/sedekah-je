"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { GoogleIcon } from "@/components/ui/icons";
import { checkAndLogNewUser } from "@/lib/actions/telegram-logging";
import { signInWithGoogle } from "@/lib/auth-client";
import { useSearchParams } from "next/navigation";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { authClient } from "@/lib/auth-client";
// import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AuthForm() {
	const searchParams = useSearchParams();
	const redirectTo = searchParams.get("redirect") || "/contribute";

	// const [isSignUp, setIsSignUp] = useState(false);
	// const [email, setEmail] = useState("");
	// const [password, setPassword] = useState("");
	// const [name, setName] = useState("");
	// const [showPassword, setShowPassword] = useState(false);
	// const [isLoading, setIsLoading] = useState(false);

	// const handleSubmit = async (e: React.FormEvent) => {
	//	e.preventDefault();
	//	setIsLoading(true);

	//	try {
	//		if (isSignUp) {
	//			const result = await authClient.signUp.email({
	//				email,
	//				password,
	//				name,
	//			});

	//			if (result.error) {
	//				toast.error(result.error.message || "Gagal membuat akaun");
	//			} else {
	//				toast.success("Akaun berjaya dibuat! Sila log masuk.");
	//				setIsSignUp(false);
	//			}
	//		} else {
	//			const result = await authClient.signIn.email({
	//				email,
	//				password,
	//			});

	//			if (result.error) {
	//				toast.error(result.error.message || "Gagal log masuk");
	//			} else {
	//				toast.success("Berjaya log masuk!");
	//				window.location.href = "/";
	//			}
	//		}
	//	} catch (error) {
	//		console.error("Auth error:", error);
	//		toast.error(isSignUp ? "Gagal membuat akaun" : "Gagal log masuk");
	//	} finally {
	//		setIsLoading(false);
	//	}
	// };

	const handleGoogleSignIn = async () => {
		try {
			await signInWithGoogle(redirectTo);
			// Check if this is a new user and log to Telegram
			setTimeout(async () => {
				try {
					await checkAndLogNewUser();
				} catch (error) {
					console.error("Failed to check for new user:", error);
				}
			}, 1000); // Wait 1 second for the session to be properly established
		} catch (error) {
			toast.error("Gagal log masuk dengan Google");
		}
	};

	return (
		<Card className="w-full max-w-md">
			<CardHeader className="text-center">
				<CardTitle className="text-2xl font-bold">Log Masuk</CardTitle>
				<CardDescription>Masuk ke akaun SedekahJe anda</CardDescription>
			</CardHeader>
			<CardContent>
				{/* <form onSubmit={handleSubmit} className="space-y-4">
					{isSignUp && (
						<div className="space-y-2">
							<Label htmlFor="name">Nama</Label>
							<div className="relative">
								<User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
								<Input
									id="name"
									type="text"
									placeholder="Masukkan nama anda"
									value={name}
									onChange={(e) => setName(e.target.value)}
									className="pl-10"
									required
								/>
							</div>
						</div>
					)}

					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<div className="relative">
							<Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
							<Input
								id="email"
								type="email"
								placeholder="Masukkan email anda"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="pl-10"
								required
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="password">Kata Laluan</Label>
						<div className="relative">
							<Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
							<Input
								id="password"
								type={showPassword ? "text" : "password"}
								placeholder="Masukkan kata laluan"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="pl-10 pr-10"
								required
							/>
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
							>
								{showPassword ? (
									<EyeOff className="h-4 w-4" />
								) : (
									<Eye className="h-4 w-4" />
								)}
							</button>
						</div>
					</div>

					<Button
						type="submit"
						disabled={isLoading}
						className="w-full bg-gradient-to-br from-orange-500 to-orange-300 hover:from-orange-600 hover:to-orange-400"
					>
						{isLoading ? "Memproses..." : isSignUp ? "Daftar" : "Log Masuk"}
					</Button>
				</form>

				<div className="mt-4 text-center">
					<span className="text-sm text-gray-600">atau</span>
				</div> */}

				<Button
					type="button"
					variant="outline"
					onClick={handleGoogleSignIn}
					className="w-full mt-2"
				>
					<GoogleIcon className="w-5 h-5 mr-2" />
					Log Masuk dengan Google
				</Button>

				{/* <div className="mt-6 text-center">
					<button
						type="button"
						onClick={() => setIsSignUp(!isSignUp)}
						className="text-sm text-orange-600 hover:text-orange-700 font-medium"
					>
						{isSignUp
							? "Sudah ada akaun? Log masuk di sini"
							: "Belum ada akaun? Daftar di sini"}
					</button>
				</div> */}
			</CardContent>
		</Card>
	);
}

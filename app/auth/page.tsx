"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Header } from "@/components/ui/header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PageSection from "@/components/ui/pageSection";
import { authClient } from "@/lib/auth-client";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AuthPage() {
	const [isSignUp, setIsSignUp] = useState(false);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [name, setName] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			if (isSignUp) {
				await authClient.signUp.email({
					email,
					password,
					name,
				});
				toast.success("Akaun berjaya dibuat! Sila log masuk.");
				setIsSignUp(false);
			} else {
				await authClient.signIn.email({
					email,
					password,
				});
				toast.success("Berjaya log masuk!");
				window.location.href = "/";
			}
		} catch (error) {
			toast.error(isSignUp ? "Gagal membuat akaun" : "Gagal log masuk");
		} finally {
			setIsLoading(false);
		}
	};

	const handleGoogleSignIn = async () => {
		try {
			await authClient.signIn.social({
				provider: "google",
			});
		} catch (error) {
			toast.error("Gagal log masuk dengan Google");
		}
	};

	return (
		<>
			<Header />
			<PageSection>
				<div className="flex justify-center items-center min-h-[60vh]">
					<Card className="w-full max-w-md">
						<CardHeader className="text-center">
							<CardTitle className="text-2xl font-bold">
								{isSignUp ? "Daftar Akaun" : "Log Masuk"}
							</CardTitle>
							<CardDescription>
								{isSignUp
									? "Buat akaun baru untuk menggunakan SedekahJe"
									: "Masuk ke akaun SedekahJe anda"}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<form onSubmit={handleSubmit} className="space-y-4">
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
									className="w-full bg-gradient-to-br from-orange-500 to-orange-300 hover:from-orange-600 hover:to-orange-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
								>
									{isLoading
										? "Memproses..."
										: isSignUp
											? "Daftar"
											: "Log Masuk"}
								</Button>
							</form>

							<div className="mt-4 text-center">
								<span className="text-sm text-gray-600">atau</span>
							</div>

							<Button
								type="button"
								variant="outline"
								onClick={handleGoogleSignIn}
								className="w-full mt-2 border-gray-300 hover:bg-gray-50"
							>
								<svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
									<path
										fill="#4285F4"
										d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
									/>
									<path
										fill="#34A853"
										d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
									/>
									<path
										fill="#FBBC05"
										d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
									/>
									<path
										fill="#EA4335"
										d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
									/>
								</svg>
								Log Masuk dengan Google
							</Button>

							<div className="mt-6 text-center">
								<button
									type="button"
									onClick={() => setIsSignUp(!isSignUp)}
									className="text-sm text-orange-600 hover:text-orange-700 font-medium"
								>
									{isSignUp
										? "Sudah ada akaun? Log masuk di sini"
										: "Belum ada akaun? Daftar di sini"}
								</button>
							</div>
						</CardContent>
					</Card>
				</div>
			</PageSection>
		</>
	);
}

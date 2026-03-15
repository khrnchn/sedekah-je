import AuthForm from "@/components/auth/auth-form";
import { Header } from "@/components/shared/header";
import PageSection from "@/components/shared/page-section";

export default function AuthPage() {
	return (
		<>
			<Header />
			<PageSection>
				<div className="flex justify-center items-center min-h-[60vh]">
					<AuthForm />
				</div>
			</PageSection>
		</>
	);
}

"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { CooldownTimer } from "@/app/(user)/contribute/_components/cooldown-timer";
import {
	type QuestSubmitState,
	submitQuestAttempt,
} from "@/app/quest/_lib/actions";
import type { QuestMosqueView } from "@/app/quest/_lib/types";
import type { QuestView } from "@/app/quest/_lib/url-state";
import { GoogleIcon } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useQrExtractionLazy } from "@/hooks/use-qr-extraction-lazy";
import { signInWithGoogle } from "@/lib/auth-client";

type QuestContributeFormProps = {
	mosque: QuestMosqueView;
	view: QuestView;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

const SUCCESS_COPY = {
	new: "Thanks. Your QR is in review.",
	existing: "Thanks. We'll check this matches the existing listing.",
} as const;

function ContributeFormContent({
	mosque,
	view,
}: {
	mosque: QuestMosqueView;
	view: QuestView;
}) {
	const { isAuthenticated, isLoading: authLoading } = useAuth();
	const { qrContent, qrExtracting, handleQrImageChange } =
		useQrExtractionLazy();
	const [state, formAction, pending] = useActionState<
		QuestSubmitState,
		FormData
	>(submitQuestAttempt, { status: "idle" });
	const [, startTransition] = useTransition();
	const [fileError, setFileError] = useState<string | null>(null);
	const [hasFile, setHasFile] = useState(false);

	if (authLoading) {
		return (
			<div className="flex items-center justify-center py-8">
				<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (!isAuthenticated) {
		// view=map is the default, so the shell's URL omits it
		const callback = `/quest?${view === "map" ? "" : `view=${view}&`}m=${mosque.id}`;
		return (
			<div className="space-y-3">
				<p className="text-sm text-muted-foreground">
					Sign in to submit a QR for this mosque.
				</p>
				<Button
					type="button"
					variant="outline"
					className="h-11 w-full"
					onClick={() => signInWithGoogle(callback)}
				>
					<GoogleIcon className="mr-2 h-5 w-5" />
					Sign in with Google
				</Button>
			</div>
		);
	}

	if (state.status === "success") {
		return (
			<output className="block py-2 text-sm text-foreground">
				{SUCCESS_COPY[state.kind]}
			</output>
		);
	}

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				const data = new FormData(e.currentTarget);
				startTransition(() => formAction(data));
			}}
			className="space-y-4"
		>
			<input type="hidden" name="questMosqueId" value={mosque.id} />
			<input type="hidden" name="qrContent" value={qrContent ?? ""} />

			<div className="space-y-1.5">
				<label
					htmlFor="quest-qr-image"
					className="text-sm font-medium text-foreground"
				>
					QR photo
				</label>
				<Input
					id="quest-qr-image"
					name="qrImage"
					type="file"
					accept="image/*"
					required
					className="h-11 cursor-pointer py-2"
					onChange={(e) => {
						const file = e.target.files?.[0];
						setHasFile(!!file);
						if (file && file.size > 5 * 1024 * 1024) {
							setFileError("The photo must be 5MB or smaller.");
						} else if (file && !file.type.startsWith("image/")) {
							setFileError("The file must be an image.");
						} else {
							setFileError(null);
						}
						handleQrImageChange(e);
					}}
				/>
			</div>

			<div className="space-y-1.5">
				<label
					htmlFor="quest-source-url"
					className="text-sm font-medium text-foreground"
				>
					Source link{" "}
					<span className="font-normal text-muted-foreground">(optional)</span>
				</label>
				<Input
					id="quest-source-url"
					name="sourceUrl"
					type="text"
					inputMode="url"
					placeholder="https://facebook.com/post/..."
					className="h-11"
				/>
			</div>

			<div aria-live="polite" className="space-y-2 text-sm">
				{fileError && <p className="text-destructive">{fileError}</p>}
				{state.status === "error" && (
					<>
						<p className="text-destructive">{state.message}</p>
						{state.existingUrl && (
							<Link
								href={state.existingUrl}
								className="inline-flex min-h-11 items-center font-medium text-foreground underline"
							>
								View existing listing
							</Link>
						)}
						{state.cooldownEndsAt && (
							<CooldownTimer cooldownEndsAt={state.cooldownEndsAt} />
						)}
					</>
				)}
			</div>

			<Button
				type="submit"
				className="h-11 w-full"
				disabled={!hasFile || !!fileError || qrExtracting || pending}
			>
				{pending ? (
					<>
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						Submitting...
					</>
				) : (
					"Submit"
				)}
			</Button>
		</form>
	);
}

export default function QuestContributeForm({
	mosque,
	view,
	open,
	onOpenChange,
}: QuestContributeFormProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="quest-portal quest-submit-dialog border-border bg-card sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="pr-8 text-left text-foreground">
						Submit QR for {mosque.name}
					</DialogTitle>
				</DialogHeader>
				<ContributeFormContent mosque={mosque} view={view} />
			</DialogContent>
		</Dialog>
	);
}

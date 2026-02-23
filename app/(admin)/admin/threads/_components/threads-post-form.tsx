"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createThreadsPostAction } from "../_lib/actions";

type Props = {
	isConfigured: boolean;
};

export function ThreadsPostForm({ isConfigured }: Props) {
	const initialState = { status: "idle" } as const;
	const [state, formAction, isPending] = useActionState(
		createThreadsPostAction,
		initialState,
	);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Create Threads Post</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{!isConfigured && (
					<div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
						Missing configuration. Set <code>THREADS_USER_ID</code> and{" "}
						<code>THREADS_ACCESS_TOKEN</code> in your environment first.
					</div>
				)}

				{state.status === "success" && (
					<div className="rounded-md border border-primary/30 bg-primary/10 p-3 text-sm">
						<p className="font-medium">{state.message}</p>
						<p className="text-muted-foreground mt-1">
							Post ID: <code>{state.postId}</code>
						</p>
						<p className="text-muted-foreground">
							Container ID: <code>{state.containerId}</code>
						</p>
						{state.replyToId && (
							<p className="text-muted-foreground">
								Replying to: <code>{state.replyToId}</code>
							</p>
						)}
					</div>
				)}

				{state.status === "error" && state.message && (
					<div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
						{state.message}
					</div>
				)}

				<form action={formAction} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="threads-text">Post text</Label>
						<Textarea
							id="threads-text"
							name="text"
							placeholder="Write your post (max 500 chars)"
							maxLength={500}
							required
							rows={6}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="reply-to-id">Reply to post ID (optional)</Label>
						<Input
							id="reply-to-id"
							name="reply_to_id"
							placeholder="Paste previous post ID to continue a thread"
						/>
						<p className="text-muted-foreground text-xs">
							Leave empty to create a new root post. Fill this to post as a
							reply in an existing thread chain.
						</p>
					</div>

					<Button type="submit" disabled={!isConfigured || isPending}>
						{isPending ? "Publishing..." : "Publish to Threads"}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}

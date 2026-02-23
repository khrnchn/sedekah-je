"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createThreadsPostAction } from "../_lib/actions";

type Props = {
	isConfigured: boolean;
	recentPosts: Array<{
		id: string;
		text?: string;
		timestamp?: string;
	}>;
};

const LAST_POST_ID_STORAGE_KEY = "threads:last-post-id";

export function ThreadsPostForm({ isConfigured, recentPosts }: Props) {
	const initialState = { status: "idle" } as const;
	const [state, formAction, isPending] = useActionState(
		createThreadsPostAction,
		initialState,
	);
	const [replyToId, setReplyToId] = useState("");
	const [hydrated, setHydrated] = useState(false);

	useEffect(() => {
		setHydrated(true);
		try {
			const cachedPostId = window.localStorage.getItem(
				LAST_POST_ID_STORAGE_KEY,
			);
			if (cachedPostId) {
				setReplyToId(cachedPostId);
			}
		} catch {
			// Ignore storage access issues (private mode, blocked storage, etc).
		}
	}, []);

	useEffect(() => {
		if (state.status === "success" && state.postId) {
			setReplyToId(state.postId);
			try {
				window.localStorage.setItem(LAST_POST_ID_STORAGE_KEY, state.postId);
			} catch {
				// Ignore storage access issues (private mode, blocked storage, etc).
			}
		}
	}, [state.status, state.postId]);

	const useCachedPostId = () => {
		try {
			const cachedPostId = window.localStorage.getItem(
				LAST_POST_ID_STORAGE_KEY,
			);
			if (cachedPostId) {
				setReplyToId(cachedPostId);
			}
		} catch {
			// Ignore storage access issues (private mode, blocked storage, etc).
		}
	};

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
							value={replyToId}
							onChange={(event) => setReplyToId(event.target.value)}
							placeholder="Paste previous post ID to continue a thread"
						/>
						<p className="text-muted-foreground text-xs">
							Leave empty to create a new root post. Fill this to post as a
							reply in an existing thread chain.
						</p>
						{hydrated && (
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={useCachedPostId}
							>
								Use last post ID
							</Button>
						)}
					</div>

					{recentPosts.length > 0 && (
						<div className="space-y-2">
							<Label>Recent posts</Label>
							<div className="space-y-2">
								{recentPosts.map((post) => (
									<div
										key={post.id}
										className="flex items-start justify-between gap-2 rounded-md border p-2 text-sm"
									>
										<div className="space-y-1">
											<p className="font-mono text-xs">{post.id}</p>
											{post.text && (
												<p className="text-muted-foreground line-clamp-2">
													{post.text}
												</p>
											)}
											{post.timestamp && (
												<p className="text-muted-foreground text-xs">
													{new Date(post.timestamp).toLocaleString()}
												</p>
											)}
										</div>
										<Button
											type="button"
											variant="secondary"
											size="sm"
											onClick={() => setReplyToId(post.id)}
										>
											Use
										</Button>
									</div>
								))}
							</div>
						</div>
					)}

					<Button type="submit" disabled={!isConfigured || isPending}>
						{isPending ? "Publishing..." : "Publish to Threads"}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}

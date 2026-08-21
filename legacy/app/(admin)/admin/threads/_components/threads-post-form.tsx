"use client";

import {
	type ClipboardEvent,
	useActionState,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createThreadsPostAction } from "../_lib/actions";

type Props = {
	campaignDays: Array<{
		dayNumber: number;
		institutionName: string;
		institutionSlug: string;
		institutionCategory: string;
	}>;
	isConfigured: boolean;
	campaignLatestReplyId?: string;
	recentPosts: Array<{
		id: string;
		text?: string;
		timestamp?: string;
	}>;
};

const LAST_POST_ID_STORAGE_KEY = "threads:last-post-id";
const CAMPAIGN_THREAD_PARENT_POST_ID = "18106182523855087";

type ThreadTargetMode = "campaign-latest" | "campaign-parent" | "custom";

function buildCampaignTemplate(params: {
	day: string;
	mosqueName: string;
	mosqueUrl: string;
	includeHashtag: boolean;
}): string {
	const day = params.day.trim() || "1";
	const mosqueName = params.mosqueName.trim() || "masjid";
	const mosqueUrl = params.mosqueUrl.trim() || "sedekah.je/mosque/your-slug";

	const lines = [
		"Kempen 30 Hari 30 QR SedekahJe",
		"",
		`day ${day} - ${mosqueName}`,
		"",
		"links:",
		"1. page ramadhan - sedekah.je/ramadhan",
		`2. page masjid - ${mosqueUrl}`,
	];

	if (params.includeHashtag) {
		lines.push("#sedekahramadhan");
	}

	return lines.join("\n");
}

function readCachedPostId(): string | null {
	try {
		return window.localStorage.getItem(LAST_POST_ID_STORAGE_KEY);
	} catch {
		return null;
	}
}

export function ThreadsPostForm({
	campaignDays,
	campaignLatestReplyId,
	isConfigured,
	recentPosts,
}: Props) {
	const initialState = { status: "idle" } as const;
	const [state, formAction, isPending] = useActionState(
		createThreadsPostAction,
		initialState,
	);
	const [threadTargetMode, setThreadTargetMode] =
		useState<ThreadTargetMode>("campaign-latest");
	const [replyToId, setReplyToId] = useState(CAMPAIGN_THREAD_PARENT_POST_ID);
	const [text, setText] = useState("");
	const [day, setDay] = useState("1");
	const [mosqueName, setMosqueName] = useState("");
	const [mosqueUrl, setMosqueUrl] = useState("");
	const [includeHashtag, setIncludeHashtag] = useState(false);
	const [campaignLookupMessage, setCampaignLookupMessage] = useState("");
	const [selectedImageName, setSelectedImageName] = useState("");
	const [hydrated, setHydrated] = useState(false);
	const imageInputRef = useRef<HTMLInputElement | null>(null);

	const suggestedLatestReplyId = useMemo(
		() => campaignLatestReplyId || CAMPAIGN_THREAD_PARENT_POST_ID,
		[campaignLatestReplyId],
	);
	const campaignDayMap = useMemo(
		() => new Map(campaignDays.map((entry) => [entry.dayNumber, entry])),
		[campaignDays],
	);

	useEffect(() => {
		setHydrated(true);
		setReplyToId(suggestedLatestReplyId);
	}, [suggestedLatestReplyId]);

	useEffect(() => {
		if (state.status === "success" && state.postId) {
			setReplyToId(state.postId);
			setText("");
			if (imageInputRef.current) {
				imageInputRef.current.value = "";
			}
			setSelectedImageName("");
			try {
				window.localStorage.setItem(LAST_POST_ID_STORAGE_KEY, state.postId);
			} catch {
				// Ignore storage access issues (private mode, blocked storage, etc).
			}
		}
	}, [state.status, state.postId]);

	const useCachedPostId = () => {
		const cachedPostId = readCachedPostId();
		if (cachedPostId) {
			setReplyToId(cachedPostId);
		}
	};

	const applyThreadTargetMode = (mode: ThreadTargetMode) => {
		setThreadTargetMode(mode);
		if (mode === "campaign-parent") {
			setReplyToId(CAMPAIGN_THREAD_PARENT_POST_ID);
			return;
		}
		if (mode === "campaign-latest") {
			setReplyToId(suggestedLatestReplyId);
		}
	};

	const handleImageFile = (file: File | null) => {
		if (!file) {
			setSelectedImageName("");
			return;
		}
		setSelectedImageName(file.name || "clipboard-image.png");
	};

	const handlePasteImage = (event: ClipboardEvent<HTMLTextAreaElement>) => {
		const imageItem = Array.from(event.clipboardData.items).find((item) =>
			item.type.startsWith("image/"),
		);
		if (!imageItem) return;

		const file = imageItem.getAsFile();
		if (!file || !imageInputRef.current) return;

		const dataTransfer = new DataTransfer();
		dataTransfer.items.add(file);
		imageInputRef.current.files = dataTransfer.files;
		handleImageFile(file);
	};

	const autofillFromDay = () => {
		const dayNum = Number.parseInt(day.trim(), 10);
		if (Number.isNaN(dayNum) || dayNum < 1 || dayNum > 30) {
			setCampaignLookupMessage("Day must be between 1 and 30.");
			return;
		}

		const selectedDay = campaignDayMap.get(dayNum);
		if (!selectedDay) {
			setCampaignLookupMessage(
				`No campaign record found for day ${dayNum} in current year data.`,
			);
			return;
		}

		const resolvedMosqueName = selectedDay.institutionName;
		const resolvedMosqueUrl = `https://sedekah.je/${selectedDay.institutionCategory}/${selectedDay.institutionSlug}`;
		setMosqueName(resolvedMosqueName);
		setMosqueUrl(resolvedMosqueUrl);
		setText(
			buildCampaignTemplate({
				day: String(dayNum),
				mosqueName: resolvedMosqueName,
				mosqueUrl: resolvedMosqueUrl,
				includeHashtag,
			}),
		);
		setCampaignLookupMessage(
			`Autofilled day ${dayNum}: ${resolvedMosqueName} (${selectedDay.institutionCategory}/${selectedDay.institutionSlug}).`,
		);
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Create Threads Post</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{!isConfigured && (
					<div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
						Missing Threads credentials. Set <code>THREADS_USER_ID</code> and{" "}
						<code>THREADS_ACCESS_TOKEN</code> or reconnect Meta OAuth first.
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
					<div className="space-y-2 rounded-md border p-3">
						<Label>Thread target</Label>
						<div className="flex flex-wrap gap-2">
							<Button
								type="button"
								variant={
									threadTargetMode === "campaign-latest" ? "default" : "outline"
								}
								size="sm"
								onClick={() => applyThreadTargetMode("campaign-latest")}
							>
								1 day 1 QR: Continue latest (Ramadhan thread)
							</Button>
							<Button
								type="button"
								variant={
									threadTargetMode === "campaign-parent" ? "default" : "outline"
								}
								size="sm"
								onClick={() => applyThreadTargetMode("campaign-parent")}
							>
								1 day 1 QR: Parent root
							</Button>
							<Button
								type="button"
								variant={threadTargetMode === "custom" ? "default" : "outline"}
								size="sm"
								onClick={() => applyThreadTargetMode("custom")}
							>
								Custom
							</Button>
						</div>
						<p className="text-muted-foreground text-xs">
							Parent root ID: <code>{CAMPAIGN_THREAD_PARENT_POST_ID}</code>
						</p>
					</div>

					<div className="space-y-3 rounded-md border p-3">
						<Label>30 Hari 30 QR template</Label>
						<div className="grid gap-3 md:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="campaign-day">Day</Label>
								<div className="flex gap-2">
									<Input
										id="campaign-day"
										value={day}
										onChange={(event) => {
											setDay(event.target.value);
											setCampaignLookupMessage("");
										}}
										onBlur={autofillFromDay}
										onKeyDown={(event) => {
											if (event.key !== "Enter") return;
											event.preventDefault();
											autofillFromDay();
										}}
										placeholder="2"
									/>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={autofillFromDay}
									>
										Autofill
									</Button>
								</div>
							</div>
							<div className="space-y-2">
								<Label htmlFor="campaign-mosque-name">Mosque name</Label>
								<Input
									id="campaign-mosque-name"
									value={mosqueName}
									onChange={(event) => setMosqueName(event.target.value)}
									placeholder="masjid al muhtadin damansara damai"
								/>
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="campaign-mosque-url">Page masjid link</Label>
							<Input
								id="campaign-mosque-url"
								value={mosqueUrl}
								onChange={(event) => setMosqueUrl(event.target.value)}
								placeholder="sedekah.je/mosque/masjid-slug"
							/>
						</div>
						<label className="flex items-center gap-2 text-sm">
							<input
								type="checkbox"
								checked={includeHashtag}
								onChange={(event) => setIncludeHashtag(event.target.checked)}
							/>
							Include #sedekahramadhan
						</label>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() =>
								setText(
									buildCampaignTemplate({
										day,
										mosqueName,
										mosqueUrl,
										includeHashtag,
									}),
								)
							}
						>
							Generate template into post text
						</Button>
						{campaignLookupMessage && (
							<p className="text-muted-foreground text-xs">
								{campaignLookupMessage}
							</p>
						)}
					</div>

					<div className="space-y-2">
						<Label htmlFor="threads-text">Post text</Label>
						<Textarea
							id="threads-text"
							name="text"
							value={text}
							onChange={(event) => setText(event.target.value)}
							onPaste={handlePasteImage}
							placeholder="Write your post (max 500 chars)"
							maxLength={500}
							rows={6}
						/>
						<p className="text-muted-foreground text-xs">
							Text is optional when an image is attached.
						</p>
					</div>

					<div className="space-y-2">
						<Label htmlFor="threads-image">
							Attach image (optional, supports paste from clipboard)
						</Label>
						<Input
							ref={imageInputRef}
							id="threads-image"
							name="image"
							type="file"
							accept="image/*"
							onChange={(event) =>
								handleImageFile(event.target.files?.[0] ?? null)
							}
						/>
						{selectedImageName && (
							<div className="flex items-center justify-between gap-2 rounded-md border p-2 text-xs">
								<span className="truncate">
									Selected image: <code>{selectedImageName}</code>
								</span>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => {
										if (imageInputRef.current) {
											imageInputRef.current.value = "";
										}
										setSelectedImageName("");
									}}
								>
									Clear
								</Button>
							</div>
						)}
						<p className="text-muted-foreground text-xs">
							Tip: snip and copy, then paste directly in the post text box to
							auto-attach.
						</p>
					</div>

					<div className="space-y-2">
						<Label htmlFor="reply-to-id">Reply to post ID (optional)</Label>
						{threadTargetMode === "custom" ? (
							<Input
								id="reply-to-id"
								name="reply_to_id"
								value={replyToId}
								onChange={(event) => setReplyToId(event.target.value)}
								placeholder="Paste previous post ID to continue a thread"
							/>
						) : (
							<>
								<Input id="reply-to-id" value={replyToId} readOnly />
								<input type="hidden" name="reply_to_id" value={replyToId} />
							</>
						)}
						<p className="text-muted-foreground text-xs">
							Leave empty to create a new root post. Fill this to post as a
							reply in an existing thread chain.
						</p>
						{hydrated && (
							<div className="flex flex-wrap gap-2">
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={useCachedPostId}
								>
									Use last successful post ID
								</Button>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => setReplyToId(suggestedLatestReplyId)}
								>
									Refresh latest target
								</Button>
							</div>
						)}
					</div>

					{recentPosts.length > 0 && (
						<div className="space-y-2">
							<Label>Recent Ramadhan thread replies</Label>
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

"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Institution } from "@/db/institutions";
import {
	categories as CATEGORY_OPTIONS,
	states as STATE_OPTIONS,
} from "@/lib/institution-constants";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ExternalLink, SaveIcon, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { updateInstitutionByAdmin } from "../../_lib/queries";

type Props = {
	institution: Partial<Institution> & {
		id: number;
		sourceUrl?: string;
		contributorRemarks?: string;
		contributorName?: string | null;
		contributorId?: string | null;
		contributorEmail?: string | null;
		createdAt?: Date;
		reviewedAt?: Date | null;
		reviewedBy?: string | null;
		adminNotes?: string | null;
	};
	isEditing: boolean;
	onEditComplete: () => void;
};

const urlOrEmpty = z
	.string()
	.optional()
	.refine(
		(val) => {
			if (!val || val === "") return true;
			try {
				new URL(val);
				return true;
			} catch {
				return false;
			}
		},
		{ message: "Invalid URL" },
	);

const formSchema = z.object({
	name: z.string().min(1, "Name is required"),
	category: z.enum(CATEGORY_OPTIONS),
	state: z.enum(STATE_OPTIONS),
	city: z.string().min(1),
	address: z.string().optional(),
	facebook: urlOrEmpty,
	instagram: urlOrEmpty,
	website: urlOrEmpty,
	qrContent: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function ApprovedInstitutionForm({
	institution,
	isEditing,
	onEditComplete,
}: Props) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	const formattedSubmissionDate = institution.createdAt
		? format(new Date(institution.createdAt), "d MMMM yyyy")
		: "N/A";

	const formattedSubmissionTime = institution.createdAt
		? format(new Date(institution.createdAt), "p")
		: "N/A";

	const formattedReviewDate = institution.reviewedAt
		? format(new Date(institution.reviewedAt), "d MMMM yyyy")
		: "N/A";

	const formattedReviewTime = institution.reviewedAt
		? format(new Date(institution.reviewedAt), "p")
		: "N/A";

	const {
		register,
		handleSubmit,
		watch,
		formState: { errors },
	} = useForm<FormData>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: institution.name ?? "",
			category: institution.category || CATEGORY_OPTIONS[0],
			state: institution.state || STATE_OPTIONS[0],
			city: institution.city ?? "",
			address: institution.address ?? "",
			facebook: institution.socialMedia?.facebook ?? "",
			instagram: institution.socialMedia?.instagram ?? "",
			website: institution.socialMedia?.website ?? "",
			qrContent: institution.qrContent ?? "",
		},
	});

	const facebookUrl = watch("facebook");
	const instagramUrl = watch("instagram");
	const websiteUrl = watch("website");

	const generateGoogleSearchUrl = (
		platform: string,
		institutionName: string,
	) => {
		const query = `${platform} ${institutionName}`;
		return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
	};

	function buildPayload(formData: FormData) {
		const { facebook, instagram, website, ...rest } = formData;
		return {
			...rest,
			socialMedia: {
				facebook: facebook || undefined,
				instagram: instagram || undefined,
				website: website || undefined,
			},
		} as Parameters<typeof updateInstitutionByAdmin>[1];
	}

	async function saveChanges(data: FormData) {
		startTransition(async () => {
			try {
				await updateInstitutionByAdmin(institution.id, buildPayload(data));
				toast.success("Changes saved successfully");
				router.refresh();
				onEditComplete();
			} catch (e) {
				console.error(e);
				toast.error("Failed to save changes");
			}
		});
	}

	return (
		<form onSubmit={handleSubmit(saveChanges)} className="space-y-6">
			{/* Institution Info Section */}
			<Card className="p-4 mb-6 rounded-lg shadow-sm">
				<CardHeader className="pb-4">
					<CardTitle className="text-xl font-semibold flex items-center gap-2">
						📋 Institution Info
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<label className="font-medium" htmlFor="name">
							Name
						</label>
						{isEditing ? (
							<>
								<Input id="name" {...register("name")} />
								{errors.name && (
									<p className="text-sm text-red-500">{errors.name.message}</p>
								)}
							</>
						) : (
							<div className="p-3 bg-muted rounded-md border">
								{institution.name}
							</div>
						)}
					</div>

					<div className="space-y-2">
						<label className="font-medium" htmlFor="category">
							Category
						</label>
						{isEditing ? (
							<>
								<select
									id="category"
									{...register("category")}
									className="w-full h-10 px-3 border rounded-md bg-background"
								>
									<option value="" disabled>
										Select category
									</option>
									{CATEGORY_OPTIONS.map((c) => (
										<option key={c} value={c} className="capitalize">
											{c}
										</option>
									))}
								</select>
								{errors.category && (
									<p className="text-sm text-red-500">
										{errors.category.message}
									</p>
								)}
							</>
						) : (
							<div className="p-3 bg-muted rounded-md border capitalize">
								{institution.category}
							</div>
						)}
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-2">
							<label htmlFor="state" className="font-medium">
								State
							</label>
							{isEditing ? (
								<>
									<select
										id="state"
										{...register("state")}
										className="w-full h-10 px-3 border rounded-md bg-background"
									>
										<option value="" disabled>
											Select state
										</option>
										{STATE_OPTIONS.map((s) => (
											<option key={s} value={s} className="capitalize">
												{s}
											</option>
										))}
									</select>
									{errors.state && (
										<p className="text-sm text-red-500">
											{errors.state.message}
										</p>
									)}
								</>
							) : (
								<div className="p-3 bg-muted rounded-md border">
									{institution.state}
								</div>
							)}
						</div>
						<div className="space-y-2">
							<label htmlFor="city" className="font-medium">
								City
							</label>
							{isEditing ? (
								<>
									<Input id="city" {...register("city")} />
									{errors.city && (
										<p className="text-sm text-red-500">
											{errors.city.message}
										</p>
									)}
								</>
							) : (
								<div className="p-3 bg-muted rounded-md border">
									{institution.city}
								</div>
							)}
						</div>
					</div>

					<div className="space-y-2">
						<label htmlFor="address" className="font-medium">
							Address
						</label>
						{isEditing ? (
							<Textarea id="address" rows={3} {...register("address")} />
						) : (
							<div className="p-3 bg-muted rounded-md border min-h-[84px]">
								{institution.address || "No address provided"}
							</div>
						)}
					</div>

					{/* QR Content field */}
					<div className="space-y-2">
						<label htmlFor="qrContent" className="font-medium">
							QR Content
						</label>
						{isEditing ? (
							<Textarea
								id="qrContent"
								rows={3}
								placeholder="QR code content"
								{...register("qrContent")}
							/>
						) : (
							<div className="p-3 bg-muted rounded-md border min-h-[84px] text-sm break-all">
								{institution.qrContent || "No QR content available"}
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Social Media Links Section */}
			<Card className="p-4 mb-6 rounded-lg shadow-sm">
				<CardHeader className="pb-4">
					<CardTitle className="text-xl font-semibold flex items-center gap-2">
						🔗 Social Media Links
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<label htmlFor="facebook" className="font-medium">
							Facebook URL
						</label>
						{isEditing ? (
							<div className="flex gap-2">
								<Input
									id="facebook"
									placeholder="https://facebook.com/..."
									{...register("facebook")}
								/>
								{facebookUrl ? (
									<Button
										type="button"
										variant="outline"
										size="icon"
										onClick={() => window.open(facebookUrl, "_blank")}
									>
										<ExternalLink className="h-4 w-4" />
									</Button>
								) : (
									<Button
										type="button"
										variant="outline"
										size="icon"
										onClick={() =>
											window.open(
												generateGoogleSearchUrl(
													"facebook",
													institution.name || "",
												),
												"_blank",
											)
										}
									>
										<Search className="h-4 w-4" />
									</Button>
								)}
							</div>
						) : (
							<div className="flex gap-2">
								<div className="flex-1 p-3 bg-muted rounded-md border">
									{institution.socialMedia?.facebook || "No Facebook URL"}
								</div>
								{institution.socialMedia?.facebook && (
									<Button
										type="button"
										variant="outline"
										size="icon"
										onClick={() =>
											window.open(institution.socialMedia?.facebook, "_blank")
										}
									>
										<ExternalLink className="h-4 w-4" />
									</Button>
								)}
							</div>
						)}
						{errors.facebook && (
							<p className="text-sm text-red-500">
								{errors.facebook.message as string}
							</p>
						)}
					</div>

					<div className="space-y-2">
						<label htmlFor="instagram" className="font-medium">
							Instagram URL
						</label>
						{isEditing ? (
							<div className="flex gap-2">
								<Input
									id="instagram"
									placeholder="https://instagram.com/..."
									{...register("instagram")}
								/>
								{instagramUrl ? (
									<Button
										type="button"
										variant="outline"
										size="icon"
										onClick={() => window.open(instagramUrl, "_blank")}
									>
										<ExternalLink className="h-4 w-4" />
									</Button>
								) : (
									<Button
										type="button"
										variant="outline"
										size="icon"
										onClick={() =>
											window.open(
												generateGoogleSearchUrl(
													"instagram",
													institution.name || "",
												),
												"_blank",
											)
										}
									>
										<Search className="h-4 w-4" />
									</Button>
								)}
							</div>
						) : (
							<div className="flex gap-2">
								<div className="flex-1 p-3 bg-muted rounded-md border">
									{institution.socialMedia?.instagram || "No Instagram URL"}
								</div>
								{institution.socialMedia?.instagram && (
									<Button
										type="button"
										variant="outline"
										size="icon"
										onClick={() =>
											window.open(institution.socialMedia?.instagram, "_blank")
										}
									>
										<ExternalLink className="h-4 w-4" />
									</Button>
								)}
							</div>
						)}
						{errors.instagram && (
							<p className="text-sm text-red-500">
								{errors.instagram.message as string}
							</p>
						)}
					</div>

					<div className="space-y-2">
						<label htmlFor="website" className="font-medium">
							Website URL
						</label>
						{isEditing ? (
							<div className="flex gap-2">
								<Input
									id="website"
									placeholder="https://..."
									{...register("website")}
								/>
								{websiteUrl ? (
									<Button
										type="button"
										variant="outline"
										size="icon"
										onClick={() => window.open(websiteUrl, "_blank")}
									>
										<ExternalLink className="h-4 w-4" />
									</Button>
								) : (
									<Button
										type="button"
										variant="outline"
										size="icon"
										onClick={() =>
											window.open(
												generateGoogleSearchUrl(
													"website",
													institution.name || "",
												),
												"_blank",
											)
										}
									>
										<Search className="h-4 w-4" />
									</Button>
								)}
							</div>
						) : (
							<div className="flex gap-2">
								<div className="flex-1 p-3 bg-muted rounded-md border">
									{institution.socialMedia?.website || "No Website URL"}
								</div>
								{institution.socialMedia?.website && (
									<Button
										type="button"
										variant="outline"
										size="icon"
										onClick={() =>
											window.open(institution.socialMedia?.website, "_blank")
										}
									>
										<ExternalLink className="h-4 w-4" />
									</Button>
								)}
							</div>
						)}
						{errors.website && (
							<p className="text-sm text-red-500">
								{errors.website.message as string}
							</p>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Contributor Info Section */}
			<Card className="p-4 mb-6 rounded-lg shadow-sm bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
				<CardHeader className="pb-4">
					<CardTitle className="text-xl font-semibold flex items-center gap-2">
						👤 Contributor Information
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<div className="font-medium text-muted-foreground">
								Submitted By
							</div>
							<div className="p-3 bg-background rounded-md border">
								<div className="font-medium">
									{institution.contributorName || "Anonymous User"}
								</div>
								{institution.contributorEmail && (
									<div className="text-sm text-muted-foreground">
										{institution.contributorEmail}
									</div>
								)}
							</div>
						</div>
						<div className="space-y-2">
							<div className="font-medium text-muted-foreground">
								Submission Date
							</div>
							<div className="p-3 bg-background rounded-md border">
								<div className="font-medium">{formattedSubmissionDate}</div>
								<div className="text-sm text-muted-foreground">
									{formattedSubmissionTime}
								</div>
							</div>
						</div>
					</div>
					<div className="space-y-2">
						<div className="font-medium text-muted-foreground">
							Source URL (if from social media)
						</div>
						<div className="flex gap-2">
							<div className="flex-1 p-3 bg-background rounded-md border">
								{institution.sourceUrl || "No source URL provided"}
							</div>
							{institution.sourceUrl && (
								<Button
									type="button"
									variant="outline"
									size="icon"
									onClick={() => window.open(institution.sourceUrl, "_blank")}
								>
									<ExternalLink className="h-4 w-4" />
								</Button>
							)}
						</div>
					</div>
					<div className="space-y-2">
						<div className="font-medium text-muted-foreground">
							Contributor Notes
						</div>
						<div className="p-3 bg-background rounded-md border min-h-[84px]">
							{institution.contributorRemarks || "No additional notes provided"}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Review Info Section */}
			<Card className="p-4 mb-6 rounded-lg shadow-sm bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
				<CardHeader className="pb-4">
					<CardTitle className="text-xl font-semibold flex items-center gap-2">
						✅ Review Information
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<div className="font-medium text-muted-foreground">Status</div>
							<div className="p-3 bg-background rounded-md border">
								<div className="font-medium text-green-600">Approved</div>
							</div>
						</div>
						<div className="space-y-2">
							<div className="font-medium text-muted-foreground">
								Review Date
							</div>
							<div className="p-3 bg-background rounded-md border">
								<div className="font-medium">{formattedReviewDate}</div>
								<div className="text-sm text-muted-foreground">
									{formattedReviewTime}
								</div>
							</div>
						</div>
					</div>
					{institution.adminNotes && (
						<div className="space-y-2">
							<div className="font-medium text-muted-foreground">
								Admin Notes
							</div>
							<div className="p-3 bg-background rounded-md border">
								{institution.adminNotes}
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Save button only shown when editing */}
			{isEditing && (
				<div className="flex justify-end">
					<Button type="submit" disabled={isPending} className="gap-2">
						{isPending ? (
							<>Saving...</>
						) : (
							<>
								<SaveIcon className="h-4 w-4" />
								Save Changes
							</>
						)}
					</Button>
				</div>
			)}
		</form>
	);
}

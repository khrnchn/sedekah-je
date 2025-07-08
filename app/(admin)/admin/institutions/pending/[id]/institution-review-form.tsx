"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	categories as CATEGORY_OPTIONS,
	states as STATE_OPTIONS,
} from "@/db/institutions";
import type { Institution } from "@/db/institutions";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { forwardRef, useImperativeHandle, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { updateInstitutionByAdmin } from "../../_lib/queries";

type Props = {
	institution: Partial<Institution> & {
		id: number;
	};
};

export type ReviewFormHandle = {
	save: () => Promise<boolean>;
};

const InstitutionReviewForm = forwardRef<ReviewFormHandle, Props>(
	function InstitutionReviewForm({ institution }, ref) {
		const router = useRouter();
		const [isPending, startTransition] = useTransition();

		// dynamically build schema based on whether original qrContent exists
		const dynamicSchema = z.object({
			name: z.string().min(1, "Name is required"),
			category: z.enum(CATEGORY_OPTIONS),
			state: z.enum(STATE_OPTIONS),
			city: z.string().min(1),
			address: z.string().optional(),
			qrContent: institution.qrContent
				? z.string().optional()
				: z
						.string()
						.min(1, "QR content required when automatic extraction fails"),
		});

		type LocalFormData = z.infer<typeof dynamicSchema>;

		const {
			register,
			handleSubmit,
			getValues,
			trigger,
			formState: { errors },
		} = useForm<LocalFormData>({
			resolver: zodResolver(dynamicSchema),
			defaultValues: {
				name: institution.name ?? "",
				category: institution.category || CATEGORY_OPTIONS[0],
				state: institution.state || STATE_OPTIONS[0],
				city: institution.city ?? "",
				address: institution.address ?? "",
				qrContent: institution.qrContent ?? "",
			},
		});

		async function saveChanges(data: LocalFormData) {
			startTransition(async () => {
				try {
					await updateInstitutionByAdmin(institution.id, data);
					toast.success("Changes saved");
					router.refresh();
				} catch (e) {
					console.error(e);
					toast.error("Failed to save changes");
				}
			});
		}

		// Expose save method
		useImperativeHandle(ref, () => ({
			save: async () => {
				const isValid = await trigger();
				if (!isValid) {
					toast.error("Validation errors – please fix form before approving");
					return false;
				}
				const values = getValues();
				try {
					await updateInstitutionByAdmin(institution.id, values);
					return true;
				} catch (e) {
					console.error(e);
					toast.error("Failed to save changes");
					return false;
				}
			},
		}));

		return (
			<form onSubmit={handleSubmit(saveChanges)} className="space-y-4">
				<div className="space-y-2">
					<label className="font-medium" htmlFor="name">
						Name
					</label>
					<Input id="name" {...register("name")} />
					{errors.name && (
						<p className="text-sm text-red-500">{errors.name.message}</p>
					)}
				</div>

				<div className="space-y-2">
					<label className="font-medium" htmlFor="category">
						Category
					</label>
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
						<p className="text-sm text-red-500">{errors.category.message}</p>
					)}
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div className="space-y-2">
						<label htmlFor="state" className="font-medium">
							State
						</label>
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
							<p className="text-sm text-red-500">{errors.state.message}</p>
						)}
					</div>
					<div className="space-y-2">
						<label htmlFor="city" className="font-medium">
							City
						</label>
						<Input id="city" {...register("city")} />
						{errors.city && (
							<p className="text-sm text-red-500">{errors.city.message}</p>
						)}
					</div>
				</div>

				<div className="space-y-2">
					<label htmlFor="address" className="font-medium">
						Address
					</label>
					<Textarea id="address" rows={3} {...register("address")} />
				</div>

				{/* Manual QR Content field (only shown if missing) */}
				{!institution.qrContent && (
					<div className="space-y-2">
						<label htmlFor="qrContent" className="font-medium">
							Manual QR Content
						</label>
						<Textarea
							id="qrContent"
							rows={3}
							placeholder="Paste scanned QR text here"
							{...register("qrContent")}
						/>
						{errors.qrContent && (
							<p className="text-sm text-red-500">
								{errors.qrContent.message as string}
							</p>
						)}
					</div>
				)}

				{/* Submit button removed; actions handled in ReviewActions */}
			</form>
		);
	},
);

export default InstitutionReviewForm;

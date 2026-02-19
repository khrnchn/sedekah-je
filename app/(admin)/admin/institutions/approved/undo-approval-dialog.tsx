"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Undo2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { undoApproval } from "../_lib/queries";

type Props = {
	institutionId: number;
	institutionName: string;
};

export function UndoApprovalDialog({ institutionId, institutionName }: Props) {
	const [open, setOpen] = useState(false);
	const [notes, setNotes] = useState("Duplicate entry");
	const [isPending, startTransition] = useTransition();
	const router = useRouter();

	function handleUndo() {
		setOpen(false);
		startTransition(async () => {
			const promise = undoApproval(institutionId, notes);
			toast.promise(promise, {
				loading: "Undoing approval...",
				success: () => {
					router.refresh();
					return `${institutionName} approval has been undone.`;
				},
				error: (err) => `Failed: ${err.message}`,
			});
		});
	}

	return (
		<Dialog open={open} onOpenChange={(v) => !isPending && setOpen(v)}>
			<DialogTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className="text-destructive hover:text-destructive"
				>
					<Undo2Icon className="h-4 w-4" />
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Undo Approval</DialogTitle>
					<DialogDescription>
						This will reject &ldquo;{institutionName}&rdquo; and remove it from
						the public directory. This is typically used for duplicate entries.
					</DialogDescription>
				</DialogHeader>
				<div className="py-4">
					<Textarea
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
						placeholder="Reason for undoing approval (e.g. duplicate of #123)"
						className="min-h-[100px]"
					/>
				</div>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => setOpen(false)}
						disabled={isPending}
					>
						Cancel
					</Button>
					<Button
						variant="destructive"
						onClick={handleUndo}
						disabled={isPending}
					>
						{isPending ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : null}
						Undo Approval
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

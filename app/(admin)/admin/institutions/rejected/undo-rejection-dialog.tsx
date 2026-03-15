"use client";

import { Loader2, Undo2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
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
import { undoRejection } from "../_lib/actions";

type Props = {
	institutionId: number;
	institutionName: string;
};

export function UndoRejectionDialog({ institutionId, institutionName }: Props) {
	const [open, setOpen] = useState(false);
	const [notes, setNotes] = useState("");
	const [isPending, startTransition] = useTransition();
	const router = useRouter();

	function handleUndo() {
		setOpen(false);
		startTransition(async () => {
			const promise = undoRejection(institutionId, notes || undefined);
			toast.promise(promise, {
				loading: "Undoing rejection...",
				success: () => {
					router.refresh();
					return `${institutionName} has been moved back to pending.`;
				},
				error: (err) => `Failed: ${err.message}`,
			});
		});
	}

	return (
		<Dialog open={open} onOpenChange={(v) => !isPending && setOpen(v)}>
			<DialogTrigger asChild>
				<Button variant="ghost" size="sm">
					<Undo2Icon className="h-4 w-4" />
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Undo Rejection</DialogTitle>
					<DialogDescription>
						This will move &ldquo;{institutionName}&rdquo; back to pending so it
						can be reviewed again.
					</DialogDescription>
				</DialogHeader>
				<div className="py-4">
					<Textarea
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
						placeholder="Optional notes (e.g. rejected by mistake)"
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
					<Button onClick={handleUndo} disabled={isPending}>
						{isPending ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : null}
						Undo Rejection
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

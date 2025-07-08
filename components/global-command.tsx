"use client";

import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import type { Institution } from "@/db/institutions";
import { getInstitutions } from "@/lib/queries/institutions";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function GlobalCommand() {
	const [open, setOpen] = useState(false);
	const [institutions, setInstitutions] = useState<Institution[]>([]);
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setOpen((open) => !open);
			}
		};

		document.addEventListener("keydown", down);
		return () => document.removeEventListener("keydown", down);
	}, []);

	useEffect(() => {
		if (open && institutions.length === 0) {
			setLoading(true);
			getInstitutions()
				.then((data) => {
					setInstitutions(data);
				})
				.catch((error) => {
					console.error("Failed to fetch institutions:", error);
				})
				.finally(() => {
					setLoading(false);
				});
		}
	}, [open, institutions.length]);

	const handleSelectInstitution = (id: number) => {
		setOpen(false);
		router.push(`/admin/institutions/approved/${id}`);
	};

	return (
		<CommandDialog open={open} onOpenChange={setOpen}>
			<CommandInput placeholder="Cari institusi..." />
			<CommandList>
				<CommandEmpty>
					{loading ? "Memuat institusi..." : "Tiada institusi dijumpai."}
				</CommandEmpty>
				<CommandGroup heading="Institusi">
					{institutions.map((institution) => (
						<CommandItem
							key={institution.id}
							onSelect={() => handleSelectInstitution(institution.id)}
							className="cursor-pointer"
						>
							<div className="flex items-center gap-2">
								<div className="flex flex-col">
									<span className="font-medium">{institution.name}</span>
									<span className="text-sm text-muted-foreground">
										{institution.city}, {institution.state}
									</span>
								</div>
							</div>
						</CommandItem>
					))}
				</CommandGroup>
			</CommandList>
		</CommandDialog>
	);
}

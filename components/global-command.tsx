"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { searchAllInstitutionsForAdmin } from "@/app/(admin)/admin/institutions/_lib/queries";
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";

type InstitutionRow = {
	id: number;
	name: string;
	city: string;
	state: string;
	status: string;
};

export function GlobalCommand() {
	const [open, setOpen] = useState(false);
	const [institutions, setInstitutions] = useState<InstitutionRow[]>([]);
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setOpen((o) => !o);
			}
		};

		document.addEventListener("keydown", down);
		return () => document.removeEventListener("keydown", down);
	}, []);

	useEffect(() => {
		if (open && institutions.length === 0) {
			setLoading(true);
			searchAllInstitutionsForAdmin()
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

	const handleSelectInstitution = (id: number, status: string) => {
		setOpen(false);
		router.push(`/admin/institutions/${status}/${id}`);
	};

	const pending = institutions.filter((i) => i.status === "pending");
	const approved = institutions.filter((i) => i.status === "approved");
	const rejected = institutions.filter((i) => i.status === "rejected");

	const statusDotClass = (status: string) => {
		switch (status) {
			case "pending":
				return "bg-amber-500";
			case "approved":
				return "bg-green-500";
			case "rejected":
				return "bg-destructive";
			default:
				return "bg-muted-foreground";
		}
	};

	return (
		<CommandDialog open={open} onOpenChange={setOpen}>
			<CommandInput placeholder="Cari institusi..." />
			<CommandList>
				<CommandEmpty>
					{loading ? "Memuat institusi..." : "Tiada institusi dijumpai."}
				</CommandEmpty>
				{pending.length > 0 && (
					<CommandGroup heading="Pending">
						{pending.map((inst) => (
							<CommandItem
								key={`pending-${inst.id}`}
								value={`${inst.name} ${inst.city} ${inst.state}`}
								onSelect={() => handleSelectInstitution(inst.id, inst.status)}
								className="cursor-pointer"
							>
								<div className="flex items-center gap-2">
									<div
										className={`h-2 w-2 shrink-0 rounded-full ${statusDotClass(inst.status)}`}
									/>
									<div className="flex flex-col">
										<span className="font-medium">{inst.name}</span>
										<span className="text-sm text-muted-foreground">
											{inst.city}, {inst.state}
										</span>
									</div>
								</div>
							</CommandItem>
						))}
					</CommandGroup>
				)}
				{approved.length > 0 && (
					<CommandGroup heading="Approved">
						{approved.map((inst) => (
							<CommandItem
								key={`approved-${inst.id}`}
								value={`${inst.name} ${inst.city} ${inst.state}`}
								onSelect={() => handleSelectInstitution(inst.id, inst.status)}
								className="cursor-pointer"
							>
								<div className="flex items-center gap-2">
									<div
										className={`h-2 w-2 shrink-0 rounded-full ${statusDotClass(inst.status)}`}
									/>
									<div className="flex flex-col">
										<span className="font-medium">{inst.name}</span>
										<span className="text-sm text-muted-foreground">
											{inst.city}, {inst.state}
										</span>
									</div>
								</div>
							</CommandItem>
						))}
					</CommandGroup>
				)}
				{rejected.length > 0 && (
					<CommandGroup heading="Rejected">
						{rejected.map((inst) => (
							<CommandItem
								key={`rejected-${inst.id}`}
								value={`${inst.name} ${inst.city} ${inst.state}`}
								onSelect={() => handleSelectInstitution(inst.id, inst.status)}
								className="cursor-pointer"
							>
								<div className="flex items-center gap-2">
									<div
										className={`h-2 w-2 shrink-0 rounded-full ${statusDotClass(inst.status)}`}
									/>
									<div className="flex flex-col">
										<span className="font-medium">{inst.name}</span>
										<span className="text-sm text-muted-foreground">
											{inst.city}, {inst.state}
										</span>
									</div>
								</div>
							</CommandItem>
						))}
					</CommandGroup>
				)}
			</CommandList>
		</CommandDialog>
	);
}

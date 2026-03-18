"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { TerawihInstitutionOption } from "../_lib/queries";

type InstitutionPickerProps = {
	institutions: TerawihInstitutionOption[];
	value: number | null;
	onChange: (institutionId: number | null) => void;
	placeholder?: string;
};

export function InstitutionPicker({
	institutions,
	value,
	onChange,
	placeholder = "Cari masjid berdaftar...",
}: InstitutionPickerProps) {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");

	const selected = useMemo(
		() => institutions.find((institution) => institution.id === value),
		[institutions, value],
	);

	const filtered = useMemo(() => {
		if (!search.trim()) return institutions;
		const query = search.toLowerCase();
		return institutions.filter(
			(institution) =>
				institution.name.toLowerCase().includes(query) ||
				institution.state.toLowerCase().includes(query) ||
				institution.category.toLowerCase().includes(query),
		);
	}, [institutions, search]);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					type="button"
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className="w-full justify-between font-normal"
				>
					<span className="truncate">
						{selected ? `${selected.name} (${selected.state})` : placeholder}
					</span>
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent
				className="w-[var(--radix-popover-trigger-width)] p-0"
				align="start"
			>
				<Command shouldFilter={false}>
					<CommandInput
						placeholder="Cari nama masjid, negeri..."
						value={search}
						onValueChange={setSearch}
					/>
					<CommandList>
						<CommandEmpty>Tiada masjid dijumpai.</CommandEmpty>
						<CommandGroup>
							{filtered.map((institution) => (
								<CommandItem
									key={institution.id}
									value={`${institution.id}-${institution.name}`}
									onSelect={() => {
										onChange(institution.id);
										setOpen(false);
									}}
								>
									<Check
										className={cn(
											"mr-2 h-4 w-4",
											value === institution.id ? "opacity-100" : "opacity-0",
										)}
									/>
									<div className="flex flex-col">
										<span>{institution.name}</span>
										<span className="text-xs text-muted-foreground">
											{institution.state} • {institution.category}
										</span>
									</div>
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}

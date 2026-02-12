"use client";

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
import { Check, ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";

type InstitutionOption = {
	id: number;
	name: string;
	slug: string;
	category: string;
	state: string;
};

type InstitutionPickerProps = {
	institutions: InstitutionOption[];
	value: number | null;
	onChange: (institutionId: number | null) => void;
	disabled?: boolean;
	placeholder?: string;
};

export function InstitutionPicker({
	institutions,
	value,
	onChange,
	disabled,
	placeholder = "Pilih institusi...",
}: InstitutionPickerProps) {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");

	const selected = useMemo(
		() => institutions.find((i) => i.id === value),
		[institutions, value],
	);

	const filtered = useMemo(() => {
		if (!search.trim()) return institutions;
		const s = search.toLowerCase();
		return institutions.filter(
			(i) =>
				i.name.toLowerCase().includes(s) ||
				i.state.toLowerCase().includes(s) ||
				i.category.toLowerCase().includes(s),
		);
	}, [institutions, search]);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					aria-haspopup="listbox"
					disabled={disabled}
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
						placeholder="Cari nama, negeri..."
						value={search}
						onValueChange={setSearch}
					/>
					<CommandList>
						<CommandEmpty>Tiada institusi dijumpai.</CommandEmpty>
						<CommandGroup>
							<CommandItem
								value="__none__"
								onSelect={() => {
									onChange(null);
									setOpen(false);
								}}
							>
								<Check
									className={cn(
										"mr-2 h-4 w-4",
										value === null ? "opacity-100" : "opacity-0",
									)}
								/>
								Tiada
							</CommandItem>
							{filtered.map((inst) => (
								<CommandItem
									key={inst.id}
									value={`${inst.id}-${inst.name}`}
									onSelect={() => {
										onChange(inst.id);
										setOpen(false);
									}}
								>
									<Check
										className={cn(
											"mr-2 h-4 w-4",
											value === inst.id ? "opacity-100" : "opacity-0",
										)}
									/>
									<div className="flex flex-col">
										<span>{inst.name}</span>
										<span className="text-xs text-muted-foreground">
											{inst.state} • {inst.category}
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

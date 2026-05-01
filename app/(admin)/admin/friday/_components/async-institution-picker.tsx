"use client";

import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
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
import {
	type FridayInstitutionSearchResult,
	searchApprovedInstitutionsForFridayCampaign,
} from "../_lib/actions";

type AsyncInstitutionPickerProps = {
	value: number | null;
	selectedOption: FridayInstitutionSearchResult | null;
	onChange: (institution: FridayInstitutionSearchResult | null) => void;
	excludeIds?: number[];
	disabled?: boolean;
	placeholder?: string;
};

export function AsyncInstitutionPicker({
	value,
	selectedOption,
	onChange,
	excludeIds = [],
	disabled,
	placeholder = "Cari institusi...",
}: AsyncInstitutionPickerProps) {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");
	const [options, setOptions] = useState<FridayInstitutionSearchResult[]>(() =>
		selectedOption ? [selectedOption] : [],
	);
	const [isSearching, startSearch] = useTransition();

	const selected = useMemo(
		() =>
			options.find((option) => option.id === value) ??
			(selectedOption?.id === value ? selectedOption : null),
		[options, selectedOption, value],
	);

	useEffect(() => {
		if (!open) return;

		const timeout = window.setTimeout(() => {
			startSearch(async () => {
				const results = await searchApprovedInstitutionsForFridayCampaign(
					search,
					excludeIds,
				);
				setOptions((prev) => {
					const merged = new Map<number, FridayInstitutionSearchResult>();
					for (const option of selectedOption ? [selectedOption] : []) {
						if (!excludeIds.includes(option.id)) merged.set(option.id, option);
					}
					for (const option of prev) {
						if (option.id === value && !excludeIds.includes(option.id)) {
							merged.set(option.id, option);
						}
					}
					for (const option of results) {
						merged.set(option.id, option);
					}
					return [...merged.values()];
				});
			});
		}, 300);

		return () => window.clearTimeout(timeout);
	}, [excludeIds, open, search, selectedOption, value]);

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
						<CommandEmpty>
							{isSearching ? "Mencari..." : "Tiada institusi dijumpai."}
						</CommandEmpty>
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
							{options.map((option) => (
								<CommandItem
									key={option.id}
									value={`${option.id}-${option.name}`}
									onSelect={() => {
										onChange(option);
										setOpen(false);
									}}
								>
									<Check
										className={cn(
											"mr-2 h-4 w-4",
											value === option.id ? "opacity-100" : "opacity-0",
										)}
									/>
									<div className="flex min-w-0 flex-col">
										<span className="truncate">{option.name}</span>
										<span className="text-xs text-muted-foreground">
											{option.state} • {option.category}
										</span>
									</div>
								</CommandItem>
							))}
							{isSearching && (
								<div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
									<Loader2 className="h-4 w-4 animate-spin" />
									Mencari...
								</div>
							)}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}

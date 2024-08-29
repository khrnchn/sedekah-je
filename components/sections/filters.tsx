import { categories, type Institution } from "@/app/types/institutions";
import Image from "next/image";
import type React from "react";
import { forwardRef, useEffect, useState } from "react";
import { StatesDropdown } from "@/components/states-dropdown";
import { Input } from "@/components/ui/input";

type Props = {
	onSearch: (query: string) => void;
	onChange: (props: {
		categories: string[];
		state: string;
	}) => void;
	institutions: Institution[];
};

const Filters = forwardRef<HTMLDivElement, Props>(({ onSearch, onChange, institutions }) => {
	const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
	const [selectedState, setSelectedState] = useState<string>("");
	const [searchQuery, setSearchQuery] = useState<string>("");

	const mappedCategories = Object.keys(categories).map((category) => ({
		label: categories[category as keyof typeof categories].label,
		value: category,
		icon: categories[category as keyof typeof categories].icon,
	}));

	const handleStateChange = (props: { state: string }) => {
		setSelectedState(props.state === "all_states" ? "" : props.state);
	};

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchQuery(e.target.value);
		onSearch(e.target.value);
	};

	useEffect(() => {
		onChange({
			categories: selectedCategories,
			state: selectedState,
		});
	}, [selectedCategories, selectedState, onChange]);

	const getCountForCategory = (category: string) => {
		return institutions.filter(
			(ins) =>
				(!selectedState || ins.state === selectedState) &&
				ins.category === category
		).length;
	};

	return (
		<div className="flex flex-col gap-4 mb-4">
			<div className="flex items-center justify-center flex-row flex-wrap gap-2">
				{mappedCategories.map((category) => (
					<button
						type="button"
						key={category.value}
						onClick={() => {
							if (selectedCategories.includes(category.value)) {
								setSelectedCategories(
									selectedCategories.filter((c) => c !== category.value),
								);
							} else {
								setSelectedCategories([...selectedCategories, category.value]);
							}
						}}
						data-active={selectedCategories.includes(category.value)}
						className="px-4 py-2 text-sm max-sm:text-xs font-bold data-[active=true]:bg-slate-500 data-[active=true]:text-white truncate select-none flex flex-row gap-2 items-center justify-center whitespace-nowrap bg-background w-fit border border-border rounded-full shadow-md dark:shadow-muted/50"
					>
						<Image
							src={category.icon}
							alt={category.label}
							width={24}
							height={24}
						/>
						<span className="hidden md:block">{category.label}</span>
						<span className="rounded-full px-2 py-1 bg-slate-200 text-black">
							{getCountForCategory(category.value)}
						</span>
					</button>
				))}
			</div>
			<div className="flex flex-row items-center justify-center gap-2">
				<div className="w-1/5">
					<StatesDropdown onChange={handleStateChange} />
				</div>
				<Input
					type="search"
					placeholder="Cari masjid/ surau/ institusi..."
					className="w-full rounded-full bg-background px-4 py-2 text-sm border border-gray-400 dark:border-slate-900"
					value={searchQuery}
					onChange={handleSearchChange}
				/>
			</div>
		</div>
	);
});

Filters.displayName = "Filters";

export default Filters;

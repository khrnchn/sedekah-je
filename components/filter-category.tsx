import { type Institution, categories } from "@/app/types/institutions";
import Image from "next/image";
import type React from "react";
import { useState } from "react";

type Props = {
	onCategoryChange: (categories: string[]) => void;
	selectedState: string;
	institutions: Institution[];
};

const FilterCategory = ({
	onCategoryChange,
	selectedState,
	institutions,
}: Props) => {
	const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

	const mappedCategories = Object.keys(categories).map((category) => ({
		label: categories[category as keyof typeof categories].label,
		value: category,
		icon: categories[category as keyof typeof categories].icon,
	}));

	const handleCategoryClick = (categoryValue: string) => {
		const newSelectedCategories = selectedCategories.includes(categoryValue)
			? selectedCategories.filter((c) => c !== categoryValue)
			: [...selectedCategories, categoryValue];

		setSelectedCategories(newSelectedCategories);
		onCategoryChange(newSelectedCategories);
	};

	const getCountForCategory = (category: string) => {
		return institutions.filter(
			(institution) =>
				(!selectedState || institution.state === selectedState) &&
				institution.category === category,
		).length;
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-center flex-row flex-wrap gap-2">
				{mappedCategories.map((category) => (
					<button
						type="button"
						key={category.value}
						onClick={() => handleCategoryClick(category.value)}
						data-active={selectedCategories.includes(category.value)}
						className="px-4 py-2 text-sm max-sm:text-xs font-bold data-[active=true]:bg-slate-500 data-[active=true]:text-white truncate select-none flex flex-row gap-2 items-center justify-center whitespace-nowrap bg-background w-fit border border-border rounded-full shadow-md dark:shadow-muted/50"
					>
						<Image
							src={category.icon}
							alt={category.label}
							width={24}
							height={24}
							className="hidden sm:block"
						/>
						<span className="md:hidden">{category.label}</span>
						<span className="hidden md:block">{category.label}</span>
						<span className="rounded-full px-2 py-1 bg-slate-200 text-black">
							{getCountForCategory(category.value)}
						</span>
					</button>
				))}
			</div>
		</div>
	);
};

export default FilterCategory;

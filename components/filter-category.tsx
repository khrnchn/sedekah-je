import Image from "next/image";
import { useState } from "react";
import { categories, type Institution } from "@/app/types/institutions";
import {
	type CanonicalInstitutionCategory,
	normalizeInstitutionCategory,
} from "@/lib/institution-categories";

type Props = {
	onCategoryChange: (categories: string[]) => void;
	selectedState: string;
	institutions: Institution[];
	initialCategories?: string[];
	categoryCounts?: Partial<Record<CanonicalInstitutionCategory, number>>;
};

const FilterCategory = ({
	onCategoryChange,
	selectedState,
	institutions,
	initialCategories,
	categoryCounts,
}: Props) => {
	const [selectedCategories, setSelectedCategories] = useState<string[]>(
		initialCategories || [],
	);
	const [prevInitialCategories, setPrevInitialCategories] =
		useState(initialCategories);
	if (prevInitialCategories !== initialCategories) {
		setPrevInitialCategories(initialCategories);
		setSelectedCategories(initialCategories || []);
	}

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
		const normalizedCategory = normalizeInstitutionCategory(category);
		if (categoryCounts) return categoryCounts[normalizedCategory] ?? 0;

		return institutions.filter(
			(institution) =>
				(!selectedState || institution.state === selectedState) &&
				normalizeInstitutionCategory(institution.category) ===
					normalizedCategory,
		).length;
	};

	return (
		<div>
			<div className="flex flex-row flex-wrap items-center justify-center gap-2">
				{mappedCategories.map((category) => (
					<button
						type="button"
						key={category.value}
						onClick={() => handleCategoryClick(category.value)}
						aria-pressed={selectedCategories.includes(category.value)}
						data-active={selectedCategories.includes(category.value)}
						className="group flex min-h-10 w-fit select-none flex-row items-center justify-center gap-2 truncate whitespace-nowrap rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold shadow-sm transition-colors duration-200 ease-out hover:border-primary/30 hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 data-[active=true]:border-primary data-[active=true]:bg-primary data-[active=true]:text-primary-foreground max-sm:text-xs"
					>
						<Image
							src={category.icon}
							alt={category.label}
							width={24}
							height={24}
							unoptimized
							className="hidden sm:block"
						/>
						<span className="md:hidden">{category.label}</span>
						<span className="hidden md:block">{category.label}</span>
						<span className="rounded-md border border-transparent bg-muted px-2 py-0.5 text-xs font-bold tabular-nums text-muted-foreground transition-colors group-data-[active=true]:border-primary-foreground/25 group-data-[active=true]:bg-primary-foreground group-data-[active=true]:text-primary">
							{getCountForCategory(category.value)}
						</span>
					</button>
				))}
			</div>
		</div>
	);
};

export default FilterCategory;

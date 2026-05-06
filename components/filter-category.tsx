import Image from "next/image";
import { useState } from "react";
import { categories, type Institution } from "@/app/types/institutions";
import {
	type CanonicalInstitutionCategory,
	getInstitutionCategoryIconDimensions,
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
		iconDimensions: getInstitutionCategoryIconDimensions(category),
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
						className="group flex min-h-10 w-fit select-none flex-row items-center justify-center gap-2 truncate whitespace-nowrap rounded-md border border-border/25 bg-card/70 px-3 py-2 text-sm font-semibold shadow-[0_1px_1px_oklch(var(--foreground)/0.02)] transition-colors duration-200 ease-out hover:border-primary/22 hover:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 data-[active=true]:border-primary/75 data-[active=true]:bg-primary data-[active=true]:text-primary-foreground max-sm:text-xs"
					>
						<Image
							src={category.icon}
							alt={category.label}
							width={category.iconDimensions.width}
							height={category.iconDimensions.height}
							unoptimized
							className="hidden sm:block"
							style={{
								height: "auto",
								width: "24px",
							}}
						/>
						<span className="md:hidden">{category.label}</span>
						<span className="hidden md:block">{category.label}</span>
						<span className="rounded-md border border-transparent bg-muted/80 px-2 py-0.5 text-xs font-bold tabular-nums text-muted-foreground transition-colors group-data-[active=true]:border-primary-foreground/25 group-data-[active=true]:bg-primary-foreground group-data-[active=true]:text-primary">
							{getCountForCategory(category.value)}
						</span>
					</button>
				))}
			</div>
		</div>
	);
};

export default FilterCategory;

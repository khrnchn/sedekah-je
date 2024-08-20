import { categories } from "@/app/types/institutions";
import React, { useEffect, useState } from "react";
import { StatesDropdown } from "../states-dropdown";

type Props = {
	onChange: (props: {
		categories: string[];
		state: string;
	}) => void;
};

const Filters = (props: Props) => {
	const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
	const [selectedState, setSelectedState] = useState<string>("");
	const mappedCategories = Object.keys(categories).map((category) => ({
		label: categories[category as keyof typeof categories].label,
		value: category,
	}));

	const handleStateFilters = (props: { state: string }) => {
		setSelectedState(props.state);
	};

	useEffect(() => {
		props.onChange(
			{
				categories: selectedCategories,
				state: selectedState
			});
	}, [selectedCategories, selectedState, props]);

	return (
		<div className="flex flex-wrap gap-4 justify-between max-md:justify-center">
			<div className="grid grid-flow-col gap-2 items-center">
				<p className="max-sm:text-xs">Pilih Tapisan: </p>
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
						className="px-2 py-1 rounded text-sm max-sm:text-xs font-bold data-[active=true]:bg-blue-500 data-[active=true]:text-white truncate select-none"
					>
						{category.label}
					</button>
				))}
			</div>
			<StatesDropdown onChange={handleStateFilters} className="max-md:min-w-full" />
		</div>
	);
};

export default Filters;

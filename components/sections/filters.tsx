import { categories } from "@/app/types/institutions";
import React, { useEffect, useState } from "react";
import { StatesDropdown } from "../states-dropdown";
import { institutions } from "../../app/data/institutions";

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
			<div className="grid grid-flow-col gap-1 items-center">
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
						className="px-4 py-2 rounded-xl text-sm max-sm:text-xs font-bold data-[active=true]:bg-slate-500 data-[active=true]:text-white truncate select-none flex flex-row gap-2 items-center justify-center"
					>
						{category.label}
						<span className="rounded-full px-2 py-1 bg-slate-200 text-black">{institutions.filter(ins => ins.category === category.value).length}</span>
					</button>
				))}
			</div>
			<StatesDropdown onChange={handleStateFilters} className="max-md:min-w-full" />
		</div>
	);
};

export default Filters;
